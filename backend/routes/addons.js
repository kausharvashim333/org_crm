const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Addon = require('../models/Addon');
const PartnerAddon = require('../models/PartnerAddon');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Razorpay Client
let razorpayClient = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'D8Mqui5388u2E9bjOYL5uWDw';

if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayClient = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  } catch (err) {
    console.error('Razorpay init error in addons.js:', err);
  }
}

// ============ ADMIN ROUTES ============

// Get all add-ons (admin)
router.get('/admin', protect, superAdminOnly, async (req, res) => {
  try {
    const addons = await Addon.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, count: addons.length, addons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create add-on (admin)
router.post('/admin', protect, superAdminOnly, async (req, res) => {
  try {
    const addon = await Addon.create(req.body);
    res.status(201).json({ success: true, addon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update add-on (admin)
router.put('/admin/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const addon = await Addon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
    res.json({ success: true, addon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete add-on (admin)
router.delete('/admin/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const addon = await Addon.findByIdAndDelete(req.params.id);
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });
    await PartnerAddon.deleteMany({ addonId: req.params.id });
    res.json({ success: true, message: 'Add-on deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all partner add-on purchases (admin)
router.get('/admin/purchases', protect, superAdminOnly, async (req, res) => {
  try {
    let filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.partnerId) filter.partnerId = req.query.partnerId;
    const purchases = await PartnerAddon.find(filter)
      .populate('partnerId', 'instituteName franchiseId city')
      .populate('addonId', 'name key icon')
      .populate('activatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: purchases.length, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin manually activate add-on for partner
router.post('/admin/activate', protect, superAdminOnly, async (req, res) => {
  try {
    const { partnerId, addonId, billingCycle, pricePaid, adminNote } = req.body;
    const addon = await Addon.findById(addonId);
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });

    let expiresAt = null;
    if (billingCycle === 'monthly') expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    else if (billingCycle === 'yearly') expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    let pa = await PartnerAddon.findOne({ partnerId, addonId });
    if (pa) {
      pa.status = 'active';
      pa.billingCycle = billingCycle || addon.billingCycle;
      pa.pricePaid = pricePaid || 0;
      pa.paymentMode = 'manual_admin';
      pa.activatedBy = req.user._id;
      pa.activatedAt = new Date();
      pa.expiresAt = expiresAt;
      pa.adminNote = adminNote || '';
      await pa.save();
    } else {
      pa = await PartnerAddon.create({
        partnerId, addonId, addonKey: addon.key, addonName: addon.name,
        status: 'active', billingCycle: billingCycle || addon.billingCycle,
        pricePaid: pricePaid || 0, paymentMode: 'manual_admin',
        activatedBy: req.user._id, activatedAt: new Date(), expiresAt, adminNote: adminNote || '',
      });
    }
    res.json({ success: true, partnerAddon: pa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin deactivate add-on for partner
router.put('/admin/deactivate/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const pa = await PartnerAddon.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!pa) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, partnerAddon: pa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PARTNER ROUTES ============

// Get available add-ons (partner store)
router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    const addons = await Addon.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    // Get partner's active add-ons
    let partnerAddons = [];
    if (req.user.role === 'partner' && req.user.partnerId) {
      partnerAddons = await PartnerAddon.find({ partnerId: req.user.partnerId, status: 'active' });
    } else if (req.query.partnerId) {
      partnerAddons = await PartnerAddon.find({ partnerId: req.query.partnerId, status: 'active' });
    }
    const activeKeys = partnerAddons.map(pa => pa.addonKey);
    const addonsWithStatus = addons.map(a => ({
      ...a.toObject(),
      isPurchased: activeKeys.includes(a.key),
      isDefault: a.isDefault,
    }));
    res.json({ success: true, count: addonsWithStatus.length, addons: addonsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get partner's active add-ons
router.get('/my', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner' || !req.user.partnerId) {
      return res.json({ success: true, addons: [] });
    }
    const partnerAddons = await PartnerAddon.find({ partnerId: req.user.partnerId, status: 'active' })
      .populate('addonId', 'name key icon description features')
      .sort({ createdAt: -1 });
    res.json({ success: true, addons: partnerAddons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Razorpay order for add-on purchase
router.post('/purchase-order', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can purchase add-ons' });
    }
    if (!req.user.partnerId) {
      return res.status(400).json({ success: false, message: 'Partner profile not found' });
    }
    const { addonId, billingCycle } = req.body;
    const addon = await Addon.findById(addonId);
    if (!addon) return res.status(404).json({ success: false, message: 'Add-on not found' });

    let amount = 0;
    if (billingCycle === 'monthly') amount = addon.monthlyPrice;
    else if (billingCycle === 'yearly') amount = addon.yearlyPrice;
    else amount = addon.price;

    if (amount <= 0 || addon.billingCycle === 'free') {
      // Free add-on — activate directly
      let pa = await PartnerAddon.findOne({ partnerId: req.user.partnerId, addonId });
      if (!pa) {
        pa = await PartnerAddon.create({
          partnerId: req.user.partnerId, addonId, addonKey: addon.key, addonName: addon.name,
          status: 'active', billingCycle: 'free', pricePaid: 0, paymentMode: 'free',
          activatedAt: new Date(),
        });
      } else {
        pa.status = 'active'; pa.activatedAt = new Date(); await pa.save();
      }
      return res.json({ success: true, free: true, partnerAddon: pa });
    }

    if (!razorpayClient) {
      return res.status(503).json({ success: false, message: 'Payment gateway unavailable. Please contact admin for manual activation.' });
    }

    const amountInPaise = Math.round(amount * 100);
    const razorpayOrder = await razorpayClient.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `addon-${addon.key}-${Date.now()}`,
      notes: { addonId: addon._id.toString(), partnerId: req.user.partnerId.toString(), billingCycle },
    });

    // Create pending partner addon record
    let pa = await PartnerAddon.findOne({ partnerId: req.user.partnerId, addonId });
    if (!pa) {
      pa = new PartnerAddon({
        partnerId: req.user.partnerId, addonId, addonKey: addon.key, addonName: addon.name,
        status: 'pending', billingCycle, pricePaid: amount, paymentMode: 'online_razorpay',
        razorpayOrderId: razorpayOrder.id,
      });
    } else {
      pa.status = 'pending'; pa.billingCycle = billingCycle; pa.pricePaid = amount;
      pa.paymentMode = 'online_razorpay'; pa.razorpayOrderId = razorpayOrder.id;
    }
    await pa.save();

    res.json({
      success: true, amount, currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId,
      partnerAddonId: pa._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Razorpay payment and activate add-on
router.post('/verify-payment', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { partnerAddonId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const pa = await PartnerAddon.findById(partnerAddonId);
    if (!pa) return res.status(404).json({ success: false, message: 'Purchase record not found' });

    if (pa.paymentMode === 'online_razorpay' && pa.pricePaid > 0) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed: missing payment details' });
      }
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Razorpay signature verification failed' });
      }
      pa.razorpayPaymentId = razorpay_payment_id;
      pa.razorpaySignature = razorpay_signature;
    }

    pa.status = 'active';
    pa.activatedAt = new Date();
    if (pa.billingCycle === 'monthly') pa.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    else if (pa.billingCycle === 'yearly') pa.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await pa.save();

    res.json({ success: true, partnerAddon: pa });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
