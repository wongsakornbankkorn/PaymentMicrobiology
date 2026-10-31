/**
 * Administrator & Treasurer Model
 * Handles data access for administrative users and secure authentication.
 * Follows Rule 6 (Parameterized Queries), Rule 7 (Bcrypt Password Hashing)
 */

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
   * Find admin by username
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    try {
      const sql = 'SELECT * FROM admins WHERE username = ? LIMIT 1';
      const rows = await db.query(sql, [username]);
      return rows[0] || null;
    } catch (err) {
      return memoryAdmins.find(a => a.username === username) || null;
    }
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
   * Verify plaintext password against stored bcrypt hash
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
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
