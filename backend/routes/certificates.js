const express = require('express');
const Certificate = require('../models/Certificate');
const { protect, partnerOrAdmin, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.partnerId = req.user.partnerId;
    } else if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    const certificates = await Certificate.find(filter)
      .populate('studentId', 'fullName phone')
      .populate('courseId', 'name')
      .populate('partnerId', 'instituteName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can request certificates' });
    }
    const cert = await Certificate.create({
      ...req.body,
      partnerId: req.user.partnerId,
    });
    res.status(201).json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/approve', protect, superAdminOnly, async (req, res) => {
  try {
    const { grade, percentage } = req.body;
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
    cert.status = 'approved';
    cert.grade = grade;
    cert.percentage = percentage;
    cert.approvedAt = new Date();
    cert.approvedBy = req.user._id;
    const OrgHomepage = require('../models/OrgHomepage');
    const org = await OrgHomepage.findOne();
    const cfg = org?.codeSeriesConfig || {};
    const prefix = cfg.certificatePrefix !== undefined ? cfg.certificatePrefix : 'CERT-';
    const startNo = cfg.certificateStartNo || 1;
    const padLen = cfg.certificatePadLength || 6;
    const certCount = await Certificate.countDocuments({ status: 'issued' });
    const num = startNo + certCount;

    cert.certificateNo = `${prefix}${String(num).padStart(padLen, '0')}`;
    cert.verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    cert.issueDate = new Date();
    cert.status = 'issued';
    await cert.save();
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/reject', protect, superAdminOnly, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const cert = await Certificate.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason }, { new: true });
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/bulk-approve', protect, superAdminOnly, async (req, res) => {
  try {
    const { certIds, grade, percentage } = req.body;
    if (!certIds || !Array.isArray(certIds) || certIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No certificates selected' });
    }
    const OrgHomepage = require('../models/OrgHomepage');
    const org = await OrgHomepage.findOne();
    const cfg = org?.codeSeriesConfig || {};
    const prefix = cfg.certificatePrefix !== undefined ? cfg.certificatePrefix : 'CERT-';
    const startNo = cfg.certificateStartNo || 1;
    const padLen = cfg.certificatePadLength || 6;
    let certCount = await Certificate.countDocuments({ status: 'issued' });

    const results = [];
    for (const certId of certIds) {
      const cert = await Certificate.findById(certId);
      if (!cert || cert.status !== 'requested') continue;
      cert.grade = grade || 'A';
      cert.percentage = percentage || 0;
      cert.approvedAt = new Date();
      cert.approvedBy = req.user._id;
      const num = startNo + certCount;
      cert.certificateNo = `${prefix}${String(num).padStart(padLen, '0')}`;
      cert.verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      cert.issueDate = new Date();
      cert.status = 'issued';
      await cert.save();
      certCount++;
      results.push(cert._id);
    }
    res.json({ success: true, approved: results.length, message: `${results.length} certificate(s) issued successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/verify/:code', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verificationCode: req.params.code, status: 'issued' })
      .populate('studentId', 'fullName')
      .populate('courseId', 'name')
      .populate('partnerId', 'instituteName');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
