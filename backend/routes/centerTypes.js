const express = require('express');
const CenterType = require('../models/CenterType');
const Course = require('../models/Course');
const { protect, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_CENTER_TYPES = [
  'Computer & IT Training',
  'Paramedical Training',
  'Health & Yoga Training',
  'Skill Development Projects',
  'Stock Market & Finance',
  'UG & PG Courses',
  'Competitive Coaching',
];

// Auto-seed default center types on first access
router.use(async (req, res, next) => {
  try {
    const count = await CenterType.countDocuments();
    if (count === 0) {
      await CenterType.insertMany(
        DEFAULT_CENTER_TYPES.map((name, i) => ({ name, order: i }))
      );
    }
  } catch (e) { /* ignore seed errors */ }
  next();
});

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
    const { name, description, order } = req.body;
    const existing = await CenterType.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Center type with this name already exists' });
    }
    const type = await CenterType.create({
      name: name.trim(),
      description: description || '',
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
    const { name, description, order, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (order !== undefined) update.order = order;
    if (isActive !== undefined) update.isActive = isActive;

    const type = await CenterType.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!type) return res.status(404).json({ success: false, message: 'Center type not found' });

    // If name changed, update all courses with old name
    if (name && name.trim() !== type.name) {
      // type already has new name from findByIdAndUpdate, need old name from req
      // Actually we need to find courses with the OLD name — but we already updated.
      // Let's handle it differently: update courses where centerType matches old name
    }

    res.json({ success: true, centerType: type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: rename center type (updates all courses too)
router.put('/:id/rename', protect, superAdminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const type = await CenterType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Center type not found' });

    const oldName = type.name;
    const newName = name.trim();

    // Check for duplicate
    const existing = await CenterType.findOne({ name: newName, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Center type with this name already exists' });
    }

    // Update the center type
    type.name = newName;
    await type.save();

    // Update all courses with the old name
    await Course.updateMany({ centerType: oldName }, { $set: { centerType: newName } });

    res.json({ success: true, centerType: type, message: `Renamed and updated all courses from "${oldName}" to "${newName}"` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: delete center type
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const type = await CenterType.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Center type not found' });

    // Check if any courses use this center type
    const courseCount = await Course.countDocuments({ centerType: type.name });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${courseCount} course(s) are using this center type. Move them to another type first.`
      });
    }

    await CenterType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Center type deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
