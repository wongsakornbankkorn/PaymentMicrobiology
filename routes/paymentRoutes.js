/**
 * Payment & Slip API Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const upload = require('../middleware/upload');

// GET /api/payments/my-payments
router.get('/my-payments', paymentController.getStudentPayments);

// GET /api/payments/queue (Admin verification queue)
router.get('/queue', paymentController.getVerificationQueue);

// GET /api/payments/analytics (Executive summary KPIs)
router.get('/analytics', paymentController.getAnalytics);

// GET /api/payments/receipt/:id (Digital receipt details)
router.get('/receipt/:id', paymentController.getReceipt);

// GET /api/payments/:id (Split-view transaction detail)
router.get('/:id', paymentController.getTransactionDetails);

// POST /api/payments/upload (Submit bank slip)
router.post('/upload', upload.single('slip'), paymentController.uploadSlip);

// PATCH /api/payments/:id/verify (Approve/Reject slip)
router.patch('/:id/verify', paymentController.verifyTransaction);

module.exports = router;
