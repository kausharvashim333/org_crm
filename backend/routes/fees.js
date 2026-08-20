const express = require('express');
const Fee = require('../models/Fee');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const fees = await Fee.find(filter)
      .populate('studentId', 'fullName phone')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: fees.length, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId courseId batchId');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    if (req.user.role === 'partner' && fee.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can create fee records' });
    }
    const fee = await Fee.create({ ...req.body, partnerId: req.user.partnerId });
    res.status(201).json({ success: true, fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/payment', protect, partnerOrAdmin, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    if (req.user.role === 'partner' && fee.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { amount, mode, transactionId, remarks } = req.body;
    const receiptNo = `RCP-${Date.now()}`;
    fee.payments.push({ amount, mode, transactionId, remarks, receiptNo, collectedBy: req.user._id });
    fee.paidAmount += amount;
    fee.pendingAmount = fee.totalFee - fee.discount - fee.paidAmount;
    if (fee.pendingAmount <= 0) {
      fee.status = 'paid';
    } else if (fee.paidAmount > 0) {
      fee.status = 'partial';
    }
    await fee.save();
    res.json({ success: true, fee, receiptNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    if (req.user.role === 'partner' && fee.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, fee: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
