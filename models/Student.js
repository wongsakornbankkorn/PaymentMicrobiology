/**
 * Student Model
 * Handles data access for students with parameterized SQL queries (Rule 6).
 */

const db = require('../config/db');

// In-memory student repository (empty, to be populated from database)
let memoryStudents = [];


class Student {
  /**
   * Get all enrolled students with optional cohort filter
   */
  static async findAll(cohort = null) {
    try {
      if (cohort && cohort !== 'ALL') {
        const sql = 'SELECT * FROM students WHERE cohort_year = ? ORDER BY student_id ASC';
        return await db.query(sql, [cohort]);
      }
      const sql = 'SELECT * FROM students ORDER BY cohort_year ASC, student_id ASC';
      return await db.query(sql);
    } catch (err) {
      if (cohort && cohort !== 'ALL') {
        return memoryStudents.filter(s => s.cohort_year === parseInt(cohort, 10));
      }
      return [...memoryStudents];
    }
  }

  /**
   * Find student by internal ID
   */
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM students WHERE id = ? LIMIT 1';
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (err) {
      return memoryStudents.find(s => s.id === parseInt(id, 10)) || null;
    }
  }

  /**
   * Find student by Student ID (e.g., 6710210766)
   */
  static async findByStudentId(studentId) {
    try {
      const sql = 'SELECT * FROM students WHERE student_id = ? LIMIT 1';
      const rows = await db.query(sql, [studentId]);
      return rows[0] || null;
    } catch (err) {
      return memoryStudents.find(s => s.student_id === studentId) || null;
    }
  }

  /**
   * Find first enrolled student (useful as default active student)
   */
  static async findFirst() {
    try {
      const sql = 'SELECT * FROM students ORDER BY cohort_year ASC, student_id ASC LIMIT 1';
      const rows = await db.query(sql);
      return rows[0] || null;
    } catch (err) {
      return memoryStudents[0] || null;
    }
  }

  /**
   * Create a new student (Rule 6: Parameterized Query)
   */
  static async create({ student_id, name_th, name_en, cohort_year, email, phone, status = 'ENROLLED' }) {
    // ถ้าไม่กรอกอีเมลให้เก็บเป็น NULL เพื่อหลีกเลี่ยง UNIQUE constraint violation
    // (MySQL อนุญาตให้มี NULL ซ้ำกันได้ แต่ไม่อนุญาต '' ซ้ำกัน)
    const trimmedEmail = email ? String(email).trim() : '';
    const cleanEmail = trimmedEmail && trimmedEmail !== '-' && trimmedEmail !== '' ? trimmedEmail : null;

    try {
      const sql = `
        INSERT INTO students (student_id, name_th, name_en, cohort_year, email, phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await db.query(sql, [
        student_id,
        name_th,
        name_en || '',
        parseInt(cohort_year, 10),
        cleanEmail,
        phone || '',
        status || 'ENROLLED'
      ]);

      return {
        id: result.insertId,
        student_id,
        name_th,
        name_en,
        cohort_year: parseInt(cohort_year, 10),
        email: cleanEmail,
        phone,
        status: status || 'ENROLLED'
      };
    } catch (err) {
      // Check if duplicate student_id
      const existing = memoryStudents.find(s => s.student_id === student_id);
      if (existing) {
        throw new Error(`รหัสนักศึกษา ${student_id} มีอยู่ในระบบแล้ว`);
      }
      const newStudent = {
        id: memoryStudents.length + 1,
        student_id,
        name_th,
        name_en,
        cohort_year: parseInt(cohort_year, 10),
        email,
        phone,
        status: status || 'ENROLLED'
      };
      memoryStudents.push(newStudent);
      return newStudent;
    }
  }

  /**
   * Delete student by internal ID
   */
  static async delete(id) {
    try {
      const sql = 'DELETE FROM students WHERE id = ?';
      await db.query(sql, [id]);
      return true;
    } catch (err) {
      memoryStudents = memoryStudents.filter(s => s.id !== parseInt(id, 10));
      return true;
    }
  }

  /**
   * Reset in-memory students array
   */
  static clearMemory() {
    memoryStudents = [];
  }
}

module.exports = Student;

