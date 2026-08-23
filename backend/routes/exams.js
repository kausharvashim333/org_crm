const express = require('express');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      filter.partnerId = req.user.partnerId;
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.batchId) filter.batchId = req.query.batchId;
    const exams = await Exam.find(filter).populate('batchId', 'name').populate('courseId', 'name').sort({ date: -1 });
    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('batchId courseId').populate('results.studentId', 'fullName phone');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && exam.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can create exams' });
    }
    const exam = await Exam.create({ ...req.body, partnerId: req.user.partnerId });
    res.status(201).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && exam.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, exam: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && exam.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/results', protect, partnerOrAdmin, async (req, res) => {
  try {
    const { results } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && exam.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    exam.results = results;
    exam.status = 'result_declared';
    await exam.save();
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get exams available to a student
router.get('/student/available', protect, async (req, res) => {
  try {
    let student = null;
    if (req.user.role === 'student') {
      student = await Student.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
    }
    if (!student) return res.json({ success: true, exams: [] });

    const exams = await Exam.find({
      batchId: { $in: student.batchIds || [] },
      status: { $in: ['scheduled', 'ongoing'] },
    }).populate('courseId', 'name').populate('batchId', 'name').sort({ date: 1 }).lean();

    const examsWithSubmissionStatus = exams.map(ex => {
      const submission = ex.submissions?.find(s => s.studentId?.toString() === student._id?.toString());
      return {
        _id: ex._id,
        name: ex.name,
        examType: ex.examType,
        date: ex.date,
        maxMarks: ex.maxMarks,
        passingMarks: ex.passingMarks,
        courseName: ex.courseId?.name || 'N/A',
        batchName: ex.batchId?.name || 'N/A',
        durationMinutes: ex.examSettings?.durationMinutes || 60,
        instructions: ex.examSettings?.instructions || '',
        questionCount: ex.questions?.length || 0,
        hasSubmitted: !!submission,
        submission: submission ? {
          totalMarksAwarded: submission.totalMarksAwarded,
          status: submission.status,
          grade: submission.grade,
          submittedAt: submission.submittedAt,
        } : null,
      };
    });

    res.json({ success: true, exams: examsWithSubmissionStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get exam questions for a student to attempt
router.get('/:id/questions', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can take exams' });
    }
    const exam = await Exam.findById(req.params.id).populate('courseId', 'name').populate('batchId', 'name');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (!['scheduled', 'ongoing'].includes(exam.status)) {
      return res.status(400).json({ success: false, message: 'Exam is not available' });
    }

    const student = await Student.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existingSubmission = exam.submissions?.find(s => s.studentId?.toString() === student._id?.toString());
    if (existingSubmission && !exam.examSettings?.allowRetake) {
      return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
    }

    const questions = exam.questions.map(q => ({
      _id: q._id,
      type: q.type,
      questionText: q.questionText,
      options: q.type === 'mcq' ? q.options : q.type === 'true_false' ? ['True', 'False'] : [],
      marks: q.marks,
    }));

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        name: exam.name,
        maxMarks: exam.maxMarks,
        passingMarks: exam.passingMarks,
        durationMinutes: exam.examSettings?.durationMinutes || 60,
        instructions: exam.examSettings?.instructions || '',
        courseName: exam.courseId?.name || 'N/A',
        negativeMarkingEnabled: exam.examSettings?.negativeMarkingEnabled || false,
        totalQuestions: questions.length,
      },
      questions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit exam answers (auto-grade MCQ & True/False)
router.post('/:id/submit', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit exams' });
    }
    const { answers, startedAt } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const student = await Student.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existingIdx = exam.submissions.findIndex(s => s.studentId?.toString() === student._id?.toString());
    if (existingIdx >= 0 && !exam.examSettings?.allowRetake) {
      return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
    }

    let totalMarksAwarded = 0;
    const gradedAnswers = (answers || []).map(ans => {
      const question = exam.questions.id(ans.questionId);
      if (!question) return null;

      let isCorrect = false;
      let marksAwarded = 0;

      if (question.type === 'mcq' || question.type === 'true_false') {
        if (ans.selectedOptionIndex === question.correctOptionIndex) {
          isCorrect = true;
          marksAwarded = question.marks;
        } else if (ans.selectedOptionIndex >= 0 && exam.examSettings?.negativeMarkingEnabled) {
          marksAwarded = -(question.negativeMarks || 0);
        }
      } else if (question.type === 'subjective') {
        marksAwarded = 0;
      }

      totalMarksAwarded += marksAwarded;
      return {
        questionId: question._id,
        selectedOptionIndex: ans.selectedOptionIndex ?? -1,
        textAnswer: ans.textAnswer || '',
        isCorrect,
        marksAwarded,
      };
    }).filter(Boolean);

    const percentage = exam.maxMarks > 0 ? (totalMarksAwarded / exam.maxMarks) * 100 : 0;
    const status = totalMarksAwarded >= exam.passingMarks ? 'pass' : 'fail';
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';

    const submittedAt = new Date();
    const timeSpentMinutes = startedAt ? Math.round((submittedAt - new Date(startedAt)) / 60000) : 0;

    const submission = {
      studentId: student._id,
      answers: gradedAnswers,
      totalMarksAwarded,
      status,
      grade,
      startedAt: startedAt ? new Date(startedAt) : null,
      submittedAt,
      timeSpentMinutes,
    };

    if (existingIdx >= 0) {
      exam.submissions[existingIdx] = submission;
    } else {
      exam.submissions.push(submission);
    }

    const resultIdx = exam.results.findIndex(r => r.studentId?.toString() === student._id?.toString());
    const resultData = { studentId: student._id, marksObtained: totalMarksAwarded, grade, status };
    if (resultIdx >= 0) {
      exam.results[resultIdx] = resultData;
    } else {
      exam.results.push(resultData);
    }

    await exam.save();

    const showResults = exam.examSettings?.showResultsImmediately !== false;
    res.json({
      success: true,
      message: 'Exam submitted successfully',
      result: showResults ? {
        totalMarksAwarded,
        maxMarks: exam.maxMarks,
        percentage: percentage.toFixed(1),
        status,
        grade,
        timeSpentMinutes,
        correctCount: gradedAnswers.filter(a => a.isCorrect).length,
        totalQuestions: exam.questions.length,
      } : { status: 'submitted', message: 'Results will be declared by your instructor.' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
