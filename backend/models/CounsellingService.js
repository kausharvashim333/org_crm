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
  enableGroupSession: { type: Boolean, default: false },
  groupPrice: { type: Number },
  originalGroupPrice: { type: Number, default: 0 },
  groupSessionDate: { type: Date },
  groupSessionStartTime: { type: String, default: '11:00' },
  groupSessionEndTime: { type: String, default: '12:30' },
  groupSessionDuration: { type: String, default: '60 min' },
  groupSessionMeetingLink: { type: String, default: '' },
  groupSessionNotifiedAt: { type: Date },
  includes: [{ type: String }],
  badge: { type: String, default: '' },
  image: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CounsellingService', counsellingServiceSchema);
