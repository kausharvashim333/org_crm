const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['notes', 'video', 'presentation', 'assignment', 'question_bank', 'ebook', 'link'],
    required: true,
  },
  courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  isStandard: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved',
  },
  fileUrl: { type: String },
  externalLink: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  downloads: [{ studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, date: { type: Date, default: Date.now } }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
