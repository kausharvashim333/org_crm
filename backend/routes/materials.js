const express = require('express');
const Material = require('../models/Material');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = { isActive: true };
    if (req.user.role === 'partner') {
      filter.$or = [
        { isStandard: true, approvalStatus: 'approved' },
        { partnerId: req.user.partnerId },
      ];
    } else if (req.user.role === 'student') {
      filter.$or = [
        { isStandard: true, approvalStatus: 'approved' },
        { partnerId: req.user.partnerId, approvalStatus: 'approved' },
      ];
    }
    if (req.query.courseId) filter.courseIds = req.query.courseId;
    if (req.query.type) filter.type = req.query.type;
    const materials = await Material.find(filter).populate('courseIds', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('courseIds', 'name');
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, courseIds, externalLink } = req.body;
    const materialData = {
      title,
      description,
      type,
      courseIds: courseIds ? JSON.parse(courseIds) : [],
      uploadedBy: req.user._id,
    };
    if (req.file) {
      materialData.fileUrl = `/uploads/${req.file.filename}`;
      materialData.fileSize = req.file.size;
    }
    if (externalLink) materialData.externalLink = externalLink;
    if (req.user.role === 'super_admin') {
      materialData.isStandard = true;
      materialData.approvalStatus = 'approved';
    } else if (req.user.role === 'partner') {
      materialData.partnerId = req.user.partnerId;
      materialData.isStandard = false;
      materialData.approvalStatus = 'pending';
    }
    const material = await Material.create(materialData);
    res.status(201).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    if (req.user.role === 'partner') {
      if (!material.partnerId || material.partnerId.toString() !== req.user.partnerId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    const updated = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, material: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/approve', protect, superAdminOnly, async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    const material = await Material.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true });
    res.json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    if (req.user.role === 'partner') {
      if (!material.partnerId || material.partnerId.toString() !== req.user.partnerId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    material.isActive = false;
    await material.save();
    res.json({ success: true, message: 'Material removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
