const express = require('express');
const Batch = require('../models/Batch');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, batches: [] });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const batches = await Batch.find(filter)
      .populate('courseId', 'name fee duration code')
      .populate('teacherId', 'name')
      .populate('trainerId', 'name email phone avatar')
      .populate('enrolledStudents', 'fullName phone email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: batches.length, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('courseId')
      .populate('teacherId', 'name phone qualification subjects')
      .populate('trainerId', 'name email phone avatar')
      .populate('enrolledStudents', 'fullName phone email photo status');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || (batch.partnerId && batch.partnerId.toString() !== req.user.partnerId.toString()))) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    const isPartner = req.user.role === 'partner';
    const cleanBody = { ...req.body };
    if (!cleanBody.teacherId) delete cleanBody.teacherId;
    if (!cleanBody.trainerId) delete cleanBody.trainerId;
    if (!cleanBody.endDate) delete cleanBody.endDate;
    if (!cleanBody.courseId) {
      return res.status(400).json({ success: false, message: 'Course is required' });
    }

    let partnerId = undefined;
    if (isPartner) {
      if (!req.user.partnerId) {
        return res.status(400).json({ success: false, message: 'Partner profile not found. Please contact support.' });
      }
      partnerId = req.user.partnerId;
    } else if (cleanBody.partnerId) {
      partnerId = cleanBody.partnerId;
    }

    const batch = await Batch.create({ ...cleanBody, partnerId });
    res.status(201).json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || batch.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const cleanBody = { ...req.body };
    if (!cleanBody.teacherId) delete cleanBody.teacherId;
    if (!cleanBody.endDate) delete cleanBody.endDate;
    const updated = await Batch.findByIdAndUpdate(req.params.id, cleanBody, { new: true, runValidators: true });
    res.json({ success: true, batch: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/enroll', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.body;
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || batch.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (batch.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student already enrolled' });
    }
    if (batch.enrolledStudents.length >= batch.maxStudents) {
      return res.status(400).json({ success: false, message: 'Batch is full' });
    }
    batch.enrolledStudents.push(studentId);
    await batch.save();
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || batch.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    batch.status = 'cancelled';
    await batch.save();
    res.json({ success: true, message: 'Batch cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
