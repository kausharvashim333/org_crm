const express = require('express');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Partner = require('../models/Partner');
const StudentProgress = require('../models/StudentProgress');
const Certificate = require('../models/Certificate');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Material = require('../models/Material');
const User = require('../models/User');
const OrgHomepage = require('../models/OrgHomepage');
const Exam = require('../models/Exam');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Helper to resolve student record for logged-in user safely
const getStudentForUser = async (user) => {
  if (!user) return null;

  let student = null;

  // Priority 1: Match strictly by userId if set
  if (user._id) {
    student = await Student.findOne({ userId: user._id });
  }

  // Priority 2: Match strictly by lowercase email
  if (!student && user.email) {
    const uEmail = user.email.toLowerCase().trim();
    student = await Student.findOne({ email: uEmail });
  }

  // Priority 3: Match strictly by valid non-dummy phone
  const isValidPhone = (p) => p && typeof p === 'string' && p.trim().length >= 10 && !/^0+$/.test(p.trim());
  if (!student && isValidPhone(user.phone)) {
    student = await Student.findOne({ phone: user.phone.trim() });
  }

  // Bind userId if student found but userId wasn't set
  if (student && !student.userId && user._id) {
    student.userId = user._id;
    await student.save();
  }

  // Priority 4: Create new dedicated student record for this user if not found
  if (!student && user.role === 'student') {
    student = await Student.create({
      partnerId: user.partnerId || undefined,
      userId: user._id,
      fullName: user.name || 'Student User',
      email: user.email ? user.email.toLowerCase().trim() : '',
      phone: isValidPhone(user.phone) ? user.phone.trim() : (user.phone || '9876543210'),
    });
  }

  return student;
};

