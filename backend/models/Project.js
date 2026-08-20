const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  scheme: { type: String },
  sector: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  budget: { type: Number, default: 0 },
  targetEnrollment: { type: Number, default: 0 },
  eligibilityCriteria: { type: String },
  guidelinesDoc: { type: String },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'active',
  },
  assignments: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    accepted: { type: Boolean, default: false },
    acceptedDate: { type: Date },
    declinedReason: { type: String },
    targetEnrollment: { type: Number, default: 0 },
    targetPlacement: { type: Number, default: 0 },
    customTerms: { type: String },
    fundAllocated: { type: Number, default: 0 },
    fundReleased: { type: Number, default: 0 },
    fundUtilized: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'in_progress', 'completed', 'declined'],
      default: 'assigned',
    },
  }],
  documents: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    title: { type: String },
    fileUrl: { type: String },
    type: { type: String, enum: ['kyc', 'attendance', 'assessment', 'placement', 'invoice', 'other'] },
    uploadedAt: { type: Date, default: Date.now },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    remarks: { type: String },
  }],
  placements: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    company: { type: String },
    jobRole: { type: String },
    salary: { type: Number },
    offerLetter: { type: String },
    joiningDate: { type: Date },
  }],
  notices: [{
    title: { type: String },
    message: { type: String },
    date: { type: Date, default: Date.now },
    forPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
