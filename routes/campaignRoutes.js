/**
 * Campaign API Routes
 */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { requireAdmin } = require('../middleware/authGuard');

// GET /api/campaigns
router.get('/', campaignController.getAllCampaigns);

// POST /api/campaigns (สร้างรายการเก็บเงิน — ต้อง login เป็น admin)
router.post('/', requireAdmin, campaignController.createCampaign);

module.exports = router;

