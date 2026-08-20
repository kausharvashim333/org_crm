const express = require('express');
const Homepage = require('../models/Homepage');
const Partner = require('../models/Partner');
const path = require('path');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

const OrgHomepage = require('../models/OrgHomepage');

// Banner File Upload Endpoint
router.post('/upload-banner', protect, partnerOrAdmin, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a banner image file' });
    }
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });

    const bannerUrl = `/uploads/${req.file.filename}`;
    if (!homepage.hero) homepage.hero = {};
    homepage.hero.bannerImage = bannerUrl;
    await homepage.save();

    res.json({ success: true, message: 'Banner image uploaded successfully!', bannerImage: bannerUrl, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public/:slug', async (req, res) => {
  try {
    const partner = await Partner.findOne({ slug: req.params.slug, status: 'active' })
      .select('-password -aadhaarNumber -panNumber -bankDetails -securityDeposit -franchiseFee -documents -references');
    if (!partner) return res.status(404).json({ success: false, message: 'Institute not found' });
    const homepage = await Homepage.findOne({ partnerId: partner._id });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    
    const orgHp = await OrgHomepage.findOne();
    const orgName = orgHp?.settings?.orgName || 'Skill India';

    res.json({ success: true, partner, homepage, orgName });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can view their homepage' });
    }
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can edit their homepage' });
    }
    const homepage = await Homepage.findOneAndUpdate(
      { partnerId: req.user.partnerId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/section/:section', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can edit their homepage' });
    }
    const { section } = req.params;
    const allowedSections = ['hero', 'about', 'courses', 'faculty', 'gallery', 'testimonials', 'facilities', 'notices', 'contact', 'settings', 'layoutOrder'];
    if (!allowedSections.includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid section' });
    }
    const update = { [section]: req.body[section] };
    const homepage = await Homepage.findOneAndUpdate(
      { partnerId: req.user.partnerId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/publish', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { isPublished } = req.body;
    const homepage = await Homepage.findOneAndUpdate(
      { partnerId: req.user.partnerId },
      { isPublished },
      { new: true }
    );
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gallery/upload', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { url, caption } = req.body;
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    homepage.gallery.photos.push({ url, caption });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/gallery/:index', protect, partnerOrAdmin, async (req, res) => {
  try {
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    const index = parseInt(req.params.index);
    homepage.gallery.photos.splice(index, 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/testimonials', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { studentName, course, rating, review, photo } = req.body;
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    homepage.testimonials.items.push({ studentName, course, rating, review, photo });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/testimonials/:index', protect, partnerOrAdmin, async (req, res) => {
  try {
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    const index = parseInt(req.params.index);
    homepage.testimonials.items.splice(index, 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notices', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    homepage.notices.items.push({ title, message });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notices/:index', protect, partnerOrAdmin, async (req, res) => {
  try {
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    const index = parseInt(req.params.index);
    homepage.notices.items.splice(index, 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/facilities', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { icon, title, description } = req.body;
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    homepage.facilities.items.push({ icon, title, description });
    await homepage.save();
    res.status(201).json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/facilities/:index', protect, partnerOrAdmin, async (req, res) => {
  try {
    const homepage = await Homepage.findOne({ partnerId: req.user.partnerId });
    if (!homepage) return res.status(404).json({ success: false, message: 'Homepage not found' });
    const index = parseInt(req.params.index);
    homepage.facilities.items.splice(index, 1);
    await homepage.save();
    res.json({ success: true, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
