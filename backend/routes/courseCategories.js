const express = require('express');
const CourseCategory = require('../models/CourseCategory');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Public: get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await CourseCategory.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get all categories (including inactive)
router.get('/all', protect, superAdminOnly, async (req, res) => {
  try {
    const categories = await CourseCategory.find().sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: create category
router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, icon, color, order } = req.body;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existing = await CourseCategory.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }
    const category = await CourseCategory.create({
      name: name.trim(),
      slug,
      description: description || '',
      icon: icon || 'BookOpen',
      color: color || '#2563eb',
      order: order || 0,
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: update category
router.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, icon, color, order, isActive } = req.body;
    const update = {};
    if (name) {
      update.name = name.trim();
      update.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) update.description = description;
    if (icon !== undefined) update.icon = icon;
    if (color !== undefined) update.color = color;
    if (order !== undefined) update.order = order;
    if (isActive !== undefined) update.isActive = isActive;

    const category = await CourseCategory.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: delete category
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const category = await CourseCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
