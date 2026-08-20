const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Student = require('../models/Student');
const StudentProgress = require('../models/StudentProgress');
const Partner = require('../models/Partner');
const path = require('path');
const fs = require('fs');
const OrgHomepage = require('../models/OrgHomepage');
const sendEmail = require('../utils/sendEmail');
const { protect, authorize } = require('../middleware/auth');
const { escapeRegex } = require('../utils/sanitize');

const router = express.Router();

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
    console.error('Razorpay initialization error:', err);
  }
}

// Helper to generate JWT token for auto-login
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_super_secret_key_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateStudentIdNo = async () => {
  const org = await OrgHomepage.findOne();
  const cfg = org?.codeSeriesConfig || {};
  const prefix = cfg.studentPrefix !== undefined ? cfg.studentPrefix : 'STU-';
  const includeYear = cfg.studentIncludeYear !== false;
  const startNo = cfg.studentStartNo || 1;
  const padLen = cfg.studentPadLength || 4;

  const count = await Student.countDocuments();
  const yearStr = includeYear ? `${new Date().getFullYear()}-` : '';
  let num = startNo + count;
  let id = `${prefix}${yearStr}${String(num).padStart(padLen, '0')}`;
  while (await Student.findOne({ studentIdNo: id })) {
    num++;
    id = `${prefix}${yearStr}${String(num).padStart(padLen, '0')}`;
  }
  return id;
};

