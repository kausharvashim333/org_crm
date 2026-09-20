const mongoose = require('mongoose');

const counsellingBookingSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true, required: true },
  type: { type: String, enum: ['one_on_one', 'group'], required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingService' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingSession' },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CounsellingSlot' },
  itemTitle: { type: String, default: '' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  city: { type: String, default: '' },
  message: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'attended', 'no_show', 'refunded'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed', 'refunded'],
    default: 'unpaid',
  },
  paymentMode: {
    type: String,
    enum: ['razorpay', 'cash', 'free'],
    default: 'razorpay',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paidAt: { type: Date },
  seatLockExpiresAt: { type: Date },
  attended: { type: Boolean, default: false },
  convertedToAdmission: { type: Boolean, default: false },
  convertedCourse: { type: String, default: '' },
  adminNote: { type: String, default: '' },
  emailConfirmSent: { type: Boolean, default: false },
  emailCancelSent: { type: Boolean, default: false },
  reminderDaySent: { type: Boolean, default: false },
  reminderHourSent: { type: Boolean, default: false },
}, { timestamps: true });

counsellingBookingSchema.index({ sessionId: 1, phone: 1 });
counsellingBookingSchema.index({ bookingCode: 1 });

module.exports = mongoose.model('CounsellingBooking', counsellingBookingSchema);
