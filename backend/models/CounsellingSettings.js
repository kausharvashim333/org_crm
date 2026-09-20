const mongoose = require('mongoose');

const counsellingSettingsSchema = new mongoose.Schema({
  showOnWebsite: { type: Boolean, default: true },
  pageTitle: { type: String, default: 'Paid Career Counselling' },
  pageSubtitle: { type: String, default: 'Book a 1-on-1 session or join an upcoming group counselling batch.' },
  heroBadge: { type: String, default: 'Career Guidance' },
  whatsappNumber: { type: String, default: '' },
  noticeText: {
    type: String,
    default: 'Counselling fee is non-refundable and not adjustable against course or admission fees.',
  },
}, { timestamps: true });

module.exports = mongoose.model('CounsellingSettings', counsellingSettingsSchema);
