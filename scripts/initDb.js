/**
 * Database Migration and Seeder Script
 * Connects to MySQL, creates database if not exists, runs schema and seed.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('--- Initializing MySQL Database for CPE DeptTreasury ---');
  let connection;
  try {
    // 1. Connect without database selected first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('[1/3] Connected to MySQL server successfully.');

    // 2. Read and run schema.sql
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[2/3] Executed schema.sql successfully (Tables created).');

    // 3. Read and run seed.sql
    const seedPath = path.join(__dirname, '..', 'models', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('[3/3] Executed seed.sql successfully (Initial seed data inserted).');

    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
