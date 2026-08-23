const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['mcq', 'true_false', 'subjective'], default: 'mcq' },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctOptionIndex: { type: Number, default: -1 },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String },
}, { _id: true });

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOptionIndex: { type: Number, default: -1 },
    textAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  }],
  totalMarksAwarded: { type: Number, default: 0 },
  status: { type: String, enum: ['pass', 'fail', 'absent'], default: 'absent' },
  grade: { type: String },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  timeSpentMinutes: { type: Number, default: 0 },
  tabSwitchCount: { type: Number, default: 0 },
}, { _id: true });

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
  questions: [questionSchema],
  submissions: [submissionSchema],
  results: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    marksObtained: { type: Number },
    grade: { type: String },
    status: { type: String, enum: ['pass', 'fail', 'absent'] },
  }],
  examSettings: {
    durationMinutes: { type: Number, default: 60 },
    isOnline: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showResultsImmediately: { type: Boolean, default: true },
    allowRetake: { type: Boolean, default: false },
    maxRetakes: { type: Number, default: 0 },
    negativeMarkingEnabled: { type: Boolean, default: false },
    instructions: { type: String, default: 'Read all questions carefully before answering.' },
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'result_declared', 'cancelled'],
    default: 'scheduled',
  },
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
