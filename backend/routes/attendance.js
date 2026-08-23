const express = require('express');
const Attendance = require('../models/Attendance');
const StaffAttendance = require('../models/StaffAttendance');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/student', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, records: [] });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.batchId) filter.batchId = req.query.batchId;
    if (req.query.date) filter.date = new Date(req.query.date);
    const records = await Attendance.find(filter).populate('batchId', 'name').populate('records.studentId', 'fullName').sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/student', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { batchId, date, records } = req.body;
    const attendanceDate = new Date(date);
    const existing = await Attendance.findOne({ batchId, date: attendanceDate });
    if (existing) {
      existing.records = records;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json({ success: true, record: existing });
    }
    const record = await Attendance.create({
      partnerId: req.user.role === 'partner' ? req.user.partnerId : req.body.partnerId,
      batchId,
      date: attendanceDate,
      records,
      markedBy: req.user._id,
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/staff', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, records: [] });
      filter.partnerId = req.user.partnerId;
    }
    if (req.query.date) filter.date = new Date(req.query.date);
    const records = await StaffAttendance.find(filter).populate('records.staffId', 'name role').sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/staff', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { date, records } = req.body;
    const attendanceDate = new Date(date);
    const partnerId = req.user.role === 'partner' ? req.user.partnerId : req.body.partnerId;
    const existing = await StaffAttendance.findOne({ partnerId, date: attendanceDate });
    if (existing) {
      existing.records = records;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json({ success: true, record: existing });
    }
    const record = await StaffAttendance.create({
      partnerId,
      date: attendanceDate,
      records,
      markedBy: req.user._id,
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
