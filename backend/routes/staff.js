const express = require('express');
const Staff = require('../models/Staff');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res) => {
  try {
    let filter = { status: 'active' };
    if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    } else {
      return res.status(400).json({ success: false, message: 'Partner ID is required' });
    }
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, staff: [] });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.role) filter.role = req.query.role;
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || staff.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can add staff' });
    }
    if (!req.user.partnerId) {
      return res.status(400).json({ success: false, message: 'Partner profile not found. Please contact support.' });
    }
    const staff = await Staff.create({ ...req.body, partnerId: req.user.partnerId });
    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || staff.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, staff: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || staff.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    staff.status = 'inactive';
    await staff.save();
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
