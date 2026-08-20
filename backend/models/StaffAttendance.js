const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  date: { type: Date, required: true },
  records: [{
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'leave'], default: 'absent' },
    inTime: { type: String },
    outTime: { type: String },
    remarks: { type: String },
  }],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

staffAttendanceSchema.index({ partnerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
