const express = require('express');
const QuestionBank = require('../models/QuestionBank');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all questions (with filters)
router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, questions: [] });
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.tag) filter.tags = { $in: [req.query.tag] };
    if (req.query.search) {
      filter.questionText = { $regex: req.query.search, $options: 'i' };
    }
    const questions = await QuestionBank.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get categories
router.get('/categories', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') filter.partnerId = req.user.partnerId;
    const categories = await QuestionBank.distinct('category', filter);
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tags
router.get('/tags', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') filter.partnerId = req.user.partnerId;
    const tags = await QuestionBank.distinct('tags', filter);
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a question
router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can create questions' });
    }
    const question = await QuestionBank.create({ ...req.body, partnerId: req.user.partnerId });
    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create (for CSV import)
router.post('/bulk', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can import questions' });
    }
    const { questions } = req.body;
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }
    const created = await QuestionBank.insertMany(
      questions.map(q => ({ ...q, partnerId: req.user.partnerId }))
    );
    res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a question
router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    if (req.user.role === 'partner' && question.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await QuestionBank.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, question: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a question
router.delete('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    if (req.user.role === 'partner' && question.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await QuestionBank.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
