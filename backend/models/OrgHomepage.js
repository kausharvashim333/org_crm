const mongoose = require('mongoose');

const orgHomepageSchema = new mongoose.Schema({
  isPublished: { type: Boolean, default: true },

  hero: {
    bannerImage: { type: String },
    sliderImages: [{ type: String }],
    showCarousel: { type: Boolean, default: true },
    heading: { type: String, default: 'Building Careers in Paramedical, IT, Finance & Skills' },
    headingColor: { type: String, default: '#0f172a' },
    headingFontSize: { type: Number, default: 48 },
    subheading: { type: String, default: 'Paramedical | Computer Training | Skill Development | Stock Market Training' },
    subheadingFontSize: { type: Number, default: 14 },
    description: { type: String, default: 'Empowering India through quality education and practical training across multiple fields' },
    descriptionFontSize: { type: Number, default: 16 },
    points: { type: [String], default: [] },
    ctaButtonText: { type: String, default: 'Explore Courses' },
    ctaButtonLink: { type: String, default: '/#verticals' },
    cta2ButtonText: { type: String, default: 'Become a Franchise' },
    cta2ButtonLink: { type: String, default: '/#franchise' },
  },

  verticals: {
    title: { type: String, default: 'Fields We Offer' },
    subtitle: { type: String, default: 'We provide specialized training across four major verticals' },
    show: { type: Boolean, default: true },
    items: [{
      icon: { type: String, default: 'book' },
      title: { type: String },
      shortDesc: { type: String },
      description: { type: String },
      coursesCount: { type: String },
      link: { type: String },
    }],
  },

  about: {
    title: { type: String, default: 'About Our Organization' },
    description: { type: String, default: 'We are a leading training organization committed to providing quality education across India through our franchise network. Our mission is to empower students with practical skills and industry-recognized certifications.' },
    mission: { type: String, default: 'To provide accessible, quality education that leads to meaningful employment and entrepreneurship opportunities.' },
    vision: { type: String, default: 'To be the most trusted training network in India, transforming lives through skill development.' },
    features: [{
      icon: { type: String },
      title: { type: String },
      description: { type: String },
    }],
    show: { type: Boolean, default: true },
  },

  stats: {
    title: { type: String, default: 'Our Impact in Numbers' },
    show: { type: Boolean, default: true },
    items: [{
      label: { type: String },
      value: { type: String },
      icon: { type: String },
    }],
  },

  courses: {
    title: { type: String, default: 'Popular Courses' },
    subtitle: { type: String, default: 'Explore our most sought-after courses across all fields' },
    show: { type: Boolean, default: true },
    fieldTabs: [{
      fieldName: { type: String },
      fieldKey: { type: String },
      courses: [{
        name: { type: String },
        duration: { type: String },
        fee: { type: String },
        description: { type: String },
      }],
    }],
  },

  franchise: {
    title: { type: String, default: 'Partner With Us' },
    subtitle: { type: String, default: 'Join our growing network of training institutes across India' },
    description: { type: String, default: 'Become a franchise partner and start your own training institute with our established brand, proven curriculum, and ongoing support. We provide everything you need to succeed.' },
    benefits: [{
      icon: { type: String },
      title: { type: String },
      description: { type: String },
    }],
    steps: [{
      step: { type: Number },
      title: { type: String },
      description: { type: String },
    }],
    plans: [{
      name: { type: String, required: true },
      badge: { type: String, default: '' },
      tagline: { type: String, default: '' },
      fee: { type: Number, default: 15000 },
      originalFee: { type: Number, default: 25000 },
      royaltyPercentage: { type: String, default: 'Zero Royalty' },
      certificateShare: { type: String, default: '₹150 / Certificate' },
      features: [{ type: String }],
      popular: { type: Boolean, default: false },
      color: { type: String, default: 'indigo' },
      buttonText: { type: String, default: 'Apply for Plan' },
      buttonLink: { type: String, default: '/franchise/apply' },
      isActive: { type: Boolean, default: true },
    }],
    buttonText: { type: String, default: 'Apply for Franchise' },
    buttonLink: { type: String, default: '/admin/login' },
    show: { type: Boolean, default: true },
  },

  certifications: {
    title: { type: String, default: 'Certifications & Affiliations' },
    subtitle: { type: String, default: 'Our courses are recognized by leading organizations' },
    show: { type: Boolean, default: true },
    items: [{
      name: { type: String },
      logo: { type: String },
      description: { type: String },
    }],
  },

  cta: {
    title: { type: String, default: 'Ready to Start Your Journey?' },
    description: { type: String, default: 'Join thousands of students who have transformed their careers with us' },
    buttonText: { type: String, default: 'Contact Us' },
    buttonLink: { type: String, default: '/#contact' },
    show: { type: Boolean, default: true },
  },

  gallery: {
    title: { type: String, default: 'Gallery' },
    show: { type: Boolean, default: true },
    photos: [{ url: { type: String }, caption: { type: String }, featured: { type: Boolean, default: false } }],
  },

  testimonials: {
    title: { type: String, default: 'What People Say' },
    subtitle: { type: String, default: 'Success stories from our students and franchise partners' },
    show: { type: Boolean, default: true },
    items: [{
      name: { type: String },
      role: { type: String },
      field: { type: String },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      review: { type: String },
    }],
  },

  notices: {
    title: { type: String, default: 'Notices & Announcements' },
    show: { type: Boolean, default: true },
    items: [{
      title: { type: String },
      date: { type: Date },
      description: { type: String },
      badge: { type: String, default: 'New' },
      category: { type: String, default: 'General' },
      pdfUrl: { type: String, default: '' },
    }],
  },

  contact: {
    title: { type: String, default: 'Get in Touch' },
    subtitle: { type: String, default: 'Have questions? We are here to help.' },
    show: { type: Boolean, default: true },
    email: { type: String, default: 'contact@example.com' },
    phone: { type: String, default: '9999999999' },
    address: { type: String, default: 'India' },
    mapEmbed: { type: String },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
  },

  services: {
    title: { type: String, default: 'Our Training Services' },
    subtitle: { type: String, default: 'Explore our specialized vocational certification and coaching pathways' },
    show: { type: Boolean, default: true },
    items: [{
      title: { type: String },
      duration: { type: String },
      desc: { type: String },
      topics: [{ type: String }],
      careers: [{ type: String }],
      tools: [{ type: String }],
    }],
  },

  announcement: {
    show: { type: Boolean, default: true },
    text: { type: String, default: 'Admissions Open 2026-27: Paramedical, Yoga, Computer & IT, Competitive Coaching Batches starting soon. Apply now!' },
    bgColor: { type: String, default: '#3730a3' },
    textColor: { type: String, default: '#ffffff' }
  },

  enquiryConfig: {
    modalTitle: { type: String, default: 'Admission Enquiry Form' },
    successMessage: { type: String, default: 'Thank you for your enquiry! Our counseling team will contact you shortly.' }
  },

  codeSeriesConfig: {
    franchisePrefix: { type: String, default: 'FR-' },
    franchiseStartNo: { type: Number, default: 1 },
    franchisePadLength: { type: Number, default: 4 },

    studentPrefix: { type: String, default: 'STU-' },
    studentIncludeYear: { type: Boolean, default: true },
    studentStartNo: { type: Number, default: 1 },
    studentPadLength: { type: Number, default: 4 },

    certificatePrefix: { type: String, default: 'CERT-' },
    certificateStartNo: { type: Number, default: 1 },
    certificatePadLength: { type: Number, default: 6 },
  },

  settings: {
    themeColor: { type: String, default: '#2563eb' },
    fontChoice: { type: String, enum: ['inter', 'poppins', 'roboto'], default: 'inter' },
    logo: { type: String },
    favicon: { type: String },
    orgName: { type: String, default: 'Skill India' },
    shortName: { type: String, default: '' },
    browserTitle: { type: String, default: 'Skill India - Training Institute Management' },
  },

  centersStrip: {
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Our Centers' },
    centers: [{
      name: { type: String, required: true },
      logo: { type: String, default: '' },
      link: { type: String, default: '' },
    }],
  },

  layoutOrder: [{ type: String }],

  customSections: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    badge: { type: String, default: '' },
    bgStyle: { type: String, enum: ['white', 'slate', 'dark'], default: 'white' },
    columns: { type: Number, default: 4 },
    show: { type: Boolean, default: true },
    cards: [{
      icon: { type: String, default: 'book' },
      title: { type: String, required: true },
      description: { type: String, default: '' },
      image: { type: String },
      link: { type: String },
      linkText: { type: String, default: 'Learn More' },
    }],
  }],
}, { timestamps: true });

module.exports = mongoose.model('OrgHomepage', orgHomepageSchema);
