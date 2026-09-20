const mongoose = require('mongoose');

const counsellingSlotSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingService', required: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startAt: { type: Date, required: true },
  endAt: { type: Date },
  status: { type: String, enum: ['open', 'held', 'booked'], default: 'open' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingBooking' },
  heldUntil: { type: Date },
}, { timestamps: true });

counsellingSlotSchema.index({ serviceId: 1, startAt: 1 });

module.exports = mongoose.model('CounsellingSlot', counsellingSlotSchema);
