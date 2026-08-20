const express = require('express');
const Inquiry = require('../models/Inquiry');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/public/central', async (req, res) => {
  try {
    const { name, phone, email, courseInterest, message } = req.body;
    const inquiry = await Inquiry.create({
      type: 'student',
      name,
      phone,
      email,
      courseInterest,
      message,
    });
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/partner', async (req, res) => {
  try {
    const { instituteName, contactName, phone, email, location, spaceArea, message } = req.body;
    const inquiry = await Inquiry.create({
      type: 'partner',
      name: contactName,
      phone,
      email,
      instituteName,
      location,
      spaceArea,
      message,
    });
    res.status(201).json({ success: true, message: 'Partner inquiry submitted successfully', inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/:partnerId', async (req, res) => {
  try {
    const { name, phone, email, courseInterest, message } = req.body;
    const inquiry = await Inquiry.create({
      type: 'student',
      partnerId: req.params.partnerId,
      name,
      phone,
      email,
      courseInterest,
      message,
    });
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.partnerId = req.user.partnerId;
      filter.type = 'student';
    } else {
      if (req.query.type) {
        filter.type = req.query.type;
      }
    }
    if (req.query.status) filter.status = req.query.status;
    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    if (req.user.role === 'partner' && inquiry.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    inquiry.status = status;
    await inquiry.save();
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/followup', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { note } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    if (req.user.role === 'partner' && inquiry.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    inquiry.followUpNotes.push({ note, addedBy: req.user._id });
    await inquiry.save();
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
