/**
 * Campaign Model
 * Handles data access for payment campaigns with parameterized SQL queries.
 */

const db = require('../config/db');

let memoryCampaigns = [
  { id: 1, title: 'ค่าบำรุงสาขาวิชาจุลชีววิทยา ประจำปีการศึกษา 2568', description: 'กองทุนสนับสนุนกิจกรรมและการดูแลห้องปฏิบัติการทางจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.', category: 'Annual Fee', amount: 500.00, target_cohort: 'ALL', start_date: '2026-08-01', due_date: '2026-09-30', status: 'ACTIVE' },
  { id: 2, title: 'เสื้อกาวน์ปฏิบัติการและเสื้อโปโลสาขาจุลชีววิทยา', description: 'เสื้อกาวน์ห้องปฏิบัติการจุลชีววิทยาปักตรา ม.อ. และเสื้อกิจกรรมรับน้อง', category: 'Uniform', amount: 450.00, target_cohort: 'ALL', start_date: '2026-08-15', due_date: '2026-09-25', status: 'ACTIVE' },
  { id: 3, title: 'ค่ายเตรียมความพร้อมจุลชีววิทยาน้องใหม่ (Microbiology Freshmen Camp)', description: 'กิจกรรมค่ายวิชาการแนะแนวเทคนิคปฏิบัติการทางจุลชีววิทยาและการใช้กล้องจุลทรรศน์', category: 'Camp', amount: 400.00, target_cohort: 'YEAR_1', start_date: '2026-08-10', due_date: '2026-09-20', status: 'ACTIVE' },
  { id: 4, title: 'สัมมนาและนำเสนอโครงงานวิจัยทางจุลชีววิทยา (Microbiology Senior Seminar)', description: 'ค่าวิทยากรและเอกสารประกอบการจัดแสดงผลงานวิจัยโครงงานวิทยาศาสตร์จบการศึกษา', category: 'Seminar', amount: 300.00, target_cohort: 'YEAR_4', start_date: '2026-08-20', due_date: '2026-10-15', status: 'ACTIVE' }
];

class Campaign {
  /**
   * Find all active campaigns
   */
  static async findAllActive() {
    try {
      const sql = 'SELECT * FROM campaigns WHERE status = "ACTIVE" ORDER BY due_date ASC';
      return await db.query(sql);
    } catch (err) {
      return memoryCampaigns.filter(c => c.status === 'ACTIVE');
    }
  }

  /**
   * Find campaign by ID
   */
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM campaigns WHERE id = ? LIMIT 1';
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      return memoryCampaigns.find(c => c.id === parseInt(id, 10)) || null;
    }
  }

  /**
   * Create new campaign (Rule 6: Parameterized Query)
   */
  static async create({ title, description, category, amount, target_cohort, start_date, due_date }) {
    try {
      const sql = `
        INSERT INTO campaigns (title, description, category, amount, target_cohort, start_date, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `;
      const result = await db.query(sql, [title, description, category, amount, target_cohort || 'ALL', start_date, due_date]);
      return { id: result.insertId, title, description, category, amount, target_cohort, start_date, due_date, status: 'ACTIVE' };
    } catch (err) {
      const newCamp = {
        id: memoryCampaigns.length + 1,
        title,
        description,
        category,
        amount: parseFloat(amount),
        target_cohort: target_cohort || 'ALL',
        start_date,
        due_date,
        status: 'ACTIVE'
      };
      memoryCampaigns.push(newCamp);
      return newCamp;
    }
  }
}

module.exports = Campaign;
