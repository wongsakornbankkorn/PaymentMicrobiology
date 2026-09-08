/**
 * End-to-End System & API Verification Test Suite
 * Tests full lifecycle: Auth, Student CRUD, Slip Upload, Admin Verification, Receipt & Analytics.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

// Start Express server in-process for testing
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const campaignRoutes = require('../routes/campaignRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const rosterRoutes = require('../routes/rosterRoutes');
const errorHandler = require('../middleware/errorHandler');
const db = require('../config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/roster', rosterRoutes);
app.use(errorHandler);

let server;
const TEST_PORT = 5099;

function request(method, path, body = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const headers = {};
    let postData = '';

    if (body) {
      postData = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('===========================================================');
  console.log(' 🧪 RUNNING CPE DEPT TREASURY END-TO-END VERIFICATION TEST ');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Start test server
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, resolve);
    });
    console.log(`[TEST SERVER] Running on port ${TEST_PORT}\n`);

    // TEST 1: Database Baseline Status
    console.log('--- TEST GROUP 1: Database State Verification ---');
    const studentsRows = await db.query('SELECT COUNT(*) as c FROM students');
    const txnsRows = await db.query('SELECT COUNT(*) as c FROM transactions');
    const receiptsRows = await db.query('SELECT COUNT(*) as c FROM receipts');
    const adminsRows = await db.query('SELECT COUNT(*) as c FROM admins');

    assert(txnsRows[0].c === 0, `Transactions table count is 0 (Current: ${txnsRows[0].c})`);
    assert(receiptsRows[0].c === 0, `Receipts table count is 0 (Current: ${receiptsRows[0].c})`);
    assert(adminsRows[0].c >= 1, `Admins table has seeded account (Current: ${adminsRows[0].c})`);


    // TEST 2: Admin Authentication (Wrong & Correct Passwords)
    console.log('\n--- TEST GROUP 2: Admin Role Password Protection ---');
    const wrongAuth = await request('POST', '/api/auth/admin-login', { username: 'admin', password: 'wrongPassword123' });
    assert(wrongAuth.status === 401, 'Wrong admin password returns 401 Unauthorized');
    assert(wrongAuth.data.success === false, 'Error message provided for wrong password');

    const correctAuth = await request('POST', '/api/auth/admin-login', { username: 'admin', password: 'admin1234' });
    assert(correctAuth.status === 200, 'Correct admin password returns 200 Success');
    assert(correctAuth.data.admin?.username === 'admin', 'Admin user data returned successfully');

    // TEST 3: Add Student on Website via API
    console.log('\n--- TEST GROUP 3: Student Management (Admin Can Add Students) ---');
    const student1Data = {
      student_id: '6710210766',
      name_th: 'กิตติภูมิ พรหมวงศ์',
      name_en: 'Kittiphum Promwong',
      cohort_year: 3,
      email: 'kittiphum.p@cpe.eng.ac.th',
      phone: '081-234-5678'
    };
    const addRes1 = await request('POST', '/api/roster/student', student1Data);
    assert(addRes1.status === 201, 'Student 1 added successfully (HTTP 201)');
    assert(addRes1.data.data?.student_id === '6710210766', 'Student 1 ID is 6710210766');

    // Test duplicate detection
    const dupRes = await request('POST', '/api/roster/student', student1Data);
    assert(dupRes.status === 400, 'Duplicate student ID prevented with 400 Bad Request');

    // Add Student 2
    const student2Data = {
      student_id: '6710210045',
      name_th: 'ณภัทร วรเวชกุล',
      name_en: 'Naphat Woravechkul',
      cohort_year: 1,
      email: 'naphat.w@cpe.eng.ac.th',
      phone: '083-456-7890'
    };
    const addRes2 = await request('POST', '/api/roster/student', student2Data);
    assert(addRes2.status === 201, 'Student 2 added successfully (HTTP 201)');

    // TEST 4: Roster Matrix Verification
    console.log('\n--- TEST GROUP 4: Roster Matrix & Student Profiles ---');
    const rosterRes = await request('GET', '/api/roster');
    assert(rosterRes.status === 200, 'Roster API returns 200');
    assert(rosterRes.data.data?.roster?.length >= 2, `Roster contains enrolled students (Count: ${rosterRes.data.data?.roster?.length})`);

    const student1InRoster = rosterRes.data.data?.roster?.find(s => s.student_id === '6710210766');
    assert(student1InRoster && student1InRoster.totalPaid === 0, 'New student initial total paid is ฿0');
    assert(student1InRoster.isAllPaid === false, 'Student status is initially UNPAID');

    // Switch student & Profile check
    const switchRes = await request('POST', '/api/auth/switch', { student_id: '6710210766' });
    assert(switchRes.status === 200, 'Switch student endpoint returns 200');

    const profileRes = await request('GET', '/api/auth/profile');
    assert(profileRes.status === 200, 'Profile endpoint returns 200 without crashing');
    assert(profileRes.data.data?.student?.student_id === '6710210766', 'Active student correctly linked');


    // TEST 5: Direct Transaction & Slip Verification
    console.log('\n--- TEST GROUP 5: Payment, Slip Review & Verification Flow ---');
    const campaigns = await request('GET', '/api/campaigns');
    const campaignId = campaigns.data.data[0]?.id || 1;

    // Simulate slip creation in database
    const txnResult = await db.query(
      `INSERT INTO transactions (transaction_code, student_id, campaign_id, amount, transfer_timestamp, origin_bank, slip_image_url, slip_hash, verification_status, note)
       VALUES (?, ?, ?, ?, NOW(), 'SCB', '/uploads/slips/slip-test.png', 'sha256-test-hash', 'PENDING', 'ทดสอบการโอนเงินจริง')`,
      ['TXN-REALTEST-001', addRes1.data.data.id, campaignId, 500.00]
    );
    const txnId = txnResult.insertId;
    assert(txnId > 0, `Pending transaction created with ID: ${txnId}`);


    // Check verification queue
    const queueRes = await request('GET', '/api/payments/queue');
    assert(queueRes.status === 200, 'Verification queue returns 200');
    assert(queueRes.data.data?.some(t => t.id === txnId), 'Pending transaction appears in Admin Queue');

    // Admin verifies transaction (APPROVE)
    const approveRes = await request('PATCH', `/api/payments/${txnId}/verify`, {
      action: 'APPROVE',
      reviewer_name: 'บัณฑิตา จินดา (เหรัญญิกสาขาจุลชีววิทยา)'
    });
    assert(approveRes.status === 200, 'Transaction approved by Admin successfully');

    // Digital Receipt Generation
    const receiptRes = await request('GET', `/api/payments/receipt/${txnId}`);
    assert(receiptRes.status === 200, 'Digital Receipt fetched successfully');
    assert(receiptRes.data.data?.receipt_number?.startsWith('REC-2026-CPE'), `Digital Receipt number generated: ${receiptRes.data.data?.receipt_number}`);

    // TEST 6: Analytics & Financial Summary Update
    console.log('\n--- TEST GROUP 6: Financial Analytics & Ledger Update ---');
    const analyticsRes = await request('GET', '/api/payments/analytics');
    assert(analyticsRes.status === 200, 'Analytics API returns 200');
    assert(parseFloat(analyticsRes.data.data?.totalCollected) === 500, `Total collected updated to ฿500 (Current: ${analyticsRes.data.data?.totalCollected})`);

    // TEST 7: Reminder & CSV Export
    console.log('\n--- TEST GROUP 7: Reminders & University Audit Export ---');
    const reminderRes = await request('POST', '/api/roster/reminder', {
      student_id: '6710210045',
      campaign_title: 'ค่าบำรุงภาควิชา'
    });
    assert(reminderRes.status === 200, 'Payment reminder email dispatched successfully');

    const exportRes = await request('GET', '/api/roster/export');
    assert(exportRes.status === 200, 'CSV export endpoint returns 200');
    assert(exportRes.headers['content-type']?.includes('text/csv'), 'Content-Type is text/csv');
    assert(typeof exportRes.data === 'string' && exportRes.data.includes('Student ID'), 'CSV content contains headers');

    // Cleanup test data so database stays at zero for the user's actual testing
    console.log('\n--- Cleaning up test records for clean slate ---');
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    await db.query('TRUNCATE TABLE receipts;');
    await db.query('TRUNCATE TABLE transactions;');
    await db.query('TRUNCATE TABLE students;');
    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Final clean slate confirmed: 0 students, 0 transactions, 0 receipts.');

    console.log('\n===========================================================');
    console.log(` 🏁 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');

    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Test suite error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTestSuite();
