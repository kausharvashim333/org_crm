const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  key: { type: String, required: true, unique: true, lowercase: true }, // e.g. 'exam_system'
  description: { type: String, default: '' },
  features: [{ type: String }], // list of features included
  price: { type: Number, default: 0 }, // one-time price
  monthlyPrice: { type: Number, default: 0 }, // monthly subscription
  yearlyPrice: { type: Number, default: 0 }, // yearly subscription
  billingCycle: { type: String, enum: ['one_time', 'monthly', 'yearly', 'free'], default: 'free' },
  icon: { type: String, default: 'Package' }, // lucide icon name
  isActive: { type: Boolean, default: true }, // available for purchase
  isDefault: { type: Boolean, default: false }, // included for all partners by default
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Addon', addonSchema);
