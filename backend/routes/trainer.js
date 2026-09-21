const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { protect, superAdminOnly, trainerOrAdmin } = require('../middleware/auth');

// ==========================================
// TRAINER PORTAL ROUTES (Trainer / SuperAdmin)
// ==========================================

// 1. Trainer Dashboard Stats
router.get('/dashboard', protect, trainerOrAdmin, async (req, res) => {
  try {
    const isTrainer = req.user.role === 'trainer';
    const filter = isTrainer ? { trainerId: req.user._id } : {};

    const [allBatches, runningBatches, upcomingBatches, completedBatches] = await Promise.all([
      Batch.find(filter).populate('courseId', 'name code duration category'),
      Batch.find({ ...filter, status: 'active' }).populate('courseId', 'name code duration thumbnail'),
      Batch.find({ ...filter, status: 'upcoming' }).populate('courseId', 'name code duration thumbnail'),
      Batch.find({ ...filter, status: 'completed' }),
    ]);

    // Calculate unique students across all trainer's batches
    const studentIdSet = new Set();
    allBatches.forEach(b => {
      (b.enrolledStudents || []).forEach(sid => studentIdSet.add(sid.toString()));
    });

    // Unique courses being trained
    const courseIdSet = new Set();
    allBatches.forEach(b => {
      if (b.courseId?._id) courseIdSet.add(b.courseId._id.toString());
    });

    res.json({
      success: true,
      stats: {
        totalBatches: allBatches.length,
        runningBatchesCount: runningBatches.length,
        upcomingBatchesCount: upcomingBatches.length,
        completedBatchesCount: completedBatches.length,
        totalStudentsCount: studentIdSet.size,
        coursesCount: courseIdSet.size,
      },
      runningBatches,
      upcomingBatches: upcomingBatches.slice(0, 5),
    });
  } catch (error) {
    console.error('Trainer dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Trainer's Batches (with filters for status: active | upcoming | completed)
router.get('/batches', protect, trainerOrAdmin, async (req, res) => {
  try {
    const isTrainer = req.user.role === 'trainer';
    const filter = isTrainer ? { trainerId: req.user._id } : {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.courseId) {
      filter.courseId = req.query.courseId;
    }

    const batches = await Batch.find(filter)
      .populate('courseId', 'name code duration category thumbnail fee')
      .populate('trainerId', 'name email phone avatar')
      .populate('enrolledStudents', 'fullName email phone photo applicationNo studentIdNo')
      .sort({ startDate: -1, createdAt: -1 });

    res.json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (error) {
    console.error('Trainer batches fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Batch Details with Full Enrolled Students List
router.get('/batches/:id', protect, trainerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('courseId')
      .populate('trainerId', 'name email phone')
      .populate({
        path: 'enrolledStudents',
        select: 'fullName email phone city state applicationNo studentIdNo photo status enrollmentDate gender qualification',
      });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Authorization: trainer can only view their own batch (unless super_admin/staff)
    if (req.user.role === 'trainer' && (!batch.trainerId || batch.trainerId._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this batch' });
    }

    res.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error('Trainer batch detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Update Batch Syllabus Progress / Status by Trainer
router.put('/batches/:id/progress', protect, trainerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (req.user.role === 'trainer' && (!batch.trainerId || batch.trainerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized for this batch' });
    }

    const { syllabusProgress, status, notes } = req.body;
    if (syllabusProgress !== undefined) batch.syllabusProgress = syllabusProgress;
    if (status) batch.status = status;
    if (notes !== undefined) batch.notes = notes;

    await batch.save();

    res.json({
      success: true,
      message: 'Batch progress updated successfully',
      batch,
    });
  } catch (error) {
    console.error('Update batch progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Update Live Class Meeting Link / Timing by Trainer
router.put('/batches/:id/meeting-link', protect, trainerOrAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (req.user.role === 'trainer' && (!batch.trainerId || batch.trainerId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized for this batch' });
    }

    const { meetingLink, timing, schedule, notes } = req.body;
    if (meetingLink !== undefined) batch.meetingLink = meetingLink;
    if (timing !== undefined) batch.timing = timing;
    if (schedule !== undefined) batch.schedule = schedule;
    if (notes !== undefined) batch.notes = notes;

    await batch.save();

    res.json({
      success: true,
      message: 'Class meeting link & schedule updated successfully',
      batch,
    });
  } catch (error) {
    console.error('Update meeting link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Get All Students Enrolled Across Trainer's Batches
router.get('/students', protect, trainerOrAdmin, async (req, res) => {
  try {
    const isTrainer = req.user.role === 'trainer';
    const filter = isTrainer ? { trainerId: req.user._id } : {};
    if (req.query.batchId) filter._id = req.query.batchId;

    const batches = await Batch.find(filter)
      .populate('courseId', 'name code')
      .populate({
        path: 'enrolledStudents',
        select: 'fullName email phone city state applicationNo studentIdNo photo status enrollmentDate gender qualification',
      });

    // Flatten students with batch context
    const studentMap = new Map();
    batches.forEach(b => {
      (b.enrolledStudents || []).forEach(st => {
        if (!st) return;
        const stId = st._id.toString();
        if (!studentMap.has(stId)) {
          studentMap.set(stId, {
            ...st.toObject(),
            batches: [],
          });
        }
        studentMap.get(stId).batches.push({
          batchId: b._id,
          batchName: b.name,
          courseName: b.courseId?.name,
          courseCode: b.courseId?.code,
          batchStatus: b.status,
          timing: b.timing,
        });
      });
    });

    let students = Array.from(studentMap.values());

    // Search filter if provided
    if (req.query.search) {
      const q = req.query.search.toLowerCase().trim();
      students = students.filter(s =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.applicationNo?.toLowerCase().includes(q) ||
        s.studentIdNo?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Get trainer students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// SUPER ADMIN MANAGEMENT (Trainers & Batches)
// ==========================================

// 7. Admin: Get all Trainers with their statistics
router.get('/admin/trainers', protect, superAdminOnly, async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('name email phone isActive lastLogin createdAt avatar')
      .sort({ createdAt: -1 });

    // Aggregate batches count and student counts for each trainer
    const trainerBatches = await Batch.find({ trainerId: { $in: trainers.map(t => t._id) } });

    const statsMap = {};
    trainerBatches.forEach(b => {
      const tId = b.trainerId.toString();
      if (!statsMap[tId]) {
        statsMap[tId] = { totalBatches: 0, activeBatches: 0, upcomingBatches: 0, studentCount: 0 };
      }
      statsMap[tId].totalBatches += 1;
      if (b.status === 'active') statsMap[tId].activeBatches += 1;
      if (b.status === 'upcoming') statsMap[tId].upcomingBatches += 1;
      statsMap[tId].studentCount += (b.enrolledStudents?.length || 0);
    });

    const result = trainers.map(t => ({
      ...t.toObject(),
      stats: statsMap[t._id.toString()] || { totalBatches: 0, activeBatches: 0, upcomingBatches: 0, studentCount: 0 },
    }));

    res.json({ success: true, trainers: result });
  } catch (error) {
    console.error('Admin get trainers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Admin: Create a new Trainer
router.post('/admin/trainers', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const trainer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password,
      role: 'trainer',
      assignedRoleName: 'Course Trainer',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      trainer: {
        _id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        isActive: trainer.isActive,
      },
    });
  } catch (error) {
    console.error('Admin create trainer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Admin: Update Trainer Profile / Status
router.put('/admin/trainers/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, role: 'trainer' });
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    const { name, phone, isActive, password } = req.body;
    if (name) trainer.name = name.trim();
    if (phone !== undefined) trainer.phone = phone.trim();
    if (isActive !== undefined) trainer.isActive = isActive;
    if (password && password.length >= 6) {
      trainer.password = password;
    }

    await trainer.save();

    res.json({
      success: true,
      message: 'Trainer updated successfully',
      trainer: {
        _id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        isActive: trainer.isActive,
      },
    });
  } catch (error) {
    console.error('Admin update trainer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Admin: Delete Trainer
router.delete('/admin/trainers/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const trainer = await User.findOne({ _id: req.params.id, role: 'trainer' });
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });

    // Unassign trainer from batches
    await Batch.updateMany({ trainerId: trainer._id }, { $unset: { trainerId: 1 } });
    await User.findByIdAndDelete(trainer._id);

    res.json({ success: true, message: 'Trainer deleted and unassigned from batches' });
  } catch (error) {
    console.error('Admin delete trainer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. Admin: Create a Course Batch & Allot to Trainer
router.post('/admin/batches', protect, superAdminOnly, async (req, res) => {
  try {
    const {
      name,
      courseId,
      trainerId,
      startDate,
      endDate,
      timing,
      schedule,
      mode,
      meetingLink,
      maxStudents,
      notes,
      status,
    } = req.body;

    if (!name || !courseId || !startDate) {
      return res.status(400).json({ success: false, message: 'Batch name, course, and start date are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Auto-populate syllabusProgress from course syllabus if available
    let initialSyllabus = [];
    if (course.syllabus && course.syllabus.length > 0) {
      initialSyllabus = course.syllabus.map(item => ({
        module: typeof item === 'string' ? item : (item.moduleTitle || item.title || 'Module'),
        completed: false,
      }));
    }

    const batchCode = `BATCH-${course.code ? course.code.toUpperCase() : 'CRS'}-${Date.now().toString().slice(-4)}`;

    const batch = await Batch.create({
      name: name.trim(),
      batchCode,
      courseId,
      trainerId: trainerId || undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      timing: timing || '',
      schedule: schedule || '',
      mode: mode || 'online',
      meetingLink: meetingLink || '',
      maxStudents: maxStudents || 30,
      notes: notes || '',
      status: status || 'upcoming',
      syllabusProgress: initialSyllabus,
    });

    const populated = await Batch.findById(batch._id)
      .populate('courseId', 'name code duration category')
      .populate('trainerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Batch created and allotted successfully',
      batch: populated,
    });
  } catch (error) {
    console.error('Admin create batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. Admin: Update Batch & Re-allot Trainer
router.put('/admin/batches/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const {
      name,
      courseId,
      trainerId,
      startDate,
      endDate,
      timing,
      schedule,
      mode,
      meetingLink,
      maxStudents,
      notes,
      status,
    } = req.body;

    if (name) batch.name = name.trim();
    if (courseId) batch.courseId = courseId;
    if (trainerId !== undefined) batch.trainerId = trainerId ? trainerId : undefined;
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate !== undefined) batch.endDate = endDate ? new Date(endDate) : undefined;
    if (timing !== undefined) batch.timing = timing;
    if (schedule !== undefined) batch.schedule = schedule;
    if (mode !== undefined) batch.mode = mode;
    if (meetingLink !== undefined) batch.meetingLink = meetingLink;
    if (maxStudents !== undefined) batch.maxStudents = maxStudents;
    if (notes !== undefined) batch.notes = notes;
    if (status !== undefined) batch.status = status;

    await batch.save();

    const populated = await Batch.findById(batch._id)
      .populate('courseId', 'name code duration category')
      .populate('trainerId', 'name email phone')
      .populate('enrolledStudents', 'fullName email phone');

    res.json({
      success: true,
      message: 'Batch updated successfully',
      batch: populated,
    });
  } catch (error) {
    console.error('Admin update batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. Admin: Delete Batch
router.delete('/admin/batches/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Unassign batch from enrolled students
    await Student.updateMany(
      { batchId: batch._id },
      { $unset: { batchId: 1 }, $pull: { batchIds: batch._id } }
    );

    await Batch.findByIdAndDelete(batch._id);

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Admin delete batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 14. Admin: Get Students Enrolled in a Specific Course (to easily allot them to a batch)
router.get('/admin/course-students/:courseId', protect, superAdminOnly, async (req, res) => {
  try {
    const students = await Student.find({
      courseId: req.params.courseId,
    }).select('fullName email phone city state applicationNo studentIdNo batchId batchIds enrollmentDate photo status');

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Admin course students fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 15. Admin: Enroll Multiple Students into a Batch
router.post('/admin/batches/:id/enroll-students', protect, superAdminOnly, async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    let addedCount = 0;
    for (const sid of studentIds) {
      if (!batch.enrolledStudents.map(id => id.toString()).includes(sid.toString())) {
        if (batch.enrolledStudents.length < batch.maxStudents) {
          batch.enrolledStudents.push(sid);
          addedCount++;

          // Update student
          await Student.findByIdAndUpdate(sid, {
            $set: { batchId: batch._id },
            $addToSet: { batchIds: batch._id },
          });
        }
      }
    }

    await batch.save();

    const updated = await Batch.findById(batch._id)
      .populate('courseId', 'name code duration')
      .populate('trainerId', 'name email phone')
      .populate('enrolledStudents', 'fullName email phone applicationNo studentIdNo');

    res.json({
      success: true,
      message: `${addedCount} student(s) enrolled into batch successfully`,
      batch: updated,
    });
  } catch (error) {
    console.error('Admin enroll students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 16. Admin: Remove a Student from a Batch
router.post('/admin/batches/:id/remove-student', protect, superAdminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    batch.enrolledStudents = batch.enrolledStudents.filter(sid => sid.toString() !== studentId.toString());
    await batch.save();

    // Update student
    const student = await Student.findById(studentId);
    if (student) {
      if (student.batchId && student.batchId.toString() === batch._id.toString()) {
        student.batchId = undefined;
      }
      student.batchIds = (student.batchIds || []).filter(bid => bid.toString() !== batch._id.toString());
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student removed from batch successfully',
      batch,
    });
  } catch (error) {
    console.error('Admin remove student from batch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
