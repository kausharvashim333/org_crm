const express = require('express');
const Course = require('../models/Course');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');
const { escapeRegex } = require('../utils/sanitize');

const router = express.Router();

router.get('/store', async (req, res) => {
  try {
    const { category, search, level, sort, minPrice, maxPrice } = req.query;
    let filter = { isActive: true, approvalStatus: 'approved' };

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (level && level !== 'All') {
      filter.level = level;
    }
    if (search && typeof search === 'string') {
      const sanitizedSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { code: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
        { category: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    let sortObj = { displayOrder: 1, enrolledCount: -1, createdAt: -1 };
    if (sort === 'price-low') sortObj = { displayOrder: 1, salePrice: 1, fee: 1 };
    else if (sort === 'price-high') sortObj = { displayOrder: 1, salePrice: -1, fee: -1 };
    else if (sort === 'rating') sortObj = { displayOrder: 1, rating: -1 };
    else if (sort === 'newest') sortObj = { displayOrder: 1, createdAt: -1 };

    const courses = await Course.find(filter).sort(sortObj);
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/store/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Clone and sanitize chapters for public view (protect paid videos)
    const courseObj = course.toObject();
    if (courseObj.chapters && courseObj.chapters.length > 0) {
      courseObj.chapters = courseObj.chapters.map((ch, idx) => ({
        _id: ch._id,
        title: ch.title,
        description: ch.description,
        duration: ch.duration,
        order: ch.order || idx,
        isPreviewFree: ch.isPreviewFree || idx === 0, // First chapter preview free by default
        videoUrl: (ch.isPreviewFree || idx === 0) ? ch.videoUrl : null,
        videoType: ch.videoType,
      }));
    }

    res.json({ success: true, course: courseObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    let filter = { isActive: true };
    if (req.query.partnerId) {
      const Partner = require('../models/Partner');
      const partnerObj = await Partner.findById(req.query.partnerId);
      const pCenterType = partnerObj?.centerType || 'Computer & IT Training';

      filter.$or = [
        { partnerId: req.query.partnerId, approvalStatus: 'approved' },
        { isStandard: true, approvalStatus: 'approved', availableToPartners: true, centerType: { $in: [pCenterType, 'All', null, ''] } },
      ];
    } else if (req.query.standard === 'true') {
      filter.isStandard = true;
    }

    if (req.query.centerType && req.query.centerType !== 'All') {
      filter.centerType = { $in: [req.query.centerType, 'All', null, ''] };
    }

    const courses = await Course.find(filter).sort({ displayOrder: 1, isStandard: -1, createdAt: -1 });
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      const Partner = require('../models/Partner');
      const partnerObj = await Partner.findById(req.user.partnerId);
      const pCenterType = partnerObj?.centerType || 'Computer & IT Training';

      filter.$or = [
        { partnerId: req.user.partnerId },
        { isStandard: true, approvalStatus: 'approved', availableToPartners: true, centerType: { $in: [pCenterType, 'All', null, ''] } },
      ];
    } else if (req.query.partnerId) {
      filter.$or = [
        { partnerId: req.query.partnerId },
        { isStandard: true, availableToPartners: true },
      ];
    } else if (req.query.standard === 'true') {
      filter.isStandard = true;
    }

    if (req.query.centerType && req.query.centerType !== 'All') {
      filter.centerType = { $in: [req.query.centerType, 'All'] };
    }

    const rawCourses = await Course.find(filter).sort({ displayOrder: 1, isStandard: -1, createdAt: -1 });
    const targetPartnerId = req.user.role === 'partner' ? req.user.partnerId : (req.query.partnerId || null);
    const courses = rawCourses.map(c => {
      const cObj = c.toObject();
      if (targetPartnerId && Array.isArray(cObj.partnerCustomFees)) {
        const match = cObj.partnerCustomFees.find(p => p.partnerId && p.partnerId.toString() === targetPartnerId.toString());
        if (match && match.customStudentFee !== undefined) {
          cObj.studentFee = match.customStudentFee;
          cObj.fee = match.customStudentFee;
          cObj.hasCustomPartnerFee = true;
        }
      }
      return cObj;
    });
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const sanitizeCourseFeeData = (body) => {
  const data = { ...body };
  const sFee = Number(data.studentFee !== undefined ? data.studentFee : (data.fee !== undefined ? data.fee : 0));
  const oFee = Number(data.organizationFee !== undefined ? data.organizationFee : 0);
  const cFee = Number(data.certificateFee !== undefined ? data.certificateFee : 0);
  data.studentFee = sFee;
  data.fee = sFee;
  data.organizationFee = oFee;
  data.certificateFee = cFee;
  return data;
};

router.post('/standard', protect, superAdminOnly, async (req, res) => {
  try {
    const courseData = sanitizeCourseFeeData(req.body);
    const course = await Course.create({ ...courseData, isStandard: true, approvalStatus: 'approved' });
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    const courseData = sanitizeCourseFeeData(req.body);
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) {
        return res.status(400).json({ success: false, message: 'Partner profile not found. Please contact support.' });
      }
      const course = await Course.create({
        ...courseData,
        partnerId: req.user.partnerId,
        isStandard: false,
        approvalStatus: 'pending',
      });
      res.status(201).json({ success: true, course });
    } else {
      const course = await Course.create({ ...courseData, isStandard: true, approvalStatus: 'approved' });
      res.status(201).json({ success: true, course });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reorder courses (bulk update displayOrder) — must be before /:id route
router.put('/reorder', protect, superAdminOnly, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required' });
    }
    const updates = orderedIds.map((id, index) =>
      Course.findByIdAndUpdate(id, { displayOrder: index }, { new: true })
    );
    await Promise.all(updates);
    res.json({ success: true, message: 'Course order updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'partner') {
      if (!req.user.partnerId || !course.partnerId || course.partnerId.toString() !== req.user.partnerId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    const courseData = sanitizeCourseFeeData(req.body);
    const updated = await Course.findByIdAndUpdate(req.params.id, courseData, { new: true, runValidators: true });
    res.json({ success: true, course: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/partner-fee', protect, partnerOrAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    const partnerId = req.user.role === 'partner' ? req.user.partnerId : (req.body.partnerId || req.user.partnerId);
    if (!partnerId) return res.status(400).json({ success: false, message: 'Partner ID required' });

    const customStudentFee = Number(req.body.customStudentFee);
    if (isNaN(customStudentFee) || customStudentFee < (course.organizationFee || 0)) {
      return res.status(400).json({
        success: false,
        message: `Custom student fee cannot be less than Organization Royalty Fee (₹${course.organizationFee || 0})`
      });
    }

    if (!course.partnerCustomFees) course.partnerCustomFees = [];
    const existingIndex = course.partnerCustomFees.findIndex(p => p.partnerId && p.partnerId.toString() === partnerId.toString());

    if (existingIndex > -1) {
      course.partnerCustomFees[existingIndex].customStudentFee = customStudentFee;
      course.partnerCustomFees[existingIndex].updatedAt = Date.now();
    } else {
      course.partnerCustomFees.push({ partnerId, customStudentFee });
    }

    await course.save();
    res.json({ success: true, message: 'Institute course fee updated successfully', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/approve', protect, superAdminOnly, async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true });
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'partner') {
      if (!req.user.partnerId || !course.partnerId || course.partnerId.toString() !== req.user.partnerId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    course.isActive = false;
    await course.save();
    res.json({ success: true, message: 'Course deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload video file for chapter
const upload = require('../middleware/upload');
router.post('/upload-video', protect, partnerOrAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, videoUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update course chapters
router.put('/:id/chapters', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { chapters } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || (course.partnerId && course.partnerId.toString() !== req.user.partnerId.toString()))) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    course.chapters = chapters || [];
    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update course assessment (Bilingual questions)
router.put('/:id/assessment', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { assessment } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || (course.partnerId && course.partnerId.toString() !== req.user.partnerId.toString()))) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    course.assessment = assessment;
    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
