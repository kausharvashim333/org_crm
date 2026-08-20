const express = require('express');
const Royalty = require('../models/Royalty');
const Partner = require('../models/Partner');
const Fee = require('../models/Fee');
const { protect, superAdminOnly, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.partnerId = req.user.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    const royalties = await Royalty.find(filter).populate('partnerId', 'instituteName city').sort({ createdAt: -1 });
    res.json({ success: true, count: royalties.length, royalties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/generate', protect, superAdminOnly, async (req, res) => {
  try {
    const { partnerId, period } = req.body;
    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
    const existing = await Royalty.findOne({ partnerId, period });
    if (existing) return res.status(400).json({ success: false, message: 'Royalty already generated for this period' });
    const startDate = new Date(period + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    const fees = await Fee.find({ partnerId, createdAt: { $gte: startDate, $lte: endDate } });
    const totalRevenue = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const royaltyAmount = Math.round((totalRevenue * partner.royaltyPercent) / 100);
    const royalty = await Royalty.create({
      partnerId,
      period,
      totalRevenue,
      royaltyPercent: partner.royaltyPercent,
      royaltyAmount,
      pendingAmount: royaltyAmount,
      dueDate: new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ success: true, royalty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/payment', protect, async (req, res) => {
  try {
    const { amount, mode, transactionId, remarks } = req.body;
    const royalty = await Royalty.findById(req.params.id);
    if (!royalty) return res.status(404).json({ success: false, message: 'Royalty record not found' });
    if (req.user.role === 'partner' && royalty.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const receiptNo = `ROY-${Date.now()}`;
    royalty.payments.push({ amount, mode, transactionId, remarks, receiptNo });
    royalty.paidAmount += amount;
    royalty.pendingAmount = royalty.royaltyAmount - royalty.paidAmount;
    if (royalty.pendingAmount <= 0) {
      royalty.status = 'paid';
    } else if (royalty.paidAmount > 0) {
      royalty.status = 'partial';
    }
    await royalty.save();
    res.json({ success: true, royalty, receiptNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
