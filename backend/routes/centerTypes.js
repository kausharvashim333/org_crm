const express = require('express');
const CenterType = require('../models/CenterType');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Public: get all active center types
router.get('/', async (req, res) => {
  try {
    const types = await CenterType.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, centerTypes: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get all center types (including inactive)
router.get('/all', protect, superAdminOnly, async (req, res) => {
  try {
    const types = await CenterType.find().sort({ order: 1, name: 1 });
    res.json({ success: true, centerTypes: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: create center type
router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, icon, color, order } = req.body;
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existing = await CenterType.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Center type with this name already exists' });
    }
    const type = await CenterType.create({
      name: name.trim(),
      slug,
      description: description || '',
      icon: icon || 'Building2',
      color: color || '#2563eb',
      order: order || 0,
    });
    res.status(201).json({ success: true, centerType: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: update center type
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

    const type = await CenterType.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!type) return res.status(404).json({ success: false, message: 'Center type not found' });
    res.json({ success: true, centerType: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: delete center type
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const type = await CenterType.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Center type not found' });
    res.json({ success: true, message: 'Center type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
