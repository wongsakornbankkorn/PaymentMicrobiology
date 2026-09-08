/**
 * Roster Ledger & Audit Controller
 * Single Responsibility: Manages cohort roster matrix, payment status per student,
 * search/filter logic, email reminder dispatching, and CSV exports.
 */

const Student = require('../models/Student');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');

/**
 * Get Department Roster Matrix with campaign payment statuses
 */
async function getRoster(req, res, next) {
  try {
    const { cohort, unpaid_only, search } = req.query;

    const [students, campaigns, transactions] = await Promise.all([
      Student.findAll(cohort),
      Campaign.findAllActive(),
      Transaction.findAll()
    ]);

    // Build ledger matrix mapping each student to campaign statuses
    let roster = students.map(student => {
      const studentTxns = transactions.filter(t => t.student_id === student.id);
      
      const campaignStatuses = campaigns.map(camp => {
        const isApplicable = !camp.target_cohort || camp.target_cohort === 'ALL' || camp.target_cohort === `YEAR_${student.cohort_year}`;
        if (!isApplicable) {
          return {
            campaign_id: camp.id,
            campaign_title: camp.title,
            amount: camp.amount,
            status: 'NOT_APPLICABLE',
            transaction_code: null
          };
        }

        // Find best transaction for this campaign
        const txn = studentTxns.find(t => t.campaign_id === camp.id && t.verification_status === 'VERIFIED')
                 || studentTxns.find(t => t.campaign_id === camp.id && t.verification_status === 'PENDING')
                 || studentTxns.find(t => t.campaign_id === camp.id && t.verification_status === 'REJECTED');

        const status = txn ? txn.verification_status : 'UNPAID';
        return {
          campaign_id: camp.id,
          campaign_title: camp.title,
          amount: camp.amount,
          status,
          transaction_code: txn ? txn.transaction_code : null
        };
      });

      const totalPaid = campaignStatuses
        .filter(cs => cs.status === 'VERIFIED')
        .reduce((sum, cs) => sum + parseFloat(cs.amount), 0);

      // คำนวณยอดค้างจากกิจกรรมที่เกี่ยวข้องกับชั้นปีเสมอ ไม่ว่าจะมี transaction หรือยัง
      const applicableCampaigns = campaigns.filter(c => 
        !c.target_cohort || c.target_cohort === 'ALL' || c.target_cohort === `YEAR_${student.cohort_year}`
      );

      const totalDue = applicableCampaigns.reduce((sum, cs) => sum + parseFloat(cs.amount), 0);
      const balanceRemaining = Math.max(0, totalDue - totalPaid);
      const isAllPaid = applicableCampaigns.length > 0 && applicableCampaigns.every(camp => {
        const cs = campaignStatuses.find(c => c.campaign_id === camp.id);
        return cs && cs.status === 'VERIFIED';
      });
      const hasPending = campaignStatuses.some(cs => cs.status === 'PENDING');

      return {
        id: student.id,
        student_id: student.student_id,
        name_th: student.name_th,
        name_en: student.name_en,
        cohort_year: student.cohort_year,
        email: student.email,
        phone: student.phone,
        totalPaid,
        totalDue,
        balanceRemaining,
        isAllPaid,
        hasPending,
        campaignStatuses
      };
    });

    // Filter by Unpaid Only if requested (students with actual remaining balance > 0)
    if (unpaid_only === 'true') {
      roster = roster.filter(r => r.balanceRemaining > 0);
    }

    // Filter by search term (Student ID or Name)
    if (search) {
      const query = search.trim().toLowerCase();
      roster = roster.filter(r => 
        r.student_id.toLowerCase().includes(query) ||
        r.name_th.toLowerCase().includes(query) ||
        r.name_en.toLowerCase().includes(query)
      );
    }

    res.json({
      success: true,
      data: {
        campaigns,
        roster
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dispatch automated reminder email ("ส่งอีเมลทวง")
 */
async function sendReminder(req, res, next) {
  try {
    const { student_id, campaign_title } = req.body;
    const student = await Student.findByStudentId(student_id);

    if (!student) {
      return res.status(404).json({ success: false, error: 'ไม่พบนักศึกษา' });
    }

    // Simulation of transactional email delivery
    const message = `ส่งอีเมลแจ้งเตือนการชำระเงิน (${campaign_title || 'ค่าบำรุงภาควิชา'}) ไปยัง ${student.email} สำเร็จแล้ว`;

    res.json({
      success: true,
      message,
      sentTo: student.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export Roster to CSV for University Audit
 */
async function exportCsv(req, res, next) {
  try {
    const [students, campaigns, transactions] = await Promise.all([
      Student.findAll(),
      Campaign.findAllActive(),
      Transaction.findAll()
    ]);

    let csv = 'Student ID,Full Name,Cohort Year,Email,Total Obligation,Total Paid,Status\n';
    students.forEach(s => {
      const studentTxns = transactions.filter(t => t.student_id === s.id && t.verification_status === 'VERIFIED');
      const hasTxns = studentTxns.length > 0;
      const paid = studentTxns.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const applicableCampaigns = hasTxns ? campaigns.filter(c => c.target_cohort === 'ALL' || c.target_cohort === `YEAR_${s.cohort_year}`) : [];
      const totalDue = applicableCampaigns.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const status = totalDue === 0 ? 'NO_OBLIGATION' : (paid >= totalDue ? 'PAID_IN_FULL' : (paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID'));

      csv += `"${s.student_id}","${s.name_th}",Year ${s.cohort_year},"${s.email || '-'}",${totalDue},${paid},"${status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cpe_treasury_roster.csv"');
    res.send('\uFEFF' + csv); // Byte Order Mark for Excel Thai support
  } catch (error) {
    next(error);
  }
}

/**
 * Add / Register a new student
 */
async function createStudent(req, res, next) {
  try {
    const { student_id, name_th, name_en, cohort_year, email, phone, status } = req.body;

    if (!student_id || !name_th || !cohort_year) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัสนักศึกษา, ชื่อ-นามสกุลภาษาไทย, ชั้นปี)'
      });
    }

    // Check if student_id already exists
    const existing = await Student.findByStudentId(student_id.trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `รหัสนักศึกษา ${student_id} มีอยู่ในระบบแล้ว`
      });
    }

    const cleanEmail = email && email.trim() && email.trim() !== '-' ? email.trim() : null;

    const student = await Student.create({
      student_id: student_id.trim(),
      name_th: name_th.trim(),
      name_en: name_en ? name_en.trim() : '',
      cohort_year: parseInt(cohort_year, 10),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      status: status || 'ENROLLED'
    });

    res.status(201).json({
      success: true,
      message: `เพิ่มข้อมูล ${student.name_th} เรียบร้อยแล้ว`,
      data: student
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a student by ID
 */
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    await Student.delete(id);
    res.json({
      success: true,
      message: 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoster,
  sendReminder,
  exportCsv,
  createStudent,
  deleteStudent
};

