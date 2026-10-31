/**
 * Roster Ledger & Audit API Routes
 */

const express = require('express');
const router = express.Router();
const rosterController = require('../controllers/rosterController');
const { requireAdmin } = require('../middleware/authGuard');

// GET /api/roster (Cohort roster matrix with search/filter)
router.get('/', rosterController.getRoster);

// POST /api/roster/student (Add new student — ต้อง login เป็น admin)
router.post('/student', requireAdmin, rosterController.createStudent);

// DELETE /api/roster/student/:id (Delete student — ต้อง login เป็น admin)
router.delete('/student/:id', requireAdmin, rosterController.deleteStudent);

// POST /api/roster/reminder (Send email payment reminder — ต้อง login เป็น admin)
router.post('/reminder', requireAdmin, rosterController.sendReminder);

// GET /api/roster/export (Download audit CSV — ต้อง login เป็น admin)
router.get('/export', requireAdmin, rosterController.exportCsv);

module.exports = router;

