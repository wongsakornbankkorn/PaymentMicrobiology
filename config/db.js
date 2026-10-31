/**
 * Database Connection Manager (MySQL2 with Promise Support)
 * Follows Rule 4 (No Hardcoding) and Rule 6 (Parameterized Queries)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

// Initialize connection pool
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dept_treasury',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+07:00'
    });
  }
  return pool;
}

/**
 * Execute parameterized query safely
 * Rule 6: Enforces parameterized queries to protect against SQL Injection
 * @param {string} sql - SQL query with '?' placeholders
 * @param {Array} params - Bound parameter values
 */
async function query(sql, params = []) {
  try {
    const p = getPool();
    const [results] = await p.execute(sql, params);
    isConnected = true;
    return results;
  } catch (error) {
    // If database connection fails, log reason and let caller handle fallback
    console.warn(`[DB WARN] Query execution failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test Database Connection
 */
async function testConnection() {
  try {
    const p = getPool();
    const connection = await p.getConnection();
    console.log(`[DB SUCCESS] Connected to MySQL (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME})`);
    connection.release();
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`[DB NOTICE] MySQL not yet connected (${error.code || error.message}). Will run with in-memory fallback until DB is initialized.`);
    isConnected = false;
    return false;
  }
}

module.exports = {
  query,
  getPool,
  testConnection,
  isDbConnected: () => isConnected
};