// 1. Create Order (Public/Student)
router.post('/create', async (req, res) => {
  try {
    const {
      courseId,
      customerName,
      customerEmail,
      customerPhone,
      customerCity,
      customerState,
      learningMode,
      preferredFranchiseCenter,
      couponCode,
      paymentGateway,
    } = req.body;

    if (!courseId || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Course, Name, Email, and Phone number are required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Determine price
    const basePrice = course.salePrice > 0 ? course.salePrice : (course.fee || 1999);
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        const isNotExpired = !coupon.validUntil || new Date() <= new Date(coupon.validUntil);
        const withinLimit = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const minMet = !coupon.minOrderAmount || basePrice >= coupon.minOrderAmount;
        const courseAllowed = !coupon.applicableCourses || coupon.applicableCourses.length === 0 || coupon.applicableCourses.includes(course._id);

        if (isNotExpired && withinLimit && minMet && courseAllowed) {
          appliedCoupon = coupon.code;
          if (coupon.discountType === 'percentage') {
            discountAmount = (basePrice * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          discountAmount = Math.min(discountAmount, basePrice);
        }
      }
    }

    const finalAmount = Math.max(0, Math.round(basePrice - discountAmount));

    // Create Order in DB
    const order = await Order.create({
      courseId: course._id,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      customerCity: customerCity || '',
      customerState: customerState || '',
      learningMode: learningMode || 'online',
      preferredFranchiseCenter: preferredFranchiseCenter || undefined,
      originalPrice: basePrice,
      discountAmount: Math.round(discountAmount),
      taxAmount: 0,
      finalAmount,
      couponCode: appliedCoupon,
      paymentGateway: paymentGateway || 'razorpay',
      paymentStatus: 'pending',
    });

    // Create Razorpay Order if payable amount > 0
    let razorpayOrder = null;
    if (finalAmount > 0 && razorpayClient) {
      try {
        razorpayOrder = await razorpayClient.orders.create({
          amount: Math.round(finalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: order.orderNumber,
          notes: {
            courseName: course.name,
            customerEmail: customerEmail.trim().toLowerCase(),
            orderId: order._id.toString(),
          },
        });
        order.paymentDetails = { razorpayOrderId: razorpayOrder.id };
        await order.save();
      } catch (rzpErr) {
        console.error('Razorpay Order creation error:', rzpErr);
      }
    }

    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        courseName: course.name,
        finalAmount: order.finalAmount,
        originalPrice: order.originalPrice,
        discountAmount: order.discountAmount,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        paymentGateway: order.paymentGateway,
        razorpayOrderId: razorpayOrder?.id || null,
        razorpayKeyId,
        currency: 'INR',
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Verify / Complete Order (Instant Activation + Auto Account Creation)
router.post('/verify', async (req, res) => {
  try {
    const {
      orderId,
      transactionId,
      paymentDetails,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const order = await Order.findById(orderId).populate('courseId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify Payment Signature for Paid Orders (Prevent payment bypass attacks)
    if (order.finalAmount > 0) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Valid Razorpay transaction signature is required.',
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay signature verification failed. Unauthorized transaction.',
        });
      }

      order.transactionId = razorpay_payment_id;
      order.paymentGateway = 'razorpay';
      order.paymentDetails = {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        verifiedAt: new Date(),
      };
    } else {
      // 100% Free course enrollment (final amount = 0)
      order.transactionId = transactionId || `FREE-${Date.now()}`;
      order.paymentGateway = 'free';
      if (paymentDetails) order.paymentDetails = paymentDetails;
    }

    if (order.paymentStatus === 'completed') {
      return res.json({
        success: true,
        message: 'Order already completed',
        order,
      });
    }

    const course = order.courseId;
    const email = order.customerEmail.toLowerCase().trim();
    const phone = order.customerPhone.trim();
    const name = order.customerName.trim();

    // 1. Check if user selected an offline franchise center
    let partnerId = order.preferredFranchiseCenter || undefined;

    // 2. Find or create User account (role: student)
    let user = await User.findOne({ email });
    let isNewUser = false;
    let tempPassword = null;

    if (!user) {
      isNewUser = true;
      // Default password is phone number or first name + 123
      tempPassword = phone.length >= 6 ? phone : `${name.split(' ')[0]}@123`;
      user = await User.create({
        name,
        email,
        phone,
        password: tempPassword,
        role: 'student',
        partnerId: partnerId || undefined,
        assignedRoleName: 'Student',
      });
    }

    // 3. Find or create Student profile (strictly by user ID or email)
    let student = await Student.findOne({
      $or: [
        { userId: user._id },
        { email: email },
      ],
    });

    if (!student) {
      const randomAppNo = `ADM-${Date.now().toString().slice(-6)}`;
      const randomRoll = `STD-${Math.floor(10000 + Math.random() * 90000)}`;
      student = await Student.create({
        partnerId: partnerId || undefined,
        userId: user._id,
        fullName: name,
        email,
        phone,
        city: order.customerCity,
        state: order.customerState,
        applicationNo: randomAppNo,
        studentIdNo: randomRoll,
        courseId: [course._id],
        status: 'active',
        enrollmentDate: new Date(),
      });
    } else {
      if (!student.userId) {
        student.userId = user._id;
      }
      if (partnerId && !student.partnerId) {
        student.partnerId = partnerId;
      }
      if (!student.courseId.some(cId => cId.toString() === course._id.toString())) {
        student.courseId.push(course._id);
      }
      await student.save();
    }

    // 4. Initialize StudentProgress for LMS
    let progress = await StudentProgress.findOne({
      $or: [
        { studentId: student ? student._id : undefined, courseId: course._id },
        { userId: user._id, courseId: course._id },
      ],
    });

    if (!progress && student) {
      progress = await StudentProgress.create({
        studentId: student._id,
        userId: user._id,
        courseId: course._id,
        watchedChapters: [],
        isCompleted: false,
      });
    }

    // 5. Update Course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrolledCount: 1 },
    });

    // 6. Update Coupon used count if applied
    if (order.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    // 7. Mark Order Completed
    order.paymentStatus = 'completed';
    order.transactionId = transactionId || `TXN-${Date.now()}`;
    order.paymentDetails = paymentDetails || { method: order.paymentGateway, verifiedAt: new Date() };
    order.paidAt = new Date();
    order.userId = user._id;
    if (student) order.studentId = student._id;
    await order.save();

    // 8. Send Automated Email with LMS Credentials & Course Link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
      const orgHp = await OrgHomepage.findOne().lean();
      const orgName = orgHp?.settings?.orgName || 'Lili Organization';
      const themeColor = orgHp?.settings?.themeColor || '#002e7a';
      const logoPath = orgHp?.settings?.logo;
      
      const attachments = [];
      let logoCid = '';
      if (logoPath) {
        const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
        const absLogoPath = path.join(__dirname, '..', cleanPath);
        if (fs.existsSync(absLogoPath)) {
          attachments.push({
            filename: 'logo.jpeg',
            path: absLogoPath,
            cid: 'orglogo@crm',
          });
          logoCid = 'cid:orglogo@crm';
        }
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Enrollment Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
            <tr>
              <td align="center">
                
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                  
                  <!-- Top Brand Header with Logo & Org Name -->
                  <tr>
                    <td style="background: linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%); padding: 36px 24px; text-align: center;">
                      
                      ${logoCid ? `
                        <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 14px auto;">
                          <tr>
                            <td style="background-color: #ffffff; padding: 6px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                              <img src="${logoCid}" alt="${orgName}" width="64" height="64" style="display: block; border-radius: 12px; object-fit: contain;" />
                            </td>
                          </tr>
                        </table>
                      ` : ''}

                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                        ${orgName}
                      </h2>
                      <div style="display: inline-block; margin-top: 8px; padding: 4px 14px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 50px; color: #e0e7ff; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                        🎓 Official Course Enrollment & LMS Credentials
                      </div>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 32px 28px;">
                      
                      <p style="margin: 0 0 16px; font-size: 16px; color: #1e293b;">
                        Dear <strong>${name}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                        Congratulations! Your enrollment in <strong style="color: #0f172a;">${course.name}</strong> has been successfully confirmed. Your Student LMS account has been initialized and is ready for learning.
                      </p>

                      <!-- Course Highlight Badge -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px; padding: 16px;">
                        <tr>
                          <td>
                            <div style="font-size: 11px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Enrolled Program</div>
                            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${course.name}</div>
                            <div style="font-size: 12px; color: #64748b;">Includes Full Video Lectures, Practice Resources & QR-Verified Certificate</div>
                          </td>
                        </tr>
                      </table>

                      <!-- Student LMS Credentials Box -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid ${themeColor}; border-radius: 12px; margin-bottom: 26px; border: 1px solid #e2e8f0; border-left-width: 4px;">
                        <tr>
                          <td style="padding: 20px;">
                            <div style="font-size: 12px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
                              🔑 Your Student LMS Login Credentials
                            </div>
                            
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #334155;">
                              <tr>
                                <td width="130" style="padding: 5px 0; color: #64748b; font-weight: 600;">Login Portal:</td>
                                <td style="padding: 5px 0;">
                                  <a href="${clientUrl}/student/login" style="color: #4f46e5; font-weight: 700; text-decoration: none;">
                                    ${clientUrl}/student/login
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Registered Email:</td>
                                <td style="padding: 5px 0;">
                                  <span style="font-family: monospace; font-size: 13px; font-weight: 800; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 6px;">
                                    ${email}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 5px 0; color: #64748b; font-weight: 600;">Password:</td>
                                <td style="padding: 5px 0;">
                                  <span style="font-family: monospace; font-size: 13px; font-weight: 800; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 6px;">
                                    ${tempPassword || 'Your existing account password'}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Direct Course Action Button -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${clientUrl}/student/courses/${course._id}" style="display: inline-block; background-color: ${themeColor}; color: #ffffff; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 46, 122, 0.35);">
                              🚀 Start Watching Course Videos
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Transaction Details Table -->
                      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px;">
                          Order & Invoice Summary
                        </div>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px; color: #475569;">
                          <tr>
                            <td style="padding: 3px 0;">Order Number:</td>
                            <td align="right" style="padding: 3px 0; font-weight: 700; color: #0f172a;">${order.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 3px 0;">Invoice Number:</td>
                            <td align="right" style="padding: 3px 0; font-weight: 700; color: #0f172a;">${order.invoiceNumber || 'INV-ONLINE'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 3px 0;">Amount Paid:</td>
                            <td align="right" style="padding: 3px 0; font-weight: 800; color: #15803d; font-size: 14px;">₹${order.finalAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 3px 0;">Learning Mode:</td>
                            <td align="right" style="padding: 3px 0; font-weight: 600; color: #475569;">100% Online Self-Paced LMS</td>
                          </tr>
                        </table>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
                      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #475569;">
                        ${orgName} · Digital Learning & Certification Mission
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                        This is an automated system email. For queries, contact our student counseling desk.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
      `;

      await sendEmail({
        email,
        subject: `🎉 Course Enrollment Confirmed: ${course.name} - ${orgName}`,
        message: `Welcome to ${course.name} by ${orgName}! Your LMS account email is ${email} and password is ${tempPassword || 'your existing password'}. Login at ${clientUrl}/student/login`,
        html: emailHtml,
        attachments,
      });
      console.log(`[Order Email Sent] Credentials sent to student: ${email} for ${orgName} with ${attachments.length} attachments`);
    } catch (emailErr) {
      console.error('[Order Email Error]', emailErr.message);
    }

    // 9. Generate JWT Token so the user is auto logged in
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Payment verified and enrollment successful!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        finalAmount: order.finalAmount,
        originalPrice: order.originalPrice,
        discountAmount: order.discountAmount,
        paidAt: order.paidAt,
        courseName: course.name,
        courseId: course._id,
        transactionId: order.transactionId,
      },
      auth: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          partnerId: user.partnerId,
        },
        isNewUser,
        temporaryPassword: isNewUser ? tempPassword : null,
      },
    });
  } catch (error) {
    console.error('Order verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get Public/Student Invoice details
router.get('/invoice/:orderNumberOrId', async (req, res) => {
  try {
    const { orderNumberOrId } = req.params;
    const query = orderNumberOrId.startsWith('ORD-') || orderNumberOrId.startsWith('INV-')
      ? { $or: [{ orderNumber: orderNumberOrId }, { invoiceNumber: orderNumberOrId }] }
      : { _id: orderNumberOrId };

    const order = await Order.findOne(query)
      .populate('courseId', 'name code duration durationMonths level category fee image')
      .populate('preferredFranchiseCenter', 'instituteName centerCode city state phone email address');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice / Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Student: Get My Purchased Orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { userId: req.user._id },
        { customerEmail: req.user.email.toLowerCase() },
      ],
      paymentStatus: 'completed',
    })
      .populate('courseId', 'name code duration image salePrice level')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Admin: Get all orders and sales stats
router.get('/admin/all', protect, authorize('super_admin', 'admin', 'staff'), async (req, res) => {
  try {
    const { search, status, paymentGateway, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (paymentGateway) filter.paymentGateway = paymentGateway;
    if (search && typeof search === 'string') {
      const sanitizedSearch = escapeRegex(search.trim());
      filter.$or = [
        { orderNumber: { $regex: sanitizedSearch, $options: 'i' } },
        { invoiceNumber: { $regex: sanitizedSearch, $options: 'i' } },
        { customerName: { $regex: sanitizedSearch, $options: 'i' } },
        { customerEmail: { $regex: sanitizedSearch, $options: 'i' } },
        { customerPhone: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('courseId', 'name code salePrice')
      .populate('preferredFranchiseCenter', 'instituteName centerCode city')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Order.countDocuments(filter);

    // Calculate Sales Stats
    const statsAgg = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
        },
      },
    ]);

    let totalRevenue = 0;
    let completedOrders = 0;
    let pendingOrders = 0;

    statsAgg.forEach(stat => {
      if (stat._id === 'completed') {
        totalRevenue += stat.totalRevenue;
        completedOrders += stat.count;
      } else if (stat._id === 'pending') {
        pendingOrders += stat.count;
      }
    });

    res.json({
      success: true,
      orders,
      totalCount,
      stats: {
        totalRevenue,
        completedOrders,
        pendingOrders,
        totalOrders: completedOrders + pendingOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Admin: Update order status / refund & process pending order
router.put('/admin/:id/status', protect, authorize('super_admin', 'admin', 'staff'), async (req, res) => {
  try {
    const { paymentStatus, notes } = req.body;
    const order = await Order.findById(req.params.id).populate('courseId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    if (notes) order.notes = notes;

    // If marking as completed and wasn't already completed, perform full enrollment & credential dispatch
    if (paymentStatus === 'completed' && prevStatus !== 'completed') {
      order.paidAt = new Date();
      if (!order.invoiceNumber) {
        const count = await Order.countDocuments();
        order.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
      }

      const email = order.customerEmail.toLowerCase().trim();
      const phone = order.customerPhone.trim();
      const name = order.customerName.trim();
      const course = order.courseId;

      // 1. Find or create User
      let user = await User.findOne({ email });
      let isNewUser = false;
      let tempPassword = '';

      if (!user) {
        tempPassword = `Learn@${Math.floor(1000 + Math.random() * 9000)}`;
        user = await User.create({
          name,
          email,
          phone,
          password: tempPassword,
          role: 'student',
          partnerId: order.preferredFranchiseCenter || order.partnerId || undefined,
        });
        isNewUser = true;
      }

      // 2. Find or create Student profile
      let student = await Student.findOne({
        $or: [
          { userId: user._id },
          { email: email },
        ],
      });
      if (!student) {
        const rollNo = await generateStudentIdNo();
        student = await Student.create({
          fullName: name,
          email,
          phone,
          userId: user._id,
          studentIdNo: rollNo,
          applicationNo: `ADM-${Date.now().toString().slice(-6)}`,
          courseId: course ? [course._id] : [],
          partnerId: order.preferredFranchiseCenter || order.partnerId || undefined,
          city: order.customerCity || '',
          state: order.customerState || '',
          address: [order.customerCity, order.customerState].filter(Boolean).join(', ') || 'Online',
          status: 'active',
          enrollmentDate: new Date(),
        });
      } else if (course) {
        if (!student.userId) student.userId = user._id;
        if (!student.courseId) student.courseId = [];
        if (!student.courseId.some(cId => cId.toString() === course._id.toString())) {
          student.courseId.push(course._id);
        }
        await student.save();
      }

      // 3. Create StudentProgress if not exists
      if (course) {
        let progress = await StudentProgress.findOne({
          $or: [
            { studentId: student ? student._id : undefined, courseId: course._id },
            { userId: user._id, courseId: course._id },
          ],
        });
        if (!progress && student) {
          await StudentProgress.create({
            studentId: student._id,
            userId: user._id,
            courseId: course._id,
            watchedChapters: [],
            isCompleted: false,
          });
        }

        // Increment Course enrollment count
        await Course.findByIdAndUpdate(course._id, {
          $inc: { enrolledCount: 1 },
        });
      }

      order.userId = user._id;
      order.studentId = student ? student._id : undefined;

      // 4. Send Confirmation Email with LMS login credentials
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      try {
        const orgHp = await OrgHomepage.findOne().lean();
        const orgName = orgHp?.settings?.orgName || 'Skill India Mission';
        const themeColor = orgHp?.settings?.themeColor || '#002e7a';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:24px;background:#f1f5f9;font-family:sans-serif;">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:${themeColor};padding:28px;text-align:center;color:#fff;">
                <h2 style="margin:0;font-size:20px;font-weight:800;text-transform:uppercase;">${orgName}</h2>
                <p style="margin:6px 0 0;font-size:12px;opacity:0.9;">Order Approved & Course Access Activated</p>
              </div>
              <div style="padding:24px;color:#334155;font-size:14px;line-height:1.6;">
                <p>Dear <strong>${name}</strong>,</p>
                <p>Your order <strong>${order.orderNumber}</strong> for <strong>${course?.name || 'Enrolled Course'}</strong> has been approved and processed successfully!</p>
                
                <div style="background:#f8fafc;border-left:4px solid ${themeColor};padding:16px;border-radius:8px;margin:20px 0;">
                  <p style="margin:0 0 8px;font-weight:bold;color:#0f172a;">🔑 LMS Login Credentials</p>
                  <p style="margin:4px 0;">Portal: <a href="${clientUrl}/student/login" style="color:${themeColor};font-weight:bold;">${clientUrl}/student/login</a></p>
                  <p style="margin:4px 0;">Email: <strong>${email}</strong></p>
                  <p style="margin:4px 0;">Password: <strong>${tempPassword || 'Your existing account password'}</strong></p>
                </div>

                <p style="text-align:center;margin:24px 0;">
                  <a href="${clientUrl}/student/login" style="display:inline-block;background:${themeColor};color:#fff;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none;">
                    🚀 Access LMS Course
                  </a>
                </p>

                <p style="font-size:12px;color:#64748b;margin-top:20px;">
                  View & print your tax invoice: <a href="${clientUrl}/order-success/${order._id}" style="color:${themeColor};">${order.invoiceNumber}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          email,
          subject: `🎉 Course Order Approved: ${course?.name || 'Program'} - ${orgName}`,
          message: `Your course order ${order.orderNumber} has been approved! Login at ${clientUrl}/student/login`,
          html: emailHtml,
        });
      } catch (err) {
        console.error('[Admin Order Approval Email Error]', err.message);
      }
    }

    await order.save();
    res.json({ success: true, message: `Order marked as ${paymentStatus}`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
