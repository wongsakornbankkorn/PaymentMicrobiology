/**
 * Auth & Profile API Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

// POST /api/auth/admin-login
router.post('/admin-login', authController.adminLogin);

// POST /api/auth/admin-logout
router.post('/admin-logout', authController.adminLogout);

module.exports = router;
