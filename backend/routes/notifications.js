const express = require('express');
const Notification = require('../models/Notification');
const { protect, superAdminOnly, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.$or = [
        { type: 'broadcast' },
        { toPartnerId: req.user.partnerId },
        { toUserId: req.user._id },
      ];
    } else if (req.user.role === 'staff' || req.user.role === 'student') {
      filter.$or = [
        { toUserId: req.user._id },
      ];
    }
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/broadcast', protect, superAdminOnly, async (req, res) => {
  try {
    const { title, message } = req.body;
    const notification = await Notification.create({
      title,
      message,
      type: 'broadcast',
      fromUserId: req.user._id,
    });
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/individual', protect, async (req, res) => {
  try {
    const { title, message, toPartnerId, toUserId } = req.body;
    const notification = await Notification.create({
      title,
      message,
      type: 'individual',
      fromUserId: req.user._id,
      toPartnerId,
      toUserId,
    });
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    let filter = { isRead: false };
    if (req.user.role === 'partner') {
      filter.$or = [
        { type: 'broadcast' },
        { toPartnerId: req.user.partnerId },
        { toUserId: req.user._id },
      ];
    } else {
      filter.toUserId = req.user._id;
    }
    await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
