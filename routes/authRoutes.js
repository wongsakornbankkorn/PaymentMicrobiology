/**
 * Auth & Profile API Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAdmin, loginRateLimiter } = require('../middleware/authGuard');

// GET /api/auth/profile
router.get('/profile', authController.getProfile);

// POST /api/auth/switch
router.post('/switch', authController.switchStudent);

// GET /api/auth/students
router.get('/students', authController.getStudentsList);

// POST /api/auth/student-login
router.post('/student-login', authController.studentLogin);

// POST /api/auth/student-logout
router.post('/student-logout', authController.studentLogout);

// POST /api/auth/admin-login (Rate Limited: ป้องกัน brute-force)
router.post('/admin-login', loginRateLimiter, authController.adminLogin);

// POST /api/auth/admin-logout (ต้อง login แล้วเท่านั้น)
router.post('/admin-logout', requireAdmin, authController.adminLogout);

module.exports = router;

