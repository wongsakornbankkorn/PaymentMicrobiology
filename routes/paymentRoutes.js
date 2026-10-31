/**
 * Payment & Slip API Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const upload = require('../middleware/upload');
const { requireAdmin } = require('../middleware/authGuard');

// GET /api/payments/my-payments
router.get('/my-payments', paymentController.getStudentPayments);

// GET /api/payments/queue (Admin verification queue — ต้อง login เป็น admin)
router.get('/queue', requireAdmin, paymentController.getVerificationQueue);

// GET /api/payments/analytics (Executive summary — ต้อง login เป็น admin)
router.get('/analytics', requireAdmin, paymentController.getAnalytics);

// GET /api/payments/receipt/:id (Digital receipt details)
router.get('/receipt/:id', paymentController.getReceipt);

// GET /api/payments/:id (Split-view transaction detail)
router.get('/:id', paymentController.getTransactionDetails);

// POST /api/payments/upload (Submit bank slip)
router.post('/upload', upload.single('slip'), paymentController.uploadSlip);

// PATCH /api/payments/:id/verify (Approve/Reject slip — ต้อง login เป็น admin)
router.patch('/:id/verify', requireAdmin, paymentController.verifyTransaction);

module.exports = router;

