const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  batchCode: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  timing: { type: String },
  schedule: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  meetingLink: { type: String },
  notes: { type: String },
  maxStudents: { type: Number, default: 30 },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  syllabusProgress: [{
    module: { type: String },
    completed: { type: Boolean, default: false },
    completedDate: { type: Date },
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
