/**
 * Auth & Profile Controller
 * Single Responsibility: Manages user context, student profile details,
 * and administrator password authentication with bcrypt.
 * Follows Rule 6 (Parameterized Queries), Rule 7 (PDPA & Bcrypt)
 */

const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');
const Admin = require('../models/Admin');

let activeStudentId = null;

/**
 * Get current authenticated student profile and balance summary
 */
async function getProfile(req, res, next) {
  try {
    let student = null;

    if (activeStudentId) {
      student = await Student.findById(activeStudentId);
    }

    // If no active student or not found, fall back to first enrolled student
    if (!student) {
      student = await Student.findFirst();
      if (student) {
        activeStudentId = student.id;
      }
    }

    // If database has 0 students (clean state)
    if (!student) {
      return res.json({
        success: true,
        data: {
          student: null,
          summary: {
            totalObligation: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOutstanding: 0,
            overdueBalance: 0
          }
        }
      });
    }

    // Calculate balance summary for the active student
    const transactions = await Transaction.findByStudentId(student.id);
    const campaigns = await Campaign.findAllActive();
    // คำนวณยอดค้างชำระจากกิจกรรมที่เกี่ยวข้องกับชั้นปีของนักศึกษาเสมอ
    // ไม่ว่าจะมี transaction หรือยัง เพราะนักศึกษาทุกคนมีภาระค่าใช้จ่ายตามชั้นปี
    const studentCampaigns = campaigns.filter(c => 
      !c.target_cohort || c.target_cohort === 'ALL' || c.target_cohort === `YEAR_${student.cohort_year}`
    );

    const totalObligation = studentCampaigns.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalPaid = transactions
      .filter(t => t.verification_status === 'VERIFIED')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalPending = transactions
      .filter(t => t.verification_status === 'PENDING')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalOutstanding = Math.max(0, totalObligation - totalPaid);

    // ยอดเกินกำหนดชำระ = กิจกรรมที่เลยกำหนด + ยังไม่ได้ชำระสำเร็จ
    const now = new Date();
    const overdueBalance = studentCampaigns
      .filter(c => c.due_date && new Date(c.due_date) < now)
      .filter(c => !transactions.some(t => t.campaign_id === c.id && t.verification_status === 'VERIFIED'))
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);

    res.json({
      success: true,
      data: {
        student,
        summary: {
          totalObligation,
          totalPaid,
          totalPending,
          totalOutstanding,
          overdueBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Switch active student
 */
async function switchStudent(req, res, next) {
  try {
    const { student_id } = req.body;
    const student = await Student.findByStudentId(student_id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'ไม่พบรหัสนักศึกษานี้' });
    }
    activeStudentId = student.id;
    res.json({ success: true, message: `สลับผู้ใช้เป็น ${student.name_th} เรียบร้อยแล้ว`, student });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all students for switcher list
 */
async function getStudentsList(req, res, next) {
  try {
    const students = await Student.findAll();
    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Authentication (Password Protection)
 * Rule 7: Password verification with bcrypt
 */
async function adminLogin(req, res, next) {
  try {
    const { username = 'admin', password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านเหรัญญิก' });
    }

    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'ไม่พบบัญชีผู้ดูแลระบบ' });
    }

    const isMatch = await Admin.verifyPassword(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'รหัสผ่านเหรัญญิกไม่ถูกต้อง' });
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบเหรัญญิกสำเร็จ',
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Student Login (Authentication by Student ID)
 * Rule 6: Parameterized query via Student model
 */
async function studentLogin(req, res, next) {
  try {
    const { student_id } = req.body;
    if (!student_id || !student_id.trim()) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสนักศึกษา' });
    }

    const student = await Student.findByStudentId(student_id.trim());
    if (!student) {
      return res.status(404).json({ success: false, error: `ไม่พบรหัสนักศึกษา ${student_id} ในระบบสาขาจุลชีววิทยา` });
    }

    activeStudentId = student.id;

    res.json({
      success: true,
      message: `เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${student.name_th}`,
      student,
      role: 'STUDENT'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Student Logout
 */
function studentLogout(req, res) {
  activeStudentId = null;
  res.json({
    success: true,
    message: 'ออกจากระบบนักศึกษาเรียบร้อยแล้ว'
  });
}

/**
 * Admin Logout
 */
function adminLogout(req, res) {
  res.json({
    success: true,
    message: 'ออกจากระบบเหรัญญิกเรียบร้อยแล้ว'
  });
}

module.exports = {
  getProfile,
  switchStudent,
  studentLogin,
  studentLogout,
  getStudentsList,
  adminLogin,
  adminLogout,
  getActiveStudentId: () => activeStudentId,
  setActiveStudentId: (id) => { activeStudentId = id; }
};

