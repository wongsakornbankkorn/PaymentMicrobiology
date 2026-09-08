/**
 * Receipt Model
 * Handles data access for digital tax/department receipts with parameterized queries.
 */

const db = require('../config/db');

class Receipt {
  /**
   * Find receipt by transaction ID
   */
  static async findByTransactionId(transactionId) {
    try {
      const sql = `
        SELECT r.*, t.transaction_code, t.amount, t.transfer_timestamp, t.origin_bank,
               s.student_id as student_code, s.name_th as student_name, s.cohort_year,
               c.title as campaign_title, c.category
        FROM receipts r
        JOIN transactions t ON r.transaction_id = t.id
        JOIN students s ON t.student_id = s.id
        JOIN campaigns c ON t.campaign_id = c.id
        WHERE r.transaction_id = ?
        LIMIT 1
      `;
      const rows = await db.query(sql, [transactionId]);
      return rows[0] || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Find receipt by Receipt Number (e.g. REC-2026-CPE-001)
   */
  static async findByNumber(receiptNumber) {
    try {
      const sql = `
        SELECT r.*, t.transaction_code, t.amount, t.transfer_timestamp, t.origin_bank,
               s.student_id as student_code, s.name_th as student_name, s.cohort_year,
               c.title as campaign_title, c.category
        FROM receipts r
        JOIN transactions t ON r.transaction_id = t.id
        JOIN students s ON t.student_id = s.id
        JOIN campaigns c ON t.campaign_id = c.id
        WHERE r.receipt_number = ?
        LIMIT 1
      `;
      const rows = await db.query(sql, [receiptNumber]);
      return rows[0] || null;
    } catch (err) {
      return null;
    }
  }
}

module.exports = Receipt;
