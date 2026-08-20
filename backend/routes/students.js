const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Student = require('../models/Student');
const Course = require('../models/Course');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

const OrgHomepage = require('../models/OrgHomepage');

// Initialize Razorpay Client
let razorpayClient = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'D8Mqui5388u2E9bjOYL5uWDw';

if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayClient = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } catch (err) {
    console.error('Razorpay initialization in students.js error:', err);
  }
}

const generateStudentIdNo = async () => {
  const org = await OrgHomepage.findOne();
  const cfg = org?.codeSeriesConfig || {};
  const prefix = cfg.studentPrefix !== undefined ? cfg.studentPrefix : 'STU-';
  const includeYear = cfg.studentIncludeYear !== false;
  const startNo = cfg.studentStartNo || 1;
  const padLen = cfg.studentPadLength || 4;

  const count = await Student.countDocuments();
  const yearStr = includeYear ? `${new Date().getFullYear()}-` : '';
  const num = startNo + count;
  return `${prefix}${yearStr}${String(num).padStart(padLen, '0')}`;
};

router.get('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'partner') {
      if (req.user.partnerId) {
        const pId = req.user.partnerId._id || req.user.partnerId;
        filter.partnerId = pId;
      }
    } else if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentIdNo: { $regex: req.query.search, $options: 'i' } },
        { applicationNo: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 200;
    const skip = (page - 1) * limit;

    let students = [];
    try {
      students = await Student.find(filter)
        .populate('partnerId', 'instituteName centerName city state franchiseId code logo')
        .populate('courseId')
        .populate('batchIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (popErr) {
      console.error('Populate error on students query, falling back to raw find:', popErr);
      students = await Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Auto-assign studentIdNo safely if missing
    for (const s of students) {
      if (!s.studentIdNo) {
        try {
          s.studentIdNo = await generateStudentIdNo();
          await s.save({ validateBeforeSave: false });
        } catch (e) {
          // ignore validation error on legacy student
        }
      }
    }

    const total = await Student.countDocuments(filter);
    res.json({ success: true, count: students.length, total, page, pages: Math.ceil(total / limit), students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('partnerId', 'instituteName city state franchiseId code logo')
      .populate('courseId batchIds projectIds');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.user.role === 'partner' && student.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, partnerOrAdmin, async (req, res) => {
  try {
    const partnerId = req.user.partnerId || req.body.partnerId;
    if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Partner ID is required to register a student.' });
    }

    const studentIdNo = await generateStudentIdNo();
    const student = await Student.create({ ...req.body, partnerId, studentIdNo });

    // Create student User account for portal login
    const studentEmail = (req.body.email || `${req.body.phone}@student.local`).toLowerCase();
    let studentUser = await User.findOne({ email: studentEmail });
    if (!studentUser) {
      studentUser = await User.create({
        name: student.fullName,
        email: studentEmail,
        password: req.body.phone || 'student123',
        phone: student.phone,
        role: 'student',
        partnerId,
        isActive: true,
      });
    }
    if (studentUser && !student.userId) {
      student.userId = studentUser._id;
      await student.save();
    }

    res.status(201).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.user.role === 'partner' && student.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updates = { ...req.body };
    if (updates.status === 'dropout' && student.status !== 'dropout') {
      updates.dropoutDate = Date.now();
    }
    const updated = await Student.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, student: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/upload-document', protect, partnerOrAdmin, upload.single('document'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.user.role === 'partner' && student.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload' });
    }

    const { docName } = req.body;
    if (!docName) {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Remove existing doc with same name if any, then push new doc
    student.uploadedDocuments = (student.uploadedDocuments || []).filter(d => d.docName !== docName);
    student.uploadedDocuments.push({ docName, fileUrl, uploadedAt: new Date() });
    
    await student.save();
    res.json({ success: true, message: 'Document uploaded successfully', student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, partnerOrAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.user.role === 'partner' && student.partnerId && req.user.partnerId && student.partnerId.toString() !== req.user.partnerId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student record deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1. Create Razorpay Order for Online Admission Fee
router.post('/public/create-admission-order', async (req, res) => {
  try {
    const { courseId, fullName, email, phone, feeAmount } = req.body;

    let payableAmount = 500; // Standard nominal admission registration fee default
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        payableAmount = course.registrationFee > 0 ? course.registrationFee : 500;
      }
    }
    if (feeAmount && Number(feeAmount) > 0) {
      payableAmount = Number(feeAmount);
    }

    let razorpayOrder = null;
    if (payableAmount > 0 && razorpayClient) {
      const timestamp = Date.now().toString().slice(-6);
      razorpayOrder = await razorpayClient.orders.create({
        amount: Math.round(payableAmount * 100), // In paise
        currency: 'INR',
        receipt: `ADM-${timestamp}`,
        notes: {
          purpose: 'Online Student Admission Registration',
          candidateName: fullName || 'Candidate',
          candidatePhone: phone || '',
          candidateEmail: email || '',
        },
      });
    }

    res.json({
      success: true,
      payableAmount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder?.id || null,
      razorpayKeyId,
    });
  } catch (error) {
    console.error('Admission order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Public Universal Online Student Admission Route (With Razorpay Payment Support)
router.post('/public/apply', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'twelfthMarksheet', maxCount: 1 },
  { name: 'gradMarksheet', maxCount: 1 },
  { name: 'courseDoc', maxCount: 1 },
  { name: 'otherDoc', maxCount: 1 },
]), async (req, res) => {
  try {
    const partnerId = req.body.partnerId;
    const courseId = req.body.courseId;
    const fullName = req.body.fullName || req.body.name;
    const phone = req.body.phone;
    const fatherName = req.body.fatherName;
    const motherName = req.body.motherName;
    const dateOfBirth = req.body.dateOfBirth || req.body.dob;
    const gender = req.body.gender;
    const whatsappPhone = req.body.whatsappPhone;
    const email = req.body.email;
    const category = req.body.category;
    const bloodGroup = req.body.bloodGroup;
    const address = req.body.address;
    const city = req.body.city;
    const tehsil = req.body.tehsil;
    const district = req.body.district;
    const state = req.body.state;
    const pincode = req.body.pincode;
    const idProofType = req.body.idProofType || 'aadhaar';
    const idProofNumber = req.body.idProofNumber || req.body.aadharNumber;
    const qualification = req.body.qualification;
    const boardUniversity = req.body.boardUniversity;
    const passingYear = req.body.passingYear;
    const percentage = req.body.percentage;
    const fatherOccupation = req.body.fatherOccupation;
    const fatherPhone = req.body.fatherPhone;
    const familyIncome = req.body.familyIncome;
    const referenceSource = req.body.referenceSource;
    const tenthDetails = req.body.tenthDetails;
    const twelfthDetails = req.body.twelfthDetails;
    const graduationDetails = req.body.graduationDetails;
    const declarationsAgreed = req.body.declarationsAgreed;
    const courseDocName = req.body.courseDocName;
    const otherDocName = req.body.otherDocName;

    // Payment parameters
    const paymentMode = req.body.paymentMode || 'pay_at_center';
    const paidAmount = Number(req.body.paidAmount) || 0;
    const razorpayOrderId = req.body.razorpayOrderId;
    const razorpayPaymentId = req.body.razorpayPaymentId;
    const razorpaySignature = req.body.razorpaySignature;

    if (!partnerId || !courseId || !fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide Center, Course, Name, and Phone number' });
    }

    // Verify Razorpay signature if online payment made
    let verifiedPaymentStatus = 'pending';
    if (paymentMode === 'online_razorpay' && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature === razorpaySignature) {
        verifiedPaymentStatus = 'paid';
      }
    }

    const applicationNo = 'REG-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const studentIdNo = await generateStudentIdNo();

    // Helper to safely parse JSON strings sent via FormData
    const parseObj = (val) => {
      if (!val) return undefined;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return undefined; }
    };

    const studentData = {
      studentIdNo,
      partnerId,
      courseId: [courseId],
      fullName,
      fatherName,
      motherName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      whatsappPhone,
      email,
      category: category || 'General',
      bloodGroup,
      address,
      city,
      tehsil,
      district,
      state,
      pincode,
      idProofType,
      idProofNumber,
      qualification,
      boardUniversity,
      passingYear,
      percentage: percentage ? +percentage : undefined,
      fatherOccupation,
      fatherPhone,
      familyIncome,
      referenceSource,
      tenthDetails: parseObj(tenthDetails),
      twelfthDetails: parseObj(twelfthDetails),
      graduationDetails: parseObj(graduationDetails),
      declarationsAgreed: declarationsAgreed === 'true' || declarationsAgreed === true,
      applicationNo,
      approvalStatus: verifiedPaymentStatus === 'paid' ? 'approved' : 'pending',
      status: 'active',
      uploadedDocuments: [],
      paymentInfo: {
        paymentMode,
        paidAmount: verifiedPaymentStatus === 'paid' ? paidAmount : 0,
        paymentStatus: verifiedPaymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paidAt: verifiedPaymentStatus === 'paid' ? new Date() : undefined,
      },
    };

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        studentData.photo = `/uploads/${req.files.photo[0].filename}`;
        studentData.uploadedDocuments.push({ docName: 'Passport Photo', fileUrl: `/uploads/${req.files.photo[0].filename}` });
      }
      if (req.files.signature && req.files.signature[0]) {
        studentData.signature = `/uploads/${req.files.signature[0].filename}`;
        studentData.uploadedDocuments.push({ docName: 'Student Signature', fileUrl: `/uploads/${req.files.signature[0].filename}` });
      }
      if (req.files.idProof && req.files.idProof[0]) {
        studentData.idProof = `/uploads/${req.files.idProof[0].filename}`;
        studentData.uploadedDocuments.push({ docName: 'ID Proof / Aadhaar Card', fileUrl: `/uploads/${req.files.idProof[0].filename}` });
      }
      if (req.files.marksheet && req.files.marksheet[0]) {
        studentData.marksheet = `/uploads/${req.files.marksheet[0].filename}`;
        studentData.uploadedDocuments.push({ docName: 'Qualification Marksheet', fileUrl: `/uploads/${req.files.marksheet[0].filename}` });
      }
      if (req.files.tenthMarksheet && req.files.tenthMarksheet[0]) {
        studentData.uploadedDocuments.push({ docName: '10th Marksheet', fileUrl: `/uploads/${req.files.tenthMarksheet[0].filename}` });
      }
      if (req.files.twelfthMarksheet && req.files.twelfthMarksheet[0]) {
        studentData.uploadedDocuments.push({ docName: '12th Marksheet', fileUrl: `/uploads/${req.files.twelfthMarksheet[0].filename}` });
      }
      if (req.files.gradMarksheet && req.files.gradMarksheet[0]) {
        studentData.uploadedDocuments.push({ docName: 'Graduation Marksheet', fileUrl: `/uploads/${req.files.gradMarksheet[0].filename}` });
      }
      if (req.files.courseDoc && req.files.courseDoc[0]) {
        studentData.uploadedDocuments.push({ docName: courseDocName || 'Course Specific Document', fileUrl: `/uploads/${req.files.courseDoc[0].filename}` });
      }
      if (req.files.otherDoc && req.files.otherDoc[0]) {
        studentData.uploadedDocuments.push({ docName: otherDocName || 'Additional Certificate', fileUrl: `/uploads/${req.files.otherDoc[0].filename}` });
      }
    }

    const student = await Student.create(studentData);

    // Create student User account for portal login
    const studentEmail = (email || `${phone}@student.local`).toLowerCase();
    const existingUser = await User.findOne({ email: studentEmail });
    if (!existingUser) {
      await User.create({
        name: fullName,
        email: studentEmail,
        password: phone || 'student123',
        phone,
        role: 'student',
        partnerId,
        isActive: true,
      });
    }

    res.status(201).json({
      success: true,
      message: verifiedPaymentStatus === 'paid'
        ? 'Admission Application & Online Payment Verified Successfully!'
        : 'Admission Application Submitted Successfully!',
      applicationNo: student.applicationNo,
      studentId: student._id,
      paymentStatus: verifiedPaymentStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch Public Application Receipt by Application Number or Student ID
router.get('/public/receipt/:param', async (req, res) => {
  try {
    const p = req.params.param;
    const mongoose = require('mongoose');
    let filter = {};
    if (mongoose.Types.ObjectId.isValid(p)) {
      filter = { $or: [{ _id: p }, { applicationNo: p }, { studentIdNo: p }] };
    } else {
      filter = { $or: [{ applicationNo: p }, { studentIdNo: p }] };
    }

    let student = await Student.findOne(filter)
      .populate('partnerId', 'instituteName centerName address city state code logo phone email')
      .populate('courseId', 'name code duration fee registrationFee category');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Application Receipt Not Found' });
    }

    // Auto-generate applicationNo if missing
    if (!student.applicationNo) {
      student.applicationNo = 'REG-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      await student.save();
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
