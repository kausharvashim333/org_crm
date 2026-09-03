const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  type: { type: String, enum: ['student', 'partner'], default: 'student' },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  courseInterest: { type: String },
  instituteName: { type: String },
  location: { type: String },
  spaceArea: { type: String },
  message: { type: String },
  status: {
    type: String,
    enum: ['new', 'contacted', 'admitted', 'rejected', 'approved'],
    default: 'new',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followUpNotes: [{
    note: { type: String },
    date: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
