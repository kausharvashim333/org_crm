const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  examType: { type: String, enum: ['internal', 'external', 'midterm', 'final'], default: 'internal' },
  date: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 40 },
  syllabus: { type: String },
  results: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    marksObtained: { type: Number },
    grade: { type: String },
    status: { type: String, enum: ['pass', 'fail', 'absent'] },
  }],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'result_declared', 'cancelled'],
    default: 'scheduled',
  },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
