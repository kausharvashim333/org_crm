const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateNo: { type: String, unique: true },
  issueDate: { type: Date },
  grade: { type: String },
  percentage: { type: Number },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'issued'],
    default: 'requested',
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  certificateUrl: { type: String },
  verificationCode: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
