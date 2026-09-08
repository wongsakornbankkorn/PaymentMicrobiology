/**
 * Campaign Controller
 * Single Responsibility: Manages fee collection campaigns and categories.
 */

const Campaign = require('../models/Campaign');

/**
 * Get all active campaigns
 */
async function getAllCampaigns(req, res, next) {
  try {
    const campaigns = await Campaign.findAllActive();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new payment collection campaign
 */
async function createCampaign(req, res, next) {
  try {
    const { title, description, category, amount, target_cohort, start_date, due_date } = req.body;

    if (!title || !category || !amount || !due_date) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ชื่อกิจกรรม, หมวดหมู่, จำนวนเงิน, วันครบกำหนด)'
      });
    }

    const campaign = await Campaign.create({
      title,
      description: description || '',
      category,
      amount: parseFloat(amount),
      target_cohort: target_cohort || 'ALL',
      start_date: start_date || new Date().toISOString().slice(0, 10),
      due_date
    });

    res.status(201).json({
      success: true,
      message: 'สร้างรายการเก็บเงินสำเร็จ',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCampaigns,
  createCampaign
};
