/**
 * Database Reset and Zero-State Initialization Script
 * Cleans all transactional records, receipts, and mock students.
 * Prepares the database for real-world production trial.
 * Seeds the default Admin account with bcrypt password protection.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
  console.log('=======================================================');
  console.log(' 🔄 Starting Clean Database Reset (Zero State Ready)    ');
  console.log('=======================================================');

  let connection;
  try {
    // 1. Connect to MySQL database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dept_treasury',
      multipleStatements: true
    });

    console.log('[1/5] Connected to MySQL database successfully.');

    // 2. Ensure schema.sql (including admins table) is up-to-date
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[2/5] Verified database schema and tables (including admins table).');

    // 3. Clear data and reset auto-increments
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE receipts;');
    await connection.query('TRUNCATE TABLE transactions;');
    await connection.query('TRUNCATE TABLE students;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('[3/5] Cleared all records: receipts (0), transactions (0), students (0).');

    // 4. Seed or ensure default Admin account
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    const adminName = 'บัณฑิตา จินดา (เหรัญญิกสาขาจุลชีววิทยา)';
    
    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Upsert admin account
    const [existing] = await connection.query('SELECT id FROM admins WHERE username = ?', [defaultUsername]);
    if (existing.length === 0) {
      await connection.query(
        'INSERT INTO admins (username, password_hash, name, role) VALUES (?, ?, ?, "ADMIN")',
        [defaultUsername, passwordHash, adminName]
      );
      console.log(`[4/5] Created default admin account: "${defaultUsername}" with secure bcrypt hash.`);
    } else {
      await connection.query(
        'UPDATE admins SET password_hash = ?, name = ? WHERE username = ?',
        [passwordHash, adminName, defaultUsername]
      );
      console.log(`[4/5] Updated admin account: "${defaultUsername}" with secure bcrypt hash.`);
    }

    // 5. Clean mock files from uploads/slips
    const slipsDir = path.join(__dirname, '..', 'uploads', 'slips');
    if (fs.existsSync(slipsDir)) {
      const files = fs.readdirSync(slipsDir);
      for (const file of files) {
        if (!file.startsWith('slip-demo-') && file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
          try {
            fs.unlinkSync(path.join(slipsDir, file));
          } catch (e) {}
        }
      }
    }
    console.log('[5/5] Cleaned temporary uploads directory.');

    // Verify row counts
    const [studentsCount] = await connection.query('SELECT COUNT(*) as c FROM students');
    const [campaignsCount] = await connection.query('SELECT COUNT(*) as c FROM campaigns');
    const [transactionsCount] = await connection.query('SELECT COUNT(*) as c FROM transactions');
    const [receiptsCount] = await connection.query('SELECT COUNT(*) as c FROM receipts');
    const [adminsCount] = await connection.query('SELECT COUNT(*) as c FROM admins');

    console.log('-------------------------------------------------------');
    console.log(`📊 Final Table Counts in Database:`);
    console.log(`   - students:     ${studentsCount[0].c} (พร้อมให้แอดมินเพิ่มผ่านเว็บ)`);
    console.log(`   - campaigns:    ${campaignsCount[0].c}`);
    console.log(`   - transactions: ${transactionsCount[0].c} (เป็น 0 เรียบร้อย)`);
    console.log(`   - receipts:     ${receiptsCount[0].c} (เป็น 0 เรียบร้อย)`);
    console.log(`   - admins:       ${adminsCount[0].c} (บัญชี "${defaultUsername}" รหัสผ่าน "${defaultPassword}")`);
    console.log('-------------------------------------------------------');
    console.log('✅ Database is now 100% clean and ready for real testing!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
