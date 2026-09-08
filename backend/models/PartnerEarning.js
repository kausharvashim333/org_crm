const mongoose = require('mongoose');

const partnerEarningSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
  },
  type: {
    type: String,
    enum: ['center_royalty', 'referral_commission'],
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  referredPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
  },
  baseAmount: { type: Number, required: true, default: 0 },
  percentage: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  month: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  settledAt: { type: Date },
  description: { type: String, default: '' },
}, { timestamps: true });

partnerEarningSchema.index({ partnerId: 1, month: 1, status: 1 });
partnerEarningSchema.index({ partnerId: 1, type: 1, status: 1 });

module.exports = mongoose.model('PartnerEarning', partnerEarningSchema);
