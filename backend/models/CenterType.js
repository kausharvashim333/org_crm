const mongoose = require('mongoose');

const centerTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CenterType', centerTypeSchema);
