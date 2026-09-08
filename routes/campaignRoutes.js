/**
 * Campaign API Routes
 */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// GET /api/campaigns
router.get('/', campaignController.getAllCampaigns);

// POST /api/campaigns
router.post('/', campaignController.createCampaign);

module.exports = router;
