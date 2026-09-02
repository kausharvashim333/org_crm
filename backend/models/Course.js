const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  name: { type: String, required: true },
  code: { type: String },
  description: { type: String },
  syllabus: [{
    module: { type: String },
    topics: [{ type: String }],
  }],
  duration: { type: String },
  durationMonths: { type: Number },
  totalHours: { type: Number },
  fee: { type: Number, default: 0 },
  monthlyFee: { type: Number, default: 0 },
  feeDisplayType: { type: String, enum: ['full', 'monthly', 'both'], default: 'full' },
  organizationFee: { type: Number, default: 0 },
  studentFee: { type: Number, default: 0 },
  certificateFee: { type: Number, default: 0 },
  registrationFee: { type: Number, default: 0 },
  partnerCustomFees: [{
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    customStudentFee: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
  }],
  isStandard: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved',
  },
  category: { type: String },
  centerType: { type: String, default: 'All' },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  // E-commerce & Store Fields
  originalPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  isPublishedForSale: { type: Boolean, default: true },
  badge: { type: String, default: 'Govt Certified' }, // 'Bestseller', 'Hot & New', 'Govt Certified', 'Highest Rated'
  rating: { type: Number, default: 4.8 },
  ratingCount: { type: Number, default: 120 },
  enrolledCount: { type: Number, default: 350 },
  level: { type: String, default: 'Beginner to Advanced' },
  language: { type: String, default: 'Hindi / Hinglish' },
  previewVideoUrl: { type: String },
  highlights: [{ type: String }],
  whatYouWillLearn: [{ type: String }],
  prerequisites: [{ type: String }],
  targetAudience: [{ type: String }],
  instructor: {
    name: { type: String, default: 'Senior Industry Expert' },
    title: { type: String, default: 'Certified Technical Trainer' },
    bio: { type: String, default: '10+ years of training and corporate development experience.' },
    avatar: { type: String },
  },
  features: [{ type: String }],
  chapters: [{
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    videoType: { type: String, enum: ['upload', 'url', 'youtube'], default: 'url' },
    duration: { type: String },
    order: { type: Number, default: 0 },
    isPreviewFree: { type: Boolean, default: false },
    resources: [{
      title: { type: String },
      fileUrl: { type: String },
    }],
  }],
  assessment: {
    passingScore: { type: Number, default: 50 },
    questions: [{
      questionText: { type: String, required: true },
      questionTextHi: { type: String },
      options: [{
        text: { type: String, required: true },
        textHi: { type: String },
      }],
      correctAnswerIndex: { type: Number, required: true },
      points: { type: Number, default: 1 },
    }],
  },
  requiredDocuments: [{
    docName: { type: String, required: true },
    isCompulsory: { type: Boolean, default: true },
    docType: { type: String, enum: ['image', 'document', 'id_proof', 'any'], default: 'document' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
