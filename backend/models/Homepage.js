const mongoose = require('mongoose');

const homepageSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, unique: true },
  isPublished: { type: Boolean, default: true },

  hero: {
    bannerImage: { type: String },
    heading: { type: String, default: 'Welcome to Our Institute' },
    subheading: { type: String, default: 'Learn Skills, Build Career' },
    ctaButtonText: { type: String, default: 'Enroll Now' },
  },

  about: {
    title: { type: String, default: 'About Us' },
    description: { type: String, default: '' },
    whyChooseUs: [{ type: String }],
    achievements: [{ type: String }],
    show: { type: Boolean, default: true },
  },

  courses: {
    title: { type: String, default: 'Our Courses' },
    show: { type: Boolean, default: true },
    selectedCourseIds: [{ type: mongoose.Schema.Types.ObjectId }],
  },

  faculty: {
    title: { type: String, default: 'Our Faculty' },
    show: { type: Boolean, default: true },
    selectedStaffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  },

  gallery: {
    title: { type: String, default: 'Gallery' },
    show: { type: Boolean, default: true },
    photos: [{ url: { type: String }, caption: { type: String } }],
  },

  testimonials: {
    title: { type: String, default: 'Student Reviews' },
    show: { type: Boolean, default: true },
    items: [{
      studentName: { type: String },
      course: { type: String },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      review: { type: String },
      photo: { type: String },
    }],
  },

  facilities: {
    title: { type: String, default: 'Our Facilities' },
    show: { type: Boolean, default: true },
    items: [{ icon: { type: String }, title: { type: String }, description: { type: String } }],
  },

  notices: {
    title: { type: String, default: 'Notices' },
    show: { type: Boolean, default: true },
    items: [{ title: { type: String }, message: { type: String }, date: { type: Date, default: Date.now } }],
  },

  contact: {
    title: { type: String, default: 'Contact Us' },
    show: { type: Boolean, default: true },
    mapEmbed: { type: String },
  },

  layoutOrder: [{ type: String }],

  settings: {
    themeColor: { type: String, default: '#2563eb' },
    fontChoice: { type: String, enum: ['inter', 'poppins', 'roboto'], default: 'inter' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Homepage', homepageSchema);
