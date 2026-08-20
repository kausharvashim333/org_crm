const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  watchedChapters: [{ type: String }],
  isCompleted: { type: Boolean, default: false },
  assessmentAttempt: {
    passed: { type: Boolean },
    score: { type: Number },
    totalQuestions: { type: Number },
    percentage: { type: Number },
    attemptedAt: { type: Date },
  },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
}, { timestamps: true });

studentProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
