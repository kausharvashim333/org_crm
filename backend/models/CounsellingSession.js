const mongoose = require('mongoose');

const counsellingSessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  topic: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, default: '11:00' },
  endTime: { type: String, default: '12:30' },
  duration: { type: String, default: '90 min' },
  mode: {
    type: String,
    enum: ['zoom', 'meet', 'hall', 'center'],
    default: 'zoom',
  },
  meetingLink: { type: String, default: '' },
  venue: { type: String, default: '' },
  seats: { type: Number, default: 30 },
  bookedCount: { type: Number, default: 0 },
  fee: { type: Number, default: 0 },
  originalFee: { type: Number, default: 0 },
  language: { type: String, default: 'Hindi' },
  counsellorName: { type: String, default: '' },
  targetAudience: { type: String, default: '' },
  interestArea: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft',
  },
  coverImage: { type: String, default: '' },
  bookingClosesAt: { type: Date },
  showOnWebsite: { type: Boolean, default: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordingUrl: { type: String, default: '' },
  recordingEmailedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('CounsellingSession', counsellingSessionSchema);
