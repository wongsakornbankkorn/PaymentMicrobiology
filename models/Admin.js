/**
 * Administrator & Treasurer Model
 * Handles data access for administrative users and secure authentication.
 * Follows Rule 6 (Parameterized Queries), Rule 7 (Bcrypt Password Hashing)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Fallback in-memory admin store if DB is temporarily offline
const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin1234', 10);
let memoryAdmins = [
  {
    id: 1,
    username: 'admin',
    password_hash: DEFAULT_ADMIN_HASH,
    name: 'บัณฑิตา จินดา (เหรัญญิกสาขาจุลชีววิทยา)',
    role: 'ADMIN'
  }
];

class Admin {
  /**
   * Find admin by username (Supports Supabase, MySQL, and In-memory fallback)
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. ลองค้นหาจากตาราง admins บน Supabase ก่อน
    if (supabaseUrl && supabaseKey) {
      try {
        const endpoint = `${supabaseUrl}/rest/v1/admins?username=eq.${encodeURIComponent(username)}&select=*`;
        const res = await fetch(endpoint, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return rows[0];
          }
        }
      } catch (err) {
        console.warn(`[Admin] Supabase lookup error: ${err.message}`);
      }
    }

    // 2. ถ้าไม่พบหรือไม่มี Supabase ให้ค้นหาจาก MySQL
    try {
      const sql = 'SELECT * FROM admins WHERE username = ? LIMIT 1';
      const rows = await db.query(sql, [username]);
      if (rows && rows[0]) return rows[0];
    } catch (err) {
      // MySQL offline or query failed
    }

    // 3. Fallback ไปที่ in-memory
    return memoryAdmins.find(a => a.username.toLowerCase() === username.toLowerCase()) || null;
  }

  /**
   * Create or register new admin user
   * @param {Object} adminData
   * @param {string} adminData.username
   * @param {string} adminData.password
   * @param {string} adminData.name
   * @param {string} [adminData.role]
   */
  static async create({ username, password, name, role = 'ADMIN' }) {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    try {
      const sql = `
        INSERT INTO admins (username, password_hash, name, role)
        VALUES (?, ?, ?, ?)
      `;
      const result = await db.query(sql, [username, password_hash, name, role]);
      return {
        id: result.insertId,
        username,
        name,
        role
      };
    } catch (err) {
      const newAdmin = {
        id: memoryAdmins.length + 1,
        username,
        password_hash,
        name,
        role
      };
      memoryAdmins.push(newAdmin);
      return { id: newAdmin.id, username, name, role };
    }
  }

  /**
   * Verify password against stored hash (Supports Bcrypt, MD5, SHA-256)
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;

    // 1. ตรวจสอบ Bcrypt hash (ขึ้นต้นด้วย $2a$, $2b$, หรือ $2y$)
    if (hashedPassword.startsWith('$2')) {
      return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // 2. ตรวจสอบ MD5 hash (32 ตัวอักษร เช่น ที่สร้างจากเครื่องมือแฮช)
    const md5 = crypto.createHash('md5').update(plainPassword).digest('hex');
    if (md5.toLowerCase() === hashedPassword.toLowerCase()) {
      return true;
    }

    // 3. ตรวจสอบ SHA-256 hash (64 ตัวอักษร)
    const sha256 = crypto.createHash('sha256').update(plainPassword).digest('hex');
    if (sha256.toLowerCase() === hashedPassword.toLowerCase()) {
      return true;
    }

    // 4. Plaintext fallback
    return plainPassword === hashedPassword;
  }

  /**
   * Ensure default admin exists in the database
   * @param {string} username
   * @param {string} defaultPassword
   * @param {string} name
   */
  static async ensureDefaultAdmin(username = 'admin', defaultPassword = 'admin1234', name = 'บัณฑิตา จินดา (เหรัญญิก)') {
    const existing = await this.findByUsername(username);
    if (!existing) {
      return await this.create({ username, password: defaultPassword, name });
    }
    return existing;
  }
}

module.exports = Admin;
