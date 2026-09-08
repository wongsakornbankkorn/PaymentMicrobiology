/**
 * Roster Ledger & Audit API Routes
 */

const express = require('express');
const router = express.Router();
const rosterController = require('../controllers/rosterController');

// GET /api/roster (Cohort roster matrix with search/filter)
router.get('/', rosterController.getRoster);

// POST /api/roster/student (Add new student directly)
router.post('/student', rosterController.createStudent);

// DELETE /api/roster/student/:id (Delete student)
router.delete('/student/:id', rosterController.deleteStudent);

// POST /api/roster/reminder (Send email payment reminder)
router.post('/reminder', rosterController.sendReminder);

// GET /api/roster/export (Download audit CSV)
router.get('/export', rosterController.exportCsv);

module.exports = router;
