const express = require('express');
const Project = require('../models/Project');
const { protect, superAdminOnly, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter['assignments.partnerId'] = req.user.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    const projects = await Project.find(filter)
      .populate('assignments.partnerId', 'instituteName city')
      .populate('placements.studentId', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignments.partnerId', 'instituteName city ownerName')
      .populate('documents.partnerId', 'instituteName')
      .populate('placements.studentId', 'fullName phone')
      .populate('placements.partnerId', 'instituteName');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/assign', protect, superAdminOnly, async (req, res) => {
  try {
    const { partnerIds, targetEnrollment, targetPlacement, customTerms, fundAllocated } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    partnerIds.forEach(pid => {
      const existing = project.assignments.find(a => a.partnerId.toString() === pid);
      if (!existing) {
        project.assignments.push({
          partnerId: pid,
          targetEnrollment: targetEnrollment || 0,
          targetPlacement: targetPlacement || 0,
          customTerms: customTerms || '',
          fundAllocated: fundAllocated || 0,
        });
      }
    });
    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/accept', protect, partnerOrAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const assignment = project.assignments.find(a => a.partnerId.toString() === req.user.partnerId.toString());
    if (!assignment) return res.status(404).json({ success: false, message: 'Project not assigned to you' });
    assignment.accepted = true;
    assignment.acceptedDate = new Date();
    assignment.status = 'accepted';
    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/decline', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const assignment = project.assignments.find(a => a.partnerId.toString() === req.user.partnerId.toString());
    if (!assignment) return res.status(404).json({ success: false, message: 'Project not assigned to you' });
    assignment.status = 'declined';
    assignment.declinedReason = reason;
    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/document', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { title, fileUrl, type } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.documents.push({
      partnerId: req.user.partnerId,
      title,
      fileUrl,
      type,
    });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/document/:docId/approve', protect, superAdminOnly, async (req, res) => {
  try {
    const { approvalStatus, remarks } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const doc = project.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    doc.approvalStatus = approvalStatus;
    doc.remarks = remarks;
    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/placement', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { studentId, company, jobRole, salary, offerLetter, joiningDate } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.placements.push({
      partnerId: req.user.partnerId,
      studentId,
      company,
      jobRole,
      salary,
      offerLetter,
      joiningDate,
    });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/notice', protect, superAdminOnly, async (req, res) => {
  try {
    const { title, message, forPartnerId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    project.notices.push({ title, message, forPartnerId });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
