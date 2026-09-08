import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CAMPAIGNS, INITIAL_TRANSACTIONS, INITIAL_STUDENTS_ROSTER } from '../data/mockData';

export const supabaseApi = {
  // --------------------------------------------------------------------------
  // 1. CAMPAIGNS
  // --------------------------------------------------------------------------
  async getFeeCampaigns(cohortYear = null) {
    if (!isSupabaseConfigured()) {
      return INITIAL_CAMPAIGNS;
    }

    try {
      let query = supabase
        .from('fee_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      if (!cohortYear) return data || [];

      // Filter for target cohort: 'ALL' or matching cohort
      const cohortStr = String(cohortYear);
      return (data || []).filter(c => {
        const tc = String(c.target_cohort).toUpperCase();
        return tc === 'ALL' || tc === cohortStr || tc === `YEAR_${cohortStr}`;
      });
    } catch (err) {
      console.error('getFeeCampaigns error, fallback to mock:', err);
      return INITIAL_CAMPAIGNS;
    }
  },

  async createFeeCampaign({ title, description, amount, dueDate, targetCohort, adminId }) {
    if (!isSupabaseConfigured()) {
      const newCamp = {
        id: 'camp_' + Date.now(),
        title,
        description,
        amount: parseFloat(amount),
        due_date: new Date(dueDate).toISOString(),
        target_cohort: targetCohort || 'ALL',
        is_active: true,
      };
      return newCamp;
    }

    const { data, error } = await supabase
      .from('fee_campaigns')
      .insert({
        title,
        description,
        amount: parseFloat(amount),
        due_date: new Date(dueDate).toISOString(),
        target_cohort: targetCohort || 'ALL',
        created_by: adminId,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // 2. TRANSACTIONS (STUDENT)
  // --------------------------------------------------------------------------
  async getStudentTransactions(studentProfileId) {
    if (!isSupabaseConfigured() || !studentProfileId) {
      return INITIAL_TRANSACTIONS;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          fee_campaigns (
            id,
            title,
            amount,
            due_date,
            target_cohort
          )
        `)
        .eq('student_id', studentProfileId)
        .order('transfer_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('getStudentTransactions error:', err);
      return INITIAL_TRANSACTIONS;
    }
  },

  async submitTransaction({ studentId, campaignId, amountPaid, slipImageUrl, transferDate }) {
    if (!isSupabaseConfigured()) {
      return {
        id: 'tx_' + Date.now(),
        student_id: studentId,
        campaign_id: campaignId,
        amount_paid: parseFloat(amountPaid),
        slip_image_url: slipImageUrl,
        transfer_date: transferDate || new Date().toISOString(),
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        student_id: studentId,
        campaign_id: campaignId,
        amount_paid: parseFloat(amountPaid),
        slip_image_url: slipImageUrl,
        transfer_date: transferDate || new Date().toISOString(),
        status: 'PENDING',
      })
      .select(`
        *,
        fee_campaigns (
          id,
          title,
          amount
        )
      `)
      .single();

    if (error) {
      console.error('submitTransaction error:', error);
      throw error;
    }
    return data;
  },

  // --------------------------------------------------------------------------
  // 3. TRANSACTIONS (ADMIN VERIFICATION QUEUE)
  // --------------------------------------------------------------------------
  async getVerificationQueue(statusFilter = null) {
    if (!isSupabaseConfigured()) {
      return INITIAL_TRANSACTIONS.map(t => ({
        ...t,
        student: {
          student_id: '6610210001',
          full_name: 'นายตัวอย่าง ทดสอบ',
          cohort_year: 2,
        },
        campaign: {
          title: t.campaign_title || 'ค่าบำรุงภาควิชา',
          amount: t.amount_paid,
        },
      }));
    }

    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          student:profiles!transactions_student_id_fkey (
            id,
            student_id,
            full_name,
            cohort_year
          ),
          campaign:fee_campaigns!transactions_campaign_id_fkey (
            id,
            title,
            amount,
            due_date
          )
        `)
        .order('transfer_date', { ascending: false });

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('getVerificationQueue error:', err);
      return [];
    }
  },

  async verifyTransaction({ transactionId, status, rejectReason = null, adminId }) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new Error('สถานะต้องเป็น APPROVED หรือ REJECTED');
    }

    if (!isSupabaseConfigured()) {
      return {
        id: transactionId,
        status,
        reject_reason: rejectReason,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        reject_reason: status === 'REJECTED' ? rejectReason : null,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('verifyTransaction error:', error);
      throw error;
    }
    return data;
  },

  // --------------------------------------------------------------------------
  // 4. STUDENT LEDGER (FILTERABLE & EXPORTABLE)
  // --------------------------------------------------------------------------
  async getStudentLedger() {
    if (!isSupabaseConfigured()) {
      return INITIAL_STUDENTS_ROSTER.map(s => ({
        id: s.id,
        student_id: s.student_id,
        full_name: s.name_th,
        cohort_year: s.cohort_year,
        totalRequired: 2200,
        totalPaid: s.status === 'APPROVED' ? 2200 : 0,
        balanceRemaining: s.status === 'APPROVED' ? 0 : 2200,
        hasPending: false,
        transaction_count: 1,
      }));
    }

    try {
      // 1. Fetch all students
      const { data: students, error: sErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'STUDENT')
        .order('student_id', { ascending: true });

      if (sErr) throw sErr;

      // 2. Fetch all active campaigns
      const { data: campaigns, error: cErr } = await supabase
        .from('fee_campaigns')
        .select('*')
        .eq('is_active', true);

      if (cErr) throw cErr;

      // 3. Fetch all transactions
      const { data: transactions, error: tErr } = await supabase
        .from('transactions')
        .select('*');

      if (tErr) throw tErr;

      // Compute aggregate ledger per student
      return (students || []).map(student => {
        const studentCohort = String(student.cohort_year);

        // Applicable campaigns for student's cohort
        const applicableCamps = (campaigns || []).filter(c => {
          const tc = String(c.target_cohort).toUpperCase();
          return tc === 'ALL' || tc === studentCohort || tc === `YEAR_${studentCohort}`;
        });

        const totalRequired = applicableCamps.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        // Student transactions
        const sTxns = (transactions || []).filter(t => t.student_id === student.id);
        const approvedTxns = sTxns.filter(t => t.status === 'APPROVED');
        const hasPending = sTxns.some(t => t.status === 'PENDING');
        const totalPaid = approvedTxns.reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);

        return {
          id: student.id,
          student_id: student.student_id,
          full_name: student.full_name,
          cohort_year: student.cohort_year,
          totalRequired,
          totalPaid,
          balanceRemaining: Math.max(0, totalRequired - totalPaid),
          hasPending,
          transaction_count: sTxns.length,
        };
      });
    } catch (err) {
      console.error('getStudentLedger error:', err);
      return [];
    }
  },
};
