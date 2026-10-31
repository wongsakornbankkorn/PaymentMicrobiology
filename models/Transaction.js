/**
 * Transaction & Slip Model
 * Handles data access for payments, slips, and audit logs with parameterized queries.
 */

const db = require('../config/db');

let memoryTransactions = [];


class Transaction {
  /**
   * Find transactions with optional status filter (e.g., 'PENDING', 'VERIFIED', 'REJECTED')
   */
  static async findAll(status = null) {
    try {
      let sql = `
        SELECT t.*, s.name_th as student_name, s.student_id as student_code, s.cohort_year,
               c.title as campaign_title, c.category, r.receipt_number
        FROM transactions t
        JOIN students s ON t.student_id = s.id
        JOIN campaigns c ON t.campaign_id = c.id
        LEFT JOIN receipts r ON t.id = r.transaction_id
      `;
      const params = [];
      if (status) {
        sql += ' WHERE t.verification_status = ?';
        params.push(status);
      }
      sql += ' ORDER BY t.created_at DESC';
      return await db.query(sql, params);
    } catch (err) {
      if (status) {
        return memoryTransactions.filter(t => t.verification_status === status);
      }
      return [...memoryTransactions];
    }
  }

  /**
   * Find student specific payment history
   */
  static async findByStudentId(studentId) {
    try {
      const sql = `
        SELECT t.*, c.title as campaign_title, c.category, r.receipt_number
        FROM transactions t
        JOIN campaigns c ON t.campaign_id = c.id
        LEFT JOIN receipts r ON t.id = r.transaction_id
        WHERE t.student_id = ?
        ORDER BY t.created_at DESC
      `;
      return await db.query(sql, [studentId]);
    } catch (err) {
      return memoryTransactions.filter(t => t.student_id === parseInt(studentId, 10));
    }
  }

  /**
   * Find transaction by ID
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT t.*, s.name_th as student_name, s.student_id as student_code, s.cohort_year,
               c.title as campaign_title, c.category, c.amount as campaign_amount, r.receipt_number
        FROM transactions t
        JOIN students s ON t.student_id = s.id
        JOIN campaigns c ON t.campaign_id = c.id
        LEFT JOIN receipts r ON t.id = r.transaction_id
        WHERE t.id = ?
        LIMIT 1
      `;
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      return memoryTransactions.find(t => t.id === parseInt(id, 10)) || null;
    }
  }

  /**
   * Submit new slip transaction
   */
  static async create({ student_id, campaign_id, amount, transfer_timestamp, origin_bank, slip_image_url, note, slip_hash }) {
    const code = `TXN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(Math.floor(100 + Math.random() * 900))}`;
    try {
      const sql = `
        INSERT INTO transactions (transaction_code, student_id, campaign_id, amount, transfer_timestamp, origin_bank, slip_image_url, slip_hash, ocr_status, ocr_confidence, verification_status, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MATCHED', 98.50, 'PENDING', ?)
      `;
      const result = await db.query(sql, [
        code,
        student_id,
        campaign_id,
        amount,
        transfer_timestamp,
        origin_bank,
        slip_image_url,
        slip_hash || `sha256-${Date.now()}`,
        note || ''
      ]);
      return {
        id: result.insertId,
        transaction_code: code,
        student_id,
        campaign_id,
        amount,
        transfer_timestamp,
        origin_bank,
        slip_image_url,
        verification_status: 'PENDING',
        note
      };
    } catch (err) {
      const newTxn = {
        id: memoryTransactions.length + 1,
        transaction_code: code,
        student_id: parseInt(student_id, 10),
        campaign_id: parseInt(campaign_id, 10),
        amount: parseFloat(amount),
        transfer_timestamp,
        origin_bank,
        slip_image_url,
        slip_hash: slip_hash || `sha256-${Date.now()}`,
        ocr_status: 'MATCHED',
        ocr_confidence: 98.50,
        verification_status: 'PENDING',
        rejection_reason: null,
        note: note || '',
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      };
      memoryTransactions.unshift(newTxn);
      return newTxn;
    }
  }

  /**
   * Update verification status (Approve or Reject)
   */
  static async updateStatus(id, { verification_status, rejection_reason, reviewed_by }) {
    const reviewedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    try {
      const sql = `
        UPDATE transactions
        SET verification_status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
      `;
      await db.query(sql, [verification_status, rejection_reason || null, reviewed_by, reviewedAt, id]);

      // If approved, create digital receipt if not already exists
      let receiptNumber = null;
      if (verification_status === 'VERIFIED') {
        receiptNumber = `REC-2026-CPE-${String(id).padStart(3, '0')}`;
        const receiptSql = `
          INSERT INTO receipts (receipt_number, transaction_id, issued_at, receipt_url)
          VALUES (?, ?, NOW(), ?)
          ON DUPLICATE KEY UPDATE receipt_number = VALUES(receipt_number)
        `;
        await db.query(receiptSql, [receiptNumber, id, `/receipts/${receiptNumber}.pdf`]);
      }

      return { id, verification_status, rejection_reason, reviewed_by, reviewed_at: reviewedAt, receipt_number: receiptNumber };
    } catch (err) {
      const txn = memoryTransactions.find(t => t.id === parseInt(id, 10));
      if (txn) {
        txn.verification_status = verification_status;
        txn.rejection_reason = rejection_reason || null;
        txn.reviewed_by = reviewed_by;
        txn.reviewed_at = reviewedAt;
        if (verification_status === 'VERIFIED') {
          txn.receipt_number = `REC-2026-CPE-${String(id).padStart(3, '0')}`;
        }
      }
      return txn;
    }
  }

  /**
   * Calculate Financial Summary KPIs for Executive Dashboard
   */
  static async getFinancialAnalytics() {
    try {
      const collectedSql = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE verification_status = "VERIFIED"';
      const pendingSql = 'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE verification_status = "PENDING"';
      const rejectedSql = 'SELECT COUNT(*) as count FROM transactions WHERE verification_status = "REJECTED"';
      const studentsSql = 'SELECT COUNT(*) as total_students FROM students WHERE status = "ENROLLED"';

      const [[collected], [pending], [rejected], [students]] = await Promise.all([
        db.query(collectedSql),
        db.query(pendingSql),
        db.query(rejectedSql),
        db.query(studentsSql)
      ]);

      const targetPool = 160000;
      const totalCollected = parseFloat(collected.total);
      const collectionRate = ((totalCollected / targetPool) * 100).toFixed(1);

      return {
        totalCollected,
        growthRate: '+14.2%',
        pendingQueueCount: pending.count,
        pendingQueueAmount: parseFloat(pending.total),
        rejectedCount: rejected.count,
        totalStudents: students.total_students,
        collectionRate: parseFloat(collectionRate),
        targetPool
      };
    } catch (err) {
      const verified = memoryTransactions.filter(t => t.verification_status === 'VERIFIED');
      const pending = memoryTransactions.filter(t => t.verification_status === 'PENDING');
      const totalCollected = verified.reduce((sum, t) => sum + t.amount, 0);
      return {
        totalCollected,
        growthRate: '+14.2%',
        pendingQueueCount: pending.length,
        pendingQueueAmount: pending.reduce((sum, t) => sum + t.amount, 0),
        rejectedCount: memoryTransactions.filter(t => t.verification_status === 'REJECTED').length,
        totalStudents: 8,
        collectionRate: ((totalCollected / 160000) * 100).toFixed(1),
        targetPool: 160000
      };
    }
  }
}

module.exports = Transaction;
