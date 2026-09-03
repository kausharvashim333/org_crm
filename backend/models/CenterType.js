const mongoose = require('mongoose');

const centerTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Settings2' },
  color: { type: String, default: '#2563eb' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CenterType', centerTypeSchema);
