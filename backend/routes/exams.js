const express = require('express');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { protect, partnerOrAdmin } = require('../middleware/auth');
const requireAddon = require('../middleware/addonGate');

const router = express.Router();

router.get('/', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (!req.user.partnerId) return res.json({ success: true, count: 0, exams: [] });
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

// Get exams available to a student (MUST be before /:id to avoid route conflict)
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

router.get('/:id', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('batchId courseId').populate('results.studentId', 'fullName phone');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can create exams' });
    }
    if (!req.user.partnerId) {
      return res.status(400).json({ success: false, message: 'Partner profile not found. Please contact support.' });
    }
    const cleanBody = { ...req.body };
    if (!cleanBody.batchId) delete cleanBody.batchId;
    if (!cleanBody.courseId) delete cleanBody.courseId;
    const exam = await Exam.create({ ...cleanBody, partnerId: req.user.partnerId });
    res.status(201).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, exam: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/results', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const { results } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
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
    const { answers, startedAt, tabSwitchCount } = req.body;
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
      tabSwitchCount: tabSwitchCount || 0,
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

// Get exam analytics for partner
router.get('/:id/analytics', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('submissions.studentId', 'fullName phone')
      .populate('batchId', 'name');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const submissions = exam.submissions || [];
    const totalSubmissions = submissions.length;
    const passedCount = submissions.filter(s => s.status === 'pass').length;
    const failedCount = submissions.filter(s => s.status === 'fail').length;
    const scores = submissions.map(s => s.totalMarksAwarded);
    const avgScore = totalSubmissions > 0 ? (scores.reduce((a, b) => a + b, 0) / totalSubmissions).toFixed(2) : 0;
    const maxScore = totalSubmissions > 0 ? Math.max(...scores) : 0;
    const minScore = totalSubmissions > 0 ? Math.min(...scores) : 0;
    const avgTimeSpent = totalSubmissions > 0 ? (submissions.reduce((a, s) => a + (s.timeSpentMinutes || 0), 0) / totalSubmissions).toFixed(1) : 0;
    const totalTabSwitches = submissions.reduce((a, s) => a + (s.tabSwitchCount || 0), 0);

    // Question-wise analysis
    const questionAnalysis = (exam.questions || []).map((q, qi) => {
      let correct = 0, attempted = 0, totalMarks = 0;
      submissions.forEach(s => {
        const ans = s.answers?.find(a => a.questionId?.toString() === q._id?.toString());
        if (ans) {
          if (ans.selectedOptionIndex >= 0 || ans.textAnswer) attempted++;
          if (ans.isCorrect) correct++;
          totalMarks += ans.marksAwarded || 0;
        }
      });
      return {
        questionIndex: qi,
        questionText: q.questionText?.substring(0, 80) + (q.questionText?.length > 80 ? '...' : ''),
        type: q.type,
        marks: q.marks,
        correctCount: correct,
        attemptedCount: attempted,
        unattemptedCount: totalSubmissions - attempted,
        correctPercentage: totalSubmissions > 0 ? ((correct / totalSubmissions) * 100).toFixed(1) : 0,
        avgMarks: totalSubmissions > 0 ? (totalMarks / totalSubmissions).toFixed(2) : 0,
      };
    });

    // Student-wise performance
    const studentPerformance = submissions.map(s => ({
      studentName: s.studentId?.fullName || 'Unknown',
      studentPhone: s.studentId?.phone || '',
      totalMarksAwarded: s.totalMarksAwarded,
      maxMarks: exam.maxMarks,
      percentage: exam.maxMarks > 0 ? ((s.totalMarksAwarded / exam.maxMarks) * 100).toFixed(1) : 0,
      status: s.status,
      grade: s.grade,
      timeSpentMinutes: s.timeSpentMinutes,
      tabSwitchCount: s.tabSwitchCount || 0,
      submittedAt: s.submittedAt,
    }));

    res.json({
      success: true,
      analytics: {
        examName: exam.name,
        totalSubmissions,
        passedCount,
        failedCount,
        passRate: totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(1) : 0,
        avgScore,
        maxScore,
        minScore,
        avgTimeSpent,
        totalTabSwitches,
        questionAnalysis,
        studentPerformance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual grade subjective answers
router.put('/:id/submissions/:studentId/grade', protect, partnerOrAdmin, requireAddon('exam_system'), async (req, res) => {
  try {
    const { grades } = req.body; // [{ questionId, marksAwarded }]
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'partner' && (!req.user.partnerId || exam.partnerId.toString() !== req.user.partnerId.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subIdx = exam.submissions.findIndex(s => s.studentId?.toString() === req.params.studentId);
    if (subIdx < 0) return res.status(404).json({ success: false, message: 'Submission not found' });

    let totalMarksAwarded = 0;
    (grades || []).forEach(g => {
      const ansIdx = exam.submissions[subIdx].answers.findIndex(a => a.questionId?.toString() === g.questionId);
      if (ansIdx >= 0) {
        exam.submissions[subIdx].answers[ansIdx].marksAwarded = g.marksAwarded;
        exam.submissions[subIdx].answers[ansIdx].isCorrect = g.marksAwarded > 0;
      }
    });

    totalMarksAwarded = exam.submissions[subIdx].answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    const percentage = exam.maxMarks > 0 ? (totalMarksAwarded / exam.maxMarks) * 100 : 0;
    exam.submissions[subIdx].totalMarksAwarded = totalMarksAwarded;
    exam.submissions[subIdx].status = totalMarksAwarded >= exam.passingMarks ? 'pass' : 'fail';
    exam.submissions[subIdx].grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';

    const resultIdx = exam.results.findIndex(r => r.studentId?.toString() === req.params.studentId);
    const resultData = { studentId: req.params.studentId, marksObtained: totalMarksAwarded, grade: exam.submissions[subIdx].grade, status: exam.submissions[subIdx].status };
    if (resultIdx >= 0) exam.results[resultIdx] = resultData;
    else exam.results.push(resultData);

    await exam.save();
    res.json({ success: true, message: 'Grades updated', submission: exam.submissions[subIdx] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
