const mongoose = require('mongoose');

const counsellingWaitlistSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingSession', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  city: { type: String, default: '' },
  status: { type: String, enum: ['waiting', 'offered', 'booked', 'expired'], default: 'waiting' },
  offeredAt: { type: Date },
  offerExpiresAt: { type: Date },
}, { timestamps: true });

counsellingWaitlistSchema.index({ sessionId: 1, email: 1 });

module.exports = mongoose.model('CounsellingWaitlist', counsellingWaitlistSchema);
