const express = require('express');
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middleware/auth');

const router = express.Router();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@liliorg.in',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get VAPID public key (public endpoint)
router.get('/vapid-public-key', (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription object' });
    }

    const role = req.user.role;
    const partnerId = req.user.partnerId || null;

    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        role,
        partnerId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unsubscribe
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint required' });
    }
    await PushSubscription.deleteOne({ userId: req.user.id, endpoint });
    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notification to a specific user
router.post('/send', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin' && req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { userId, title, body, url } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, message: 'userId, title, and body required' });
    }

    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) {
      return res.json({ success: false, message: 'No subscriptions found for this user' });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Clean up failed subscriptions (410 Gone or 404 Not Found)
    const failedSubs = results
      .map((r, i) => r.status === 'rejected' ? subscriptions[i] : null)
      .filter(Boolean);
    if (failedSubs.length > 0) {
      await PushSubscription.deleteMany({
        _id: { $in: failedSubs.map(s => s._id) },
      });
    }

    res.json({ success: true, message: `Notification sent to ${succeeded} device(s)`, succeeded, failed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to send push notification to a user (for internal use)
async function sendPushNotification(userId, { title, body, url }) {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) return { sent: 0 };

    const payload = JSON.stringify({ title, body, url: url || '/' });
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;

    // Clean up failed subscriptions
    const failedSubs = results
      .map((r, i) => r.status === 'rejected' ? subscriptions[i] : null)
      .filter(Boolean);
    if (failedSubs.length > 0) {
      await PushSubscription.deleteMany({
        _id: { $in: failedSubs.map(s => s._id) },
      });
    }

    return { sent: succeeded };
  } catch (error) {
    console.error('[Push Notification Error]', error.message);
    return { sent: 0, error: error.message };
  }
}

// Helper: Send to all partners
async function sendPushToAllPartners({ title, body, url }) {
  try {
    const subscriptions = await PushSubscription.find({ role: 'partner' });
    if (subscriptions.length === 0) return { sent: 0 };

    const payload = JSON.stringify({ title, body, url: url || '/partner/dashboard' });
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;

    const failedSubs = results
      .map((r, i) => r.status === 'rejected' ? subscriptions[i] : null)
      .filter(Boolean);
    if (failedSubs.length > 0) {
      await PushSubscription.deleteMany({
        _id: { $in: failedSubs.map(s => s._id) },
      });
    }

    return { sent: succeeded };
  } catch (error) {
    console.error('[Push Notification Error]', error.message);
    return { sent: 0, error: error.message };
  }
}

// Helper: Send to all students of a partner
async function sendPushToPartnerStudents(partnerId, { title, body, url }) {
  try {
    const Student = require('../models/Student');
    const students = await Student.find({ partnerId }).select('userId');
    const userIds = students.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return { sent: 0 };

    const subscriptions = await PushSubscription.find({ userId: { $in: userIds } });
    if (subscriptions.length === 0) return { sent: 0 };

    const payload = JSON.stringify({ title, body, url: url || '/student/dashboard' });
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;

    const failedSubs = results
      .map((r, i) => r.status === 'rejected' ? subscriptions[i] : null)
      .filter(Boolean);
    if (failedSubs.length > 0) {
      await PushSubscription.deleteMany({
        _id: { $in: failedSubs.map(s => s._id) },
      });
    }

    return { sent: succeeded };
  } catch (error) {
    console.error('[Push Notification Error]', error.message);
    return { sent: 0, error: error.message };
  }
}

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;
module.exports.sendPushToAllPartners = sendPushToAllPartners;
module.exports.sendPushToPartnerStudents = sendPushToPartnerStudents;
