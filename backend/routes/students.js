const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Fee = require('../models/Fee');
const Partner = require('../models/Partner');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect, partnerOrAdmin } = require('../middleware/auth');
const { escapeRegex } = require('../utils/sanitize');
const sendEmail = require('../utils/sendEmail');

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
    if (req.query.search && typeof req.query.search === 'string') {
      const sanitizedSearch = escapeRegex(req.query.search.trim());
      filter.$or = [
        { fullName: { $regex: sanitizedSearch, $options: 'i' } },
        { phone: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { studentIdNo: { $regex: sanitizedSearch, $options: 'i' } },
        { applicationNo: { $regex: sanitizedSearch, $options: 'i' } },
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
    if (req.user.role === 'partner' && (!req.user.partnerId || student.partnerId.toString() !== req.user.partnerId.toString())) {
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
    if (req.user.role === 'partner' && (!req.user.partnerId || student.partnerId.toString() !== req.user.partnerId.toString())) {
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
    if (req.user.role === 'partner' && (!req.user.partnerId || student.partnerId.toString() !== req.user.partnerId.toString())) {
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

    // Duplicate registration check: phone or email already exists
    const dupFilter = { $or: [{ phone }] };
    if (email) dupFilter.$or.push({ email: email.toLowerCase() });
    const existingStudent = await Student.findOne(dupFilter);
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `This student is already registered. Application No: ${existingStudent.applicationNo}, Student ID: ${existingStudent.studentIdNo || 'N/A'}. Duplicate registration is not allowed.`,
      });
    }

    // If cash payment (pay_at_center), require OTP to partner center email
    if (paymentMode === 'pay_at_center') {
      const { otp } = req.body;
      if (!otp) {
 return res.status(400).json({ success: false, message: 'OTP is required for cash payment at center' }); }
      if (!router.publicAdmissionOtps) router.publicAdmissionOtps = new Map();
      const stored = router.publicAdmissionOtps.get(partnerId);
      if (!stored || stored.expiresAt < Date.now()) {
        return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
      }
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      if (otpHash !== stored.hash) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
      router.publicAdmissionOtps.delete(partnerId);
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
      admissionType: 'public_online',
      status: 'active',
      totalFee: 0,
      pendingFee: 0,
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

    // Create Fee record if course has fee
    const courseForFee = await Course.findById(courseId);
    const courseFee = courseForFee?.fee || courseForFee?.studentFee || 0;
    if (courseFee > 0) {
      const paidAmtPublic = verifiedPaymentStatus === 'paid' ? paidAmount : 0;
      await Fee.create({
        partnerId,
        studentId: student._id,
        courseId,
        totalFee: courseFee,
        paidAmount: paidAmtPublic,
        pendingAmount: Math.max(0, courseFee - paidAmtPublic),
        status: paidAmtPublic >= courseFee ? 'paid' : paidAmtPublic > 0 ? 'partial' : 'pending',
        payments: paidAmtPublic > 0 ? [{
          amount: paidAmtPublic,
          mode: 'online',
          receiptNo: `RCP-${Date.now()}`,
          remarks: 'Online admission payment',
        }] : [],
      });
      student.totalFee = courseFee;
      student.pendingFee = Math.max(0, courseFee - paidAmtPublic);
      await student.save();
    }

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

    // Send admission confirmation email to student
    if (email) {
      try {
        const org = await OrgHomepage.findOne();
        const orgName = org?.settings?.orgName || 'Lili Organization';
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const partnerRec = await Partner.findById(partnerId).lean();
        const courseRec = await Course.findById(courseId).lean();

        await sendEmail({
          email: email.toLowerCase(),
          subject: `Admission Confirmed: ${student.fullName} - ${orgName}`,
          message: `Dear ${student.fullName}, your admission has been confirmed. Application No: ${student.applicationNo}, Student ID: ${student.studentIdNo}. Course: ${courseRec?.name || 'N/A'} at ${partnerRec?.instituteName || 'Institute'}. Login at ${clientUrl}/student/login`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:#4f46e5;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="margin:0;font-size:22px">Admission Confirmed!</h1>
              <p style="margin:4px 0 0;opacity:0.9">${orgName}</p>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px">
              <p>Dear <strong>${student.fullName}</strong>,</p>
              <p>Congratulations! Your admission has been successfully confirmed.</p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
                <table style="width:100%;font-size:14px;color:#334155">
                  <tr><td style="color:#64748b;padding:4px 0">Application No:</td><td style="font-weight:bold">${student.applicationNo}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Student ID:</td><td style="font-weight:bold">${student.studentIdNo || 'Auto-Assigned'}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Course:</td><td style="font-weight:bold">${courseRec?.name || 'N/A'}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Institute:</td><td style="font-weight:bold">${partnerRec?.instituteName || 'N/A'}</td></tr>
                  ${student.totalFee > 0 ? `<tr><td style="color:#64748b;padding:4px 0">Total Fee:</td><td style="font-weight:bold">₹${student.totalFee}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Paid:</td><td style="font-weight:bold;color:#15803d">₹${student.paymentInfo?.paidAmount || 0}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Pending:</td><td style="font-weight:bold;color:#b45309">₹${student.pendingFee}</td></tr>` : ''}
                </table>
              </div>
              <p>You can login to your student portal at <a href="${clientUrl}/student/login" style="color:#4f46e5;font-weight:bold">${clientUrl}/student/login</a></p>
              <p style="font-size:12px;color:#94a3b8;margin-top:20px">This is an automated email. Please do not reply.</p>
            </div>
          </div>`,
        });
        console.log(`[Admission Confirmation Email] Sent to: ${email}`);
      } catch (mailErr) {
        console.error('[Admission Email Error]', mailErr.message);
      }
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

// Send OTP to partner center email for public cash admission
router.post('/public/send-center-otp', async (req, res) => {
  try {
    const { partnerId } = req.body;
    if (!partnerId) return res.status(400).json({ success: false, message: 'Partner center is required' });

    const partner = await Partner.findById(partnerId);
    if (!partner || !partner.email) {
      return res.status(400).json({ success: false, message: 'Partner center email not found' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (!router.publicAdmissionOtps) router.publicAdmissionOtps = new Map();
    router.publicAdmissionOtps.set(partnerId, {
      hash: otpHash,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail({
      email: partner.email,
      subject: 'Admission OTP - Cash Payment Verification',
      message: `OTP for student admission cash payment verification: ${otp}. Valid for 5 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2 style="color:#4f46e5">Cash Payment Verification</h2>
        <p>A student is taking admission at your center with cash payment. Use this OTP to confirm:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5;text-align:center;padding:20px;background:#f0f0ff;border-radius:12px;margin:15px 0">${otp}</div>
        <p style="color:#666;font-size:12px">Valid for 5 minutes. Do not share with anyone.</p>
      </div>`,
    });

    res.json({ success: true, message: `OTP sent to ${partner.email}` });
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

// ============ PARTNER CENTER ADMISSION WITH OTP ============

// Send OTP to partner email for admission verification
router.post('/partner-center/send-otp', protect, async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can use this endpoint' });
    }
    const partner = await Partner.findById(req.user.partnerId);
    if (!partner || !partner.email) {
      return res.status(400).json({ success: false, message: 'Partner email not found' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store OTP hash + expiry in a simple in-memory map (5 min expiry)
    if (!router.admissionOtps) router.admissionOtps = new Map();
    router.admissionOtps.set(req.user.partnerId.toString(), {
      hash: otpHash,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail({
      email: partner.email,
      subject: 'Admission Verification OTP',
      message: `Your OTP for student admission verification is: ${otp}. Valid for 5 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2 style="color:#4f46e5">Admission Verification</h2>
        <p>Use this OTP to confirm student admission at your center:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4f46e5;text-align:center;padding:20px;background:#f0f0ff;border-radius:12px;margin:15px 0">${otp}</div>
        <p style="color:#666;font-size:12px">Valid for 5 minutes. Do not share with anyone.</p>
      </div>`,
    });

    res.json({ success: true, message: `OTP sent to ${partner.email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Partner Center Admission Submit with OTP verification + Cash payment
router.post('/partner-center/submit', protect, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'twelfthMarksheet', maxCount: 1 },
  { name: 'gradMarksheet', maxCount: 1 },
]), async (req, res) => {
  try {
    if (req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Only partners can use this endpoint' });
    }

    const { otp, paidAmount, courseId } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    // Verify OTP
    if (!router.admissionOtps) router.admissionOtps = new Map();
    const stored = router.admissionOtps.get(req.user.partnerId.toString());
    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP.' });
    }
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== stored.hash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    router.admissionOtps.delete(req.user.partnerId.toString());

    const partnerId = req.user.partnerId;
    const fullName = req.body.fullName || req.body.name;
    const phone = req.body.phone;
    const studentEmail = req.body.email;
    if (!fullName || !phone || !courseId) {
      return res.status(400).json({ success: false, message: 'Name, phone, and course are required' });
    }

    // Duplicate registration check
    const dupFilter = { $or: [{ phone }] };
    if (studentEmail) dupFilter.$or.push({ email: studentEmail.toLowerCase() });
    const existingStudent = await Student.findOne(dupFilter);
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `This student is already registered. Application No: ${existingStudent.applicationNo}, Student ID: ${existingStudent.studentIdNo || 'N/A'}. Duplicate registration is not allowed.`,
      });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(400).json({ success: false, message: 'Course not found' });

    const totalFee = course.fee || course.studentFee || 0;
    const paidAmt = Number(paidAmount) || 0;
    const pendingAmt = Math.max(0, totalFee - paidAmt);

    const applicationNo = 'REG-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const studentIdNo = await generateStudentIdNo();

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
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      gender: req.body.gender,
      phone,
      whatsappPhone: req.body.whatsappPhone,
      email: req.body.email,
      category: req.body.category || 'General',
      bloodGroup: req.body.bloodGroup,
      address: req.body.address,
      city: req.body.city,
      tehsil: req.body.tehsil,
      district: req.body.district,
      state: req.body.state,
      pincode: req.body.pincode,
      idProofType: req.body.idProofType || 'aadhaar',
      idProofNumber: req.body.idProofNumber || req.body.aadharNumber,
      qualification: req.body.qualification,
      boardUniversity: req.body.boardUniversity,
      passingYear: req.body.passingYear,
      percentage: req.body.percentage ? +req.body.percentage : undefined,
      fatherOccupation: req.body.fatherOccupation,
      fatherPhone: req.body.fatherPhone,
      familyIncome: req.body.familyIncome,
      referenceSource: req.body.referenceSource || 'Direct Center Admission',
      tenthDetails: parseObj(req.body.tenthDetails),
      twelfthDetails: parseObj(req.body.twelfthDetails),
      graduationDetails: parseObj(req.body.graduationDetails),
      declarationsAgreed: req.body.declarationsAgreed === 'true' || req.body.declarationsAgreed === true,
      applicationNo,
      approvalStatus: 'approved',
      admissionType: 'partner_center',
      status: 'active',
      totalFee,
      pendingFee: pendingAmt,
      uploadedDocuments: [],
      paymentInfo: {
        paymentMode: 'pay_at_center',
        paidAmount: paidAmt,
        paymentStatus: paidAmt >= totalFee ? 'paid' : paidAmt > 0 ? 'partial' : 'pending',
        paidAt: paidAmt > 0 ? new Date() : undefined,
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
    }

    const student = await Student.create(studentData);

    // Create Fee record
    if (totalFee > 0) {
      const receiptNo = `RCP-${Date.now()}`;
      const feeRecord = await Fee.create({
        partnerId,
        studentId: student._id,
        courseId,
        totalFee,
        paidAmount: paidAmt,
        pendingAmount: pendingAmt,
        status: pendingAmt <= 0 ? 'paid' : paidAmt > 0 ? 'partial' : 'pending',
        payments: paidAmt > 0 ? [{
          amount: paidAmt,
          mode: 'cash',
          receiptNo,
          collectedBy: req.user._id,
          remarks: 'Admission time cash payment',
        }] : [],
      });
    }

    // Create student User account
    const studentEmail = (req.body.email || `${phone}@student.local`).toLowerCase();
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

    // Send admission confirmation email to student
    if (req.body.email) {
      try {
        const org = await OrgHomepage.findOne();
        const orgName = org?.settings?.orgName || 'Lili Organization';
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const partnerRec = await Partner.findById(partnerId).lean();

        await sendEmail({
          email: req.body.email.toLowerCase(),
          subject: `Admission Confirmed: ${student.fullName} - ${orgName}`,
          message: `Dear ${student.fullName}, your admission has been confirmed. Application No: ${student.applicationNo}, Student ID: ${student.studentIdNo}. Course: ${course.name} at ${partnerRec?.instituteName || 'Institute'}. Login at ${clientUrl}/student/login`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:#4f46e5;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="margin:0;font-size:22px">Admission Confirmed!</h1>
              <p style="margin:4px 0 0;opacity:0.9">${orgName}</p>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px">
              <p>Dear <strong>${student.fullName}</strong>,</p>
              <p>Congratulations! Your admission has been successfully confirmed.</p>
              <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
                <table style="width:100%;font-size:14px;color:#334155">
                  <tr><td style="color:#64748b;padding:4px 0">Application No:</td><td style="font-weight:bold">${student.applicationNo}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Student ID:</td><td style="font-weight:bold">${student.studentIdNo || 'Auto-Assigned'}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Course:</td><td style="font-weight:bold">${course.name}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Institute:</td><td style="font-weight:bold">${partnerRec?.instituteName || 'N/A'}</td></tr>
                  ${totalFee > 0 ? `<tr><td style="color:#64748b;padding:4px 0">Total Fee:</td><td style="font-weight:bold">₹${totalFee}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Paid:</td><td style="font-weight:bold;color:#15803d">₹${paidAmt}</td></tr>
                  <tr><td style="color:#64748b;padding:4px 0">Pending:</td><td style="font-weight:bold;color:#b45309">₹${pendingAmt}</td></tr>` : ''}
                </table>
              </div>
              <p>You can login to your student portal at <a href="${clientUrl}/student/login" style="color:#4f46e5;font-weight:bold">${clientUrl}/student/login</a></p>
              <p style="font-size:12px;color:#94a3b8;margin-top:20px">This is an automated email. Please do not reply.</p>
            </div>
          </div>`,
        });
        console.log(`[Admission Confirmation Email] Sent to: ${req.body.email}`);
      } catch (mailErr) {
        console.error('[Admission Email Error]', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Admission confirmed successfully!',
      applicationNo: student.applicationNo,
      studentId: student._id,
      studentIdNo: student.studentIdNo,
      totalFee,
      paidAmount: paidAmt,
      pendingFee: pendingAmt,
    });
  } catch (error) {
    console.error('Partner center admission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ BATCH SELECTION WITH SEAT AVAILABILITY ============

// Get available batches for a course with seat info
router.get('/public/batches/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { partnerId } = req.query;
    const filter = { courseId, status: { $in: ['upcoming', 'active'] } };
    if (partnerId) filter.partnerId = partnerId;

    const batches = await Batch.find(filter)
      .populate('courseId', 'name fee duration')
      .populate('teacherId', 'name')
      .sort({ startDate: 1 });

    const batchesWithSeats = batches.map(b => ({
      _id: b._id,
      name: b.name,
      startDate: b.startDate,
      endDate: b.endDate,
      timing: b.timing,
      schedule: b.schedule,
      maxStudents: b.maxStudents,
      enrolledCount: b.enrolledStudents?.length || 0,
      availableSeats: b.maxStudents - (b.enrolledStudents?.length || 0),
      status: b.status,
      teacherName: b.teacherId?.name,
    }));

    res.json({ success: true, batches: batchesWithSeats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign batch to student (public, used after admission)
router.post('/public/assign-batch', async (req, res) => {
  try {
    const { studentId, batchId } = req.body;
    if (!studentId || !batchId) return res.status(400).json({ success: false, message: 'studentId and batchId required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const availableSeats = batch.maxStudents - (batch.enrolledStudents?.length || 0);
    if (availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'No seats available in this batch' });
    }

    // Assign batch
    student.batchId = batchId;
    if (!student.batchIds.includes(batchId)) {
      student.batchIds.push(batchId);
    }
    await student.save();

    // Add student to batch
    if (!batch.enrolledStudents.includes(student._id)) {
      batch.enrolledStudents.push(student._id);
      await batch.save();
    }

    res.json({ success: true, message: 'Batch assigned successfully', student, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FEE PAYMENT (partial/topup) ============

// Public fee payment - student pays partial fee
router.post('/public/pay-fee', async (req, res) => {
  try {
    const { studentId, amount, mode, transactionId, remarks } = req.body;
    if (!studentId || !amount) return res.status(400).json({ success: false, message: 'studentId and amount required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let fee = await Fee.findOne({ studentId });
    if (!fee) {
      fee = await Fee.create({
        partnerId: student.partnerId,
        studentId: student._id,
        courseId: student.courseId?.[0],
        totalFee: student.totalFee || 0,
        paidAmount: 0,
        pendingAmount: student.totalFee || 0,
        status: 'pending',
      });
    }

    const receiptNo = `RCP-${Date.now()}`;
    fee.payments.push({ amount: Number(amount), mode: mode || 'cash', transactionId, remarks, receiptNo });
    fee.paidAmount += Number(amount);
    fee.pendingAmount = Math.max(0, fee.totalFee - fee.discount - fee.paidAmount);
    fee.status = fee.pendingAmount <= 0 ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending';
    await fee.save();

    // Update student pendingFee
    student.pendingFee = fee.pendingAmount;
    student.paymentInfo.paidAmount = fee.paidAmount;
    student.paymentInfo.paymentStatus = fee.status === 'paid' ? 'paid' : fee.status === 'partial' ? 'partial' : 'pending';
    await student.save();

    res.json({ success: true, message: 'Fee payment recorded', receiptNo, fee, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
