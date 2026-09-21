const mongoose = require('mongoose');

const counsellingServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  duration: { type: String, default: '30 min' },
  mode: {
    type: String,
    enum: ['phone', 'whatsapp', 'video'],
    default: 'video',
  },
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  groupPrice: { type: Number, default: 0 },
  originalGroupPrice: { type: Number, default: 0 },
  includes: [{ type: String }],
  badge: { type: String, default: '' },
  image: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CounsellingService', counsellingServiceSchema);
