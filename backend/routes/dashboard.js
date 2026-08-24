const express = require('express');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Fee = require('../models/Fee');
const Staff = require('../models/Staff');
const Partner = require('../models/Partner');
const Project = require('../models/Project');
const Royalty = require('../models/Royalty');
const Inquiry = require('../models/Inquiry');
const Certificate = require('../models/Certificate');
const Order = require('../models/Order');
const { protect, superAdminOnly, partnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/super-admin', protect, superAdminOnly, async (req, res) => {
  try {
    const totalPartners = await Partner.countDocuments({ status: 'active' });
    const pendingPartners = await Partner.countDocuments({ status: 'pending' });
    const totalStudents = await Student.countDocuments({ status: 'active' });
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalProjects = await Project.countDocuments({ status: 'active' });
    const totalInquiries = await Inquiry.countDocuments({ status: 'new' });
    const pendingCerts = await Certificate.countDocuments({ status: 'requested' });
    const pendingCourses = await Course.countDocuments({ approvalStatus: 'pending' });
    const AuditLog = require('../models/AuditLog');
    const recentLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(5);

    const pendingRoyalty = await Royalty.aggregate([
      { $match: { status: { $in: ['pending', 'partial', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } },
    ]);
    
    // 1. Student Course Fees Revenue (Offline / Center Enrollment)
    const studentFeeTotal = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);
    const studentRevenue = studentFeeTotal[0]?.total || 0;

    // 2. Direct Online Course Sales & Store Orders Revenue
    const courseOrdersTotal = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);
    const courseSalesRevenue = courseOrdersTotal[0]?.total || 0;

    // Combined Course Revenue (Tuition Fees + Online Course Sales)
    const courseRevenue = studentRevenue + courseSalesRevenue;

    // 3. Partner Franchise Registration & Affiliation Fees Revenue
    const partnerList = await Partner.find({
      $or: [
        { 'paymentInfo.paymentStatus': 'paid' },
        { 'paymentInfo.paidAmount': { $gt: 0 } },
        { franchiseFee: { $gt: 0 } }
      ]
    });
    const franchiseRevenue = partnerList.reduce((acc, p) => {
      const amt = p.paymentInfo?.paidAmount !== undefined ? p.paymentInfo.paidAmount : (p.franchiseFee || 0);
      return acc + (Number(amt) || 0);
    }, 0);

    // 4. Royalty Paid Collections
    const royaltyPaid = await Royalty.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    const royaltyRevenue = royaltyPaid[0]?.total || 0;

    const totalRevenue = courseRevenue + franchiseRevenue + royaltyRevenue;

    const recentPartners = await Partner.find().sort({ createdAt: -1 }).limit(5).select('instituteName city state status paymentInfo franchiseFee createdAt');
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5).populate('partnerId', 'instituteName').select('fullName phone createdAt');
    const partnersByCity = await Partner.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 5. Unified Monthly Revenue Chart
    const currentYear = new Date().getFullYear();
    const monthlyMap = {};
    for (let m = 1; m <= 12; m++) monthlyMap[m] = 0;

    // Monthly student fees
    const monthlyFees = await Fee.aggregate([
      { $match: { createdAt: { $gte: new Date(currentYear, 0, 1) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$paidAmount' } } },
    ]);
    monthlyFees.forEach(item => {
      if (item._id?.month && monthlyMap[item._id.month] !== undefined) {
        monthlyMap[item._id.month] += item.revenue || 0;
      }
    });

    // Monthly online course orders
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(currentYear, 0, 1) }, paymentStatus: { $in: ['paid', 'completed'] } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$finalAmount' } } },
    ]);
    monthlyOrders.forEach(item => {
      if (item._id?.month && monthlyMap[item._id.month] !== undefined) {
        monthlyMap[item._id.month] += item.revenue || 0;
      }
    });

    // Monthly franchise onboarding / affiliation fees
    partnerList.forEach(p => {
      if (p.createdAt && new Date(p.createdAt).getFullYear() === currentYear) {
        const m = new Date(p.createdAt).getMonth() + 1;
        const amt = p.paymentInfo?.paidAmount !== undefined ? p.paymentInfo.paidAmount : (p.franchiseFee || 0);
        if (monthlyMap[m] !== undefined) {
          monthlyMap[m] += Number(amt) || 0;
        }
      }
    });

    const monthlyRevenue = Object.keys(monthlyMap).map(m => ({
      _id: { month: parseInt(m, 10) },
      revenue: monthlyMap[m]
    }));

    res.json({
      success: true,
      stats: {
        totalPartners,
        pendingPartners,
        totalStudents,
        totalCourses,
        pendingCourses,
        totalProjects,
        totalInquiries,
        pendingCerts,
        pendingRoyalty: pendingRoyalty[0]?.total || 0,
        totalRevenue,
        courseRevenue,
        courseSalesRevenue,
        studentRevenue,
        franchiseRevenue,
        royaltyRevenue,
      },
      recentPartners,
      recentStudents,
      partnersByCity,
      monthlyRevenue,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/partner', protect, partnerOrAdmin, async (req, res) => {
  try {
    const partnerId = req.user.partnerId;
    const totalStudents = await Student.countDocuments({ partnerId, status: 'active' });
    const activeBatches = await Batch.countDocuments({ partnerId, status: 'active' });
    const totalStaff = await Staff.countDocuments({ partnerId, status: 'active' });
    const totalCourses = await Course.countDocuments({ $or: [{ partnerId }, { isStandard: true }], isActive: true });
    const pendingFees = await Fee.aggregate([
      { $match: { partnerId, status: { $in: ['pending', 'partial'] } } },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $group: { _id: null, total: { $sum: '$pendingAmount' } } },
    ]);
    const monthlyCollection = await Fee.aggregate([
      { $match: { partnerId, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);
    const newInquiries = await Inquiry.countDocuments({ partnerId, status: 'new' });
    const pendingCerts = await Certificate.countDocuments({ partnerId, status: 'requested' });
    const activeProjects = await Project.countDocuments({ 'assignments.partnerId': partnerId, 'assignments.status': { $in: ['accepted', 'in_progress'] } });
    const recentStudents = await Student.find({ partnerId }).sort({ createdAt: -1 }).limit(5).select('fullName phone status createdAt');
    const recentInquiries = await Inquiry.find({ partnerId }).sort({ createdAt: -1 }).limit(5).select('name phone courseInterest status');
    const monthlyRevenue = await Fee.aggregate([
      { $match: { partnerId, createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, revenue: { $sum: '$paidAmount' } } },
      { $sort: { '_id.month': 1 } },
    ]);
    const courseEnrollment = await Student.aggregate([
      { $match: { partnerId } },
      { $unwind: '$courseId' },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { name: '$course.name', count: 1 } },
    ]);
    res.json({
      success: true,
      stats: {
        totalStudents,
        activeBatches,
        totalStaff,
        totalCourses,
        pendingFees: pendingFees[0]?.total || 0,
        monthlyCollection: monthlyCollection[0]?.total || 0,
        newInquiries,
        pendingCerts,
        activeProjects,
      },
      recentStudents,
      recentInquiries,
      monthlyRevenue,
      courseEnrollment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