// Get all courses enrolled/available for student
router.get('/courses', protect, async (req, res) => {
  try {
    const student = await getStudentForUser(req.user);
    let courses = [];
    if (student && student.courseId && student.courseId.length > 0) {
      courses = await Course.find({ _id: { $in: student.courseId }, isActive: true });
    }
    // If no explicit student enrollments found, fetch all standard active courses for demonstration/learning
    if (courses.length === 0) {
      courses = await Course.find({ isActive: true });
    }

    // Fetch progress for each course
    const courseIds = courses.map(c => c._id);
    const progressList = student ? await StudentProgress.find({ studentId: student._id, courseId: { $in: courseIds } }) : [];
    
    const progressMap = {};
    progressList.forEach(p => {
      progressMap[p.courseId.toString()] = p;
    });

    const result = courses.map(c => {
      const p = progressMap[c._id.toString()] || {};
      const watchedCount = (p.watchedChapters || []).length;
      const totalChapters = (c.chapters || []).length;
      const progressPercent = totalChapters > 0 ? Math.round((watchedCount / totalChapters) * 100) : 0;
      return {
        ...c.toObject(),
        watchedChapters: p.watchedChapters || [],
        progressPercent,
        isCompleted: p.isCompleted || false,
        assessmentAttempt: p.assessmentAttempt || null,
        certificateId: p.certificateId || null,
      };
    });

    let partner = null;
    if (req.user.partnerId) {
      partner = await Partner.findById(req.user.partnerId);
    } else if (student && student.partnerId) {
      partner = await Partner.findById(student.partnerId);
    }

    res.json({ success: true, count: result.length, courses: result, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get detailed course player info & progress
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const student = await getStudentForUser(req.user);
    let progress = null;
    if (student) {
      progress = await StudentProgress.findOne({ studentId: student._id, courseId: course._id });
    }

    const watchedChapters = progress ? progress.watchedChapters : [];
    const totalChapters = (course.chapters || []).length;
    const progressPercent = totalChapters > 0 ? Math.round((watchedChapters.length / totalChapters) * 100) : 0;
    const isAllWatched = totalChapters > 0 && watchedChapters.length >= totalChapters;

    res.json({
      success: true,
      course,
      progress: {
        watchedChapters,
        progressPercent,
        isAllWatched,
        isCompleted: progress ? progress.isCompleted : false,
        assessmentAttempt: progress ? progress.assessmentAttempt : null,
        certificateId: progress ? progress.certificateId : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark chapter video as watched
router.post('/watch-chapter', protect, async (req, res) => {
  try {
    const { courseId, chapterId } = req.body;
    if (!courseId || !chapterId) {
      return res.status(400).json({ success: false, message: 'courseId and chapterId required' });
    }
    const student = await getStudentForUser(req.user);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    let progress = await StudentProgress.findOne({ studentId: student._id, courseId });
    if (!progress) {
      progress = new StudentProgress({
        studentId: student._id,
        userId: req.user._id,
        courseId,
        watchedChapters: [],
      });
    }

    if (!progress.watchedChapters.includes(chapterId)) {
      progress.watchedChapters.push(chapterId);
      await progress.save();
    }

    const course = await Course.findById(courseId);
    const totalChapters = (course.chapters || []).length;
    const progressPercent = totalChapters > 0 ? Math.round((progress.watchedChapters.length / totalChapters) * 100) : 0;
    const isAllWatched = totalChapters > 0 && progress.watchedChapters.length >= totalChapters;

    res.json({
      success: true,
      watchedChapters: progress.watchedChapters,
      progressPercent,
      isAllWatched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit Assessment Quiz & Generate Certificate if Passed
router.post('/submit-assessment', protect, async (req, res) => {
  try {
    const { courseId, answers } = req.body; // answers: { questionIndex: selectedOptionIndex }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const student = await getStudentForUser(req.user);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    const questions = (course.assessment && course.assessment.questions) || [];
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No assessment questions configured for this course' });
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers && answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passingScore = (course.assessment && course.assessment.passingScore) || 50;
    const passed = percentage >= passingScore;

    let progress = await StudentProgress.findOne({ studentId: student._id, courseId: course._id });
    if (!progress) {
      progress = new StudentProgress({
        studentId: student._id,
        userId: req.user._id,
        courseId: course._id,
        watchedChapters: [],
      });
    }

    progress.assessmentAttempt = {
      passed,
      score: correctCount,
      totalQuestions: questions.length,
      percentage,
      attemptedAt: new Date(),
    };

    let certificate = null;
    if (passed) {
      progress.isCompleted = true;

      // Check if certificate already exists or create new
      certificate = await Certificate.findOne({ studentId: student._id, courseId: course._id });
      if (!certificate) {
        const certNo = 'CERT-' + Date.now().toString().slice(-6) + Math.floor(1000 + Math.random() * 9000);
        const verCode = 'VER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        certificate = await Certificate.create({
          partnerId: student.partnerId || req.user.partnerId || '000000000000000000000000',
          studentId: student._id,
          courseId: course._id,
          certificateNo: certNo,
          issueDate: new Date(),
          percentage,
          grade: percentage >= 85 ? 'A+' : percentage >= 75 ? 'A' : percentage >= 60 ? 'B' : 'C',
          status: 'issued',
          verificationCode: verCode,
        });
      }
      progress.certificateId = certificate._id;
    }

    await progress.save();

    res.json({
      success: true,
      result: {
        passed,
        score: correctCount,
        totalQuestions: questions.length,
        percentage,
        passingScore,
        certificateId: certificate ? certificate._id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch Student Certificate Details
router.get('/certificate/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('studentId', 'fullName phone email photo rollNumber fatherName')
      .populate('courseId', 'name code duration durationMonths category')
      .populate('partnerId', 'centerName address city state code logo');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Comprehensive Student Portal Dashboard Data (Profile, Partner, Courses, Fees, Attendance, Materials, Certificates)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const student = await getStudentForUser(req.user);
    
    let partner = null;
    if (req.user.partnerId) {
      partner = await Partner.findById(req.user.partnerId).lean();
    } else if (student && student.partnerId) {
      partner = await Partner.findById(student.partnerId).lean();
    }

    // 1. Enrolled Courses & Progress
    let courses = [];
    if (student && student.courseId && student.courseId.length > 0) {
      courses = await Course.find({ _id: { $in: student.courseId }, isActive: true }).lean();
    }
    if (courses.length === 0) {
      courses = await Course.find({ isActive: true }).lean();
    }

    const courseIds = courses.map(c => c._id);
    const progressList = student ? await StudentProgress.find({ studentId: student._id, courseId: { $in: courseIds } }).lean() : [];
    
    const progressMap = {};
    progressList.forEach(p => {
      progressMap[p.courseId.toString()] = p;
    });

    const coursesWithProgress = courses.map(c => {
      const p = progressMap[c._id.toString()] || {};
      const watchedCount = (p.watchedChapters || []).length;
      const totalChapters = (c.chapters || []).length;
      const progressPercent = totalChapters > 0 ? Math.round((watchedCount / totalChapters) * 100) : 0;
      return {
        ...c,
        watchedChapters: p.watchedChapters || [],
        progressPercent,
        isCompleted: p.isCompleted || false,
        assessmentAttempt: p.assessmentAttempt || null,
        certificateId: p.certificateId || null,
      };
    });

    // 2. Fee Receipts & Ledger
    let feeRecords = [];
    if (student) {
      feeRecords = await Fee.find({ studentId: student._id }).sort({ createdAt: -1 }).lean();
    }

    // 3. Attendance Logs
    let attendanceLogs = [];
    if (student) {
      attendanceLogs = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).limit(30).lean();
    }

    // 4. Study Materials
    let materials = [];
    if (partner) {
      materials = await Material.find({ partnerId: partner._id, isActive: true }).sort({ createdAt: -1 }).lean();
    }
    if (materials.length === 0) {
      materials = await Material.find({ isActive: true }).sort({ createdAt: -1 }).limit(20).lean();
    }

    // 5. Issued Certificates
    let certificates = [];
    if (student) {
      certificates = await Certificate.find({ studentId: student._id })
        .populate('courseId', 'name code duration')
        .sort({ issueDate: -1 })
        .lean();
    }

    // 6. Exam Results
    let examResults = [];
    if (student) {
      const exams = await Exam.find({
        partnerId: student.partnerId,
        'results.studentId': student._id,
        status: 'result_declared'
      }).populate('courseId', 'name code').sort({ date: -1 }).lean();
      examResults = exams.map(exam => {
        const result = exam.results.find(r => r.studentId && r.studentId.toString() === student._id.toString());
        return {
          _id: exam._id,
          name: exam.name,
          examType: exam.examType,
          date: exam.date,
          maxMarks: exam.maxMarks,
          passingMarks: exam.passingMarks,
          courseName: exam.courseId?.name || 'N/A',
          marksObtained: result?.marksObtained,
          grade: result?.grade,
          status: result?.status,
        };
      });
    }

    // 7. Notifications
    let notifications = [];
    if (req.user.partnerId) {
      notifications = await Notification.find({
        $or: [{ toPartnerId: req.user.partnerId }, { toPartnerId: null, type: 'broadcast' }]
      }).sort({ createdAt: -1 }).limit(10).lean();
    } else {
      notifications = await Notification.find({ toPartnerId: null, type: 'broadcast' }).sort({ createdAt: -1 }).limit(10).lean();
    }

    // 8. Organization Settings for Direct Online Students
    const orgHp = await OrgHomepage.findOne().lean();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: student?.fullName || req.user.name,
        email: req.user.email,
        phone: student?.phone || req.user.phone,
        role: req.user.role,
        studentIdNo: student?.studentIdNo || student?.applicationNo || 'STU-LOCAL',
        photo: student?.photo || req.user.avatar,
        address: student?.address ? `${student.address}, ${student.city || ''} ${student.state || ''}` : null,
        enrollmentDate: student?.enrollmentDate || student?.createdAt || req.user.createdAt,
      },
      partner,
      orgSettings: orgHp?.settings || {},
      student,
      courses: coursesWithProgress,
      fees: feeRecords,
      attendance: attendanceLogs,
      materials,
      certificates,
      exams: examResults,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Student Profile (Personal, Contact & Academic Details)
router.put('/profile', protect, async (req, res) => {
  try {
    let student = await getStudentForUser(req.user);
    if (!student) {
      // If student document doesn't exist yet, create one linked to this user
      student = new Student({
        userId: req.user._id,
        fullName: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '0000000000',
      });
    }

    const {
      fullName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      whatsappPhone,
      category,
      bloodGroup,
      address,
      city,
      state,
      pincode,
      qualification,
      guardianName,
      guardianPhone,
      tenthDetails,
      twelfthDetails,
      graduationDetails,
    } = req.body;

    if (fullName) {
      student.fullName = fullName;
      await User.findByIdAndUpdate(req.user._id, { name: fullName });
    }

    if (fatherName !== undefined) student.fatherName = fatherName;
    if (motherName !== undefined) student.motherName = motherName;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (gender !== undefined) student.gender = gender;
    if (whatsappPhone !== undefined) student.whatsappPhone = whatsappPhone;
    if (category !== undefined) student.category = category;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
    if (address !== undefined) student.address = address;
    if (city !== undefined) student.city = city;
    if (state !== undefined) student.state = state;
    if (pincode !== undefined) student.pincode = pincode;
    if (qualification !== undefined) student.qualification = qualification;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;

    if (tenthDetails) {
      student.tenthDetails = {
        ...student.tenthDetails,
        ...tenthDetails,
      };
    }
    if (twelfthDetails) {
      student.twelfthDetails = {
        ...student.twelfthDetails,
        ...twelfthDetails,
      };
    }
    if (graduationDetails) {
      student.graduationDetails = {
        ...student.graduationDetails,
        ...graduationDetails,
      };
    }

    await student.save();

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      student,
      user: {
        id: req.user._id,
        name: student.fullName,
        email: req.user.email,
        phone: student.phone,
        studentIdNo: student.studentIdNo || student.applicationNo,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student upload document (deferred upload)
router.post('/upload-document', protect, upload.single('document'), async (req, res) => {
  try {
    const student = await getStudentForUser(req.user);
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'Please select a file' });
    const { docName } = req.body;
    if (!docName) return res.status(400).json({ success: false, message: 'Document name is required' });

    const fileUrl = `/uploads/${req.file.filename}`;
    student.uploadedDocuments = (student.uploadedDocuments || []).filter(d => d.docName !== docName);
    student.uploadedDocuments.push({ docName, fileUrl, uploadedAt: new Date() });
    await student.save();

    res.json({ success: true, message: 'Document uploaded successfully', student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

