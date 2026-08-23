const mongoose = require('mongoose');

const partnerAddonSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  addonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Addon', required: true },
  addonKey: { type: String, required: true }, // denormalized for quick lookups
  addonName: { type: String, default: '' },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending' },
  billingCycle: { type: String, enum: ['one_time', 'monthly', 'yearly', 'free'], default: 'free' },
  pricePaid: { type: Number, default: 0 },
  activatedAt: { type: Date },
  expiresAt: { type: Date }, // null for one_time/free = lifetime
  // Payment info
  paymentMode: { type: String, enum: ['online_razorpay', 'manual_admin', 'free'], default: 'free' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  // Admin manual activation
  activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who activated
  adminNote: { type: String, default: '' },
}, { timestamps: true });

partnerAddonSchema.index({ partnerId: 1, addonKey: 1 }, { unique: true });

module.exports = mongoose.model('PartnerAddon', partnerAddonSchema);
