const express = require('express');
const PartnerEarning = require('../models/PartnerEarning');
const Partner = require('../models/Partner');
const { protect, superAdminOnly, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Partner: Get own earnings
router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, earnings: [] });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month) filter.month = req.query.month;

    const earnings = await PartnerEarning.find(filter)
      .populate('orderId', 'orderNumber finalAmount customerName')
      .populate('studentId', 'fullName phone email')
      .populate('referredPartnerId', 'instituteName franchiseId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: earnings.length, earnings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Partner: Get earnings summary
router.get('/summary', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, summary: { totalEarnings: 0, pendingAmount: 0, paidAmount: 0, thisMonthAmount: 0, centerRoyalty: 0, referralCommission: 0 } });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const all = await PartnerEarning.find(filter);
    const totalEarnings = all.reduce((s, e) => s + e.amount, 0);
    const pendingAmount = all.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
    const paidAmount = all.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
    const thisMonthAmount = all.filter(e => e.month === currentMonth).reduce((s, e) => s + e.amount, 0);
    const centerRoyalty = all.filter(e => e.type === 'center_royalty').reduce((s, e) => s + e.amount, 0);
    const referralCommission = all.filter(e => e.type === 'referral_commission').reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      summary: {
        totalEarnings,
        pendingAmount,
        paidAmount,
        thisMonthAmount,
        centerRoyalty,
        referralCommission,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all partner earnings
router.get('/all', protect, superAdminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month) filter.month = req.query.month;
    if (req.query.partnerId) filter.partnerId = req.query.partnerId;

    const earnings = await PartnerEarning.find(filter)
      .populate('partnerId', 'instituteName franchiseId city')
      .populate('orderId', 'orderNumber finalAmount customerName')
      .populate('studentId', 'fullName phone email')
      .populate('referredPartnerId', 'instituteName franchiseId')
      .sort({ createdAt: -1 });

    // Overall summary
    const totalPending = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
    const totalPaid = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
    const totalAmount = earnings.reduce((s, e) => s + e.amount, 0);

    // Group by partner
    const byPartner = {};
    earnings.forEach(e => {
      const pid = e.partnerId?._id?.toString() || 'unknown';
      if (!byPartner[pid]) {
        byPartner[pid] = {
          partnerId: pid,
          instituteName: e.partnerId?.instituteName || 'Unknown',
          franchiseId: e.partnerId?.franchiseId || '',
          city: e.partnerId?.city || '',
          centerRoyalty: 0,
          referralCommission: 0,
          pending: 0,
          paid: 0,
          total: 0,
        };
      }
      byPartner[pid].total += e.amount;
      if (e.status === 'pending') byPartner[pid].pending += e.amount;
      else byPartner[pid].paid += e.amount;
      if (e.type === 'center_royalty') byPartner[pid].centerRoyalty += e.amount;
      else byPartner[pid].referralCommission += e.amount;
    });

    res.json({
      success: true,
      count: earnings.length,
      earnings,
      summary: { totalAmount, totalPending, totalPaid },
      byPartner: Object.values(byPartner),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Settle earnings for a partner + month
router.post('/settle', protect, superAdminOnly, async (req, res) => {
  try {
    const { partnerId, month } = req.body;
    if (!partnerId || !month) {
      return res.status(400).json({ success: false, message: 'partnerId and month are required' });
    }

    const result = await PartnerEarning.updateMany(
      { partnerId, month, status: 'pending' },
      { $set: { status: 'paid', settledAt: new Date() } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} earnings settled for ${month}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Settle all pending earnings for a month (all partners)
router.post('/settle-all', protect, superAdminOnly, async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'month is required' });
    }

    const result = await PartnerEarning.updateMany(
      { month, status: 'pending' },
      { $set: { status: 'paid', settledAt: new Date() } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} earnings settled for ${month}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
