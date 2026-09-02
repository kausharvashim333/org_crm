const mongoose = require('mongoose');

const courseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'BookOpen' },
  color: { type: String, default: '#2563eb' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('CourseCategory', courseCategorySchema);
