/**
 * Create Admin CLI Script
 * Creates or updates an administrator/treasurer account with secure bcrypt hashing.
 * 
 * Usage:
 *   node scripts/createAdmin.js <username> <password> "<name>"
 * 
 * Example:
 *   node scripts/createAdmin.js treasurer pass1234 "สมชาย ใจดี (เหรัญญิก)"
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.ADMIN_USERNAME || 'admin';
  const password = args[1] || process.env.ADMIN_PASSWORD || 'admin1234';
  const name = args[2] || 'ผู้ดูแลระบบ/เหรัญญิกสาขา';

  if (!username || !password) {
    console.error('❌ วิธีใช้งาน: node scripts/createAdmin.js <username> <password> [name]');
    process.exit(1);
  }

  console.log('--- ระบบสร้างบัญชีแอดมิน (Admin / Treasurer) ---');
  console.log(`👤 Username: ${username}`);
  console.log(`🏷️  Name:     ${name}`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dept_treasury'
    });

    // Hash password ด้วย bcrypt ตาม Rule 7
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ตรวจสอบว่ามี username นี้อยู่แล้วหรือไม่
    const [existing] = await connection.query(
      'SELECT id FROM admins WHERE username = ? LIMIT 1',
      [username]
    );

    if (existing.length > 0) {
      // อัปเดตรหัสผ่านใหม่
      await connection.query(
        'UPDATE admins SET password_hash = ?, name = ? WHERE username = ?',
        [passwordHash, name, username]
      );
      console.log(`✅ อัปเดตรหัสผ่านของแอดมิน "${username}" เรียบร้อยแล้ว!`);
    } else {
      // เพิ่มแอดมินใหม่
      await connection.query(
        'INSERT INTO admins (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [username, passwordHash, name, 'ADMIN']
      );
      console.log(`✅ สร้างบัญชีแอดมิน "${username}" สำเร็จเรียบร้อย!`);
    }

    process.exit(0);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ ไม่สามารถเชื่อมต่อ MySQL ได้ (MySQL อาจจะยังไม่ได้เปิด)');
      console.log(`💡 หากรันในโหมด In-memory (ไม่มี MySQL):`);
      console.log(`   ระบบจะใช้ค่าเริ่มต้นจาก .env:`);
      console.log(`   - ADMIN_USERNAME=${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   - ADMIN_PASSWORD=${process.env.ADMIN_PASSWORD || 'admin1234'}`);
    } else {
      console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

createAdmin();
