const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Homepage = require('../models/Homepage');
const sendEmail = require('../utils/sendEmail');
const { protect, superAdminOnly } = require('../middleware/auth');

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
    console.error('Razorpay init error in partners.js:', err);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'partner-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const OrgHomepage = require('../models/OrgHomepage');

const generateFranchiseId = async () => {
  const org = await OrgHomepage.findOne();
  const cfg = org?.codeSeriesConfig || {};
  const prefix = cfg.franchisePrefix !== undefined ? cfg.franchisePrefix : 'FR-';
  const startNo = cfg.franchiseStartNo || 1;
  const padLen = cfg.franchisePadLength || 4;

  const count = await Partner.countDocuments();
  const num = startNo + count;
  return `${prefix}${String(num).padStart(padLen, '0')}`;
};

const createDefaultHomepage = async (partnerId, themeColor) => {
  const defaultLayout = ['hero', 'about', 'courses', 'faculty', 'gallery', 'testimonials', 'facilities', 'notices', 'contact'];
  const homepage = await Homepage.create({
    partnerId,
    isPublished: true,
    hero: {
      heading: 'Welcome to Our Institute',
      subheading: 'Learn Skills, Build Career',
      ctaButtonText: 'Enroll Now',
    },
    about: {
      title: 'About Us',
      description: 'We are a leading computer training institute committed to providing quality education.',
      whyChooseUs: ['Experienced Faculty', 'Modern Lab Facilities', 'Placement Assistance', 'Affordable Fees'],
      achievements: [],
      show: true,
    },
    layoutOrder: defaultLayout,
    settings: { themeColor, fontChoice: 'inter' },
    facilities: {
      items: [
        { icon: 'monitor', title: 'Computer Lab', description: 'Well-equipped computer labs' },
        { icon: 'wifi', title: 'High Speed WiFi', description: 'Free WiFi for all students' },
        { icon: 'book', title: 'Library', description: 'Reference books and study material' },
        { icon: 'award', title: 'Certified Courses', description: 'Government recognized certificates' },
      ],
      show: true,
    },
  });
  return homepage;
};

router.get('/public', async (req, res) => {
  try {
    const partners = await Partner.find({ status: 'active' })
      .select('instituteName slug city state address pincode phone alternatePhone email logo themeColor tagline franchiseId status showInAdmissionForm upiId paymentQrImage')
      .sort({ createdAt: -1 });

    const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const partnersWithFullLogo = partners.map(p => {
      const partnerObj = p.toObject();
      if (partnerObj.logo && partnerObj.logo.startsWith('/uploads/')) {
        partnerObj.logo = `${baseUrl}${partnerObj.logo}`;
      }
      return partnerObj;
    });

    res.json({ success: true, partners: partnersWithFullLogo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if an email or phone is already registered for partner/user
router.get('/public/check-email', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.json({ available: true });
    }
    const existingUser = await User.findOne({ email });
    const existingPartner = await Partner.findOne({ email });
    if (existingUser || existingPartner) {
      return res.json({
        available: false,
        message: 'This email is already registered with an existing center. Please use a different email or log in.',
      });
    }
    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch Public Franchise / Partnership Registration Receipt by Franchise ID, Slug, or _id
router.get('/public/receipt/:param', async (req, res) => {
  try {
    const p = req.params.param;
    const mongoose = require('mongoose');
    let filter = {};
    if (mongoose.Types.ObjectId.isValid(p)) {
      filter = { $or: [{ _id: p }, { franchiseId: p }, { slug: p }] };
    } else {
      filter = { $or: [{ franchiseId: p }, { slug: p }] };
    }

    const partner = await Partner.findOne(filter);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Franchise Registration Receipt Not Found' });
    }

    const orgHomepage = await OrgHomepage.findOne().select('settings contact certifications stats hero');

    // Convert relative logo path to absolute URL for receipt rendering
    if (orgHomepage && orgHomepage.settings && orgHomepage.settings.logo) {
      const logoPath = orgHomepage.settings.logo;
      if (logoPath.startsWith('/uploads/')) {
        const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
        orgHomepage.settings.logo = `${baseUrl}${logoPath}`;
      }
    }

    res.json({
      success: true,
      partner,
      orgInfo: orgHomepage || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const partnersWithLogo = partners.map(p => {
      const obj = p.toObject();
      if (obj.logo && obj.logo.startsWith('/uploads/')) {
        obj.logo = `${baseUrl}${obj.logo}`;
      }
      return obj;
    });
    res.json({ success: true, count: partners.length, partners: partnersWithLogo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    if (req.user.role === 'partner' && req.user.partnerId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this partner' });
    }
    const partnerObj = partner.toObject();
    if (partnerObj.logo && partnerObj.logo.startsWith('/uploads/')) {
      const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      partnerObj.logo = `${baseUrl}${partnerObj.logo}`;
    }
    res.json({ success: true, partner: partnerObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const partner = await Partner.findOne({ slug: req.params.slug, status: 'active' })
      .select('-password -aadhaarNumber -panNumber -bankDetails -securityDeposit -franchiseFee -documents -references');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    const homepage = await Homepage.findOne({ partnerId: partner._id });

    const partnerObj = partner.toObject();
    const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    if (partnerObj.logo && partnerObj.logo.startsWith('/uploads/')) {
      partnerObj.logo = `${baseUrl}${partnerObj.logo}`;
    }
    if (partnerObj.paymentQrImage && partnerObj.paymentQrImage.startsWith('/uploads/')) {
      partnerObj.paymentQrImage = `${baseUrl}${partnerObj.paymentQrImage}`;
    }

    res.json({ success: true, partner: partnerObj, homepage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, superAdminOnly, upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'institutePhoto', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]), async (req, res) => {
  try {
    const body = req.body;
    const {
      instituteName, ownerName, email, phone, password,
      address, city, state, pincode,
      agreementStartDate, agreementEndDate, tagline, themeColor,
    } = body;

    if (!instituteName || !ownerName || !email || !password || !phone || !address || !city || !state) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let slug = slugify(instituteName + '-' + city);
    const existingSlug = await Partner.findOne({ slug });
    if (existingSlug) {
      slug = slug + '-' + Date.now().toString().slice(-4);
    }

    const franchiseId = await generateFranchiseId();

    const documents = {};
    if (req.files?.idProof) documents.idProof = `/uploads/${req.files.idProof[0].filename}`;
    if (req.files?.institutePhoto) documents.institutePhoto = `/uploads/${req.files.institutePhoto[0].filename}`;
    const logo = req.files?.logo ? `/uploads/${req.files.logo[0].filename}` : undefined;

    const references = [];
    if (body.ref1Name) references.push({ name: body.ref1Name, phone: body.ref1Phone, relation: body.ref1Relation });
    if (body.ref2Name) references.push({ name: body.ref2Name, phone: body.ref2Phone, relation: body.ref2Relation });

    const partner = await Partner.create({
      franchiseId,
      instituteName,
      instituteType: body.instituteType || 'new',
      ownerName,
      slug,
      email: email.toLowerCase(),
      phone,
      alternatePhone: body.alternatePhone || undefined,
      aadhaarNumber: body.aadhaarNumber || undefined,
      panNumber: body.panNumber || undefined,
      password,
      address,
      city,
      state,
      pincode,
      landmark: body.landmark || undefined,
      mapsLink: body.mapsLink || undefined,
      premisesType: body.premisesType || 'rented',
      totalArea: body.totalArea ? Number(body.totalArea) : undefined,
      classrooms: body.classrooms ? Number(body.classrooms) : 1,
      computers: body.computers ? Number(body.computers) : 0,
      logo: logo || undefined,
      tagline: tagline || '',
      themeColor: themeColor || '#2563eb',
      agreementStartDate: agreementStartDate || Date.now(),
      agreementEndDate: agreementEndDate || undefined,
      securityDeposit: body.securityDeposit ? Number(body.securityDeposit) : 0,
      franchiseFee: body.franchiseFee ? Number(body.franchiseFee) : 0,
      paymentMode: 'yearly',
      bankDetails: {
        accountNumber: body.bankAccountNumber || undefined,
        bankName: body.bankName || undefined,
        ifscCode: body.ifscCode || undefined,
      },
      gstNumber: body.gstNumber || undefined,
      documents,
      references,
      establishedYear: body.establishedYear ? Number(body.establishedYear) : undefined,
      socialLinks: {
        facebook: body.facebook || '',
        instagram: body.instagram || '',
        youtube: body.youtube || '',
        whatsapp: body.whatsapp || '',
      },
      description: body.description || '',
    });

    const user = await User.create({
      name: ownerName,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'partner',
      partnerId: partner._id,
    });

    await createDefaultHomepage(partner._id, partner.themeColor);

    // Send Onboarding Email with Credentials to Partner
    try {
      const org = await OrgHomepage.findOne();
      const orgName = org?.settings?.orgName || 'Lili Organization';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      await sendEmail({
        email: email.toLowerCase(),
        subject: `🎉 Official Partner Center Approved: ${instituteName} [ID: ${partner.franchiseId}] - ${orgName}`,
        message: `Welcome to ${orgName}! Your Partner Center ${instituteName} is approved and active. Franchise ID: ${partner.franchiseId}, Login Email: ${email}, Password: ${password}. Login at ${clientUrl}/partner/login`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #002e7a; margin-top: 0;">🎉 Welcome to ${orgName} Partner Network!</h2>
            <p>Dear <strong>${ownerName}</strong>, your center <strong>${instituteName}</strong> has been registered and authorized.</p>
            
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h4 style="margin: 0 0 10px; color: #1e293b;">🔑 Partner CRM Portal Credentials:</h4>
              <p style="margin: 4px 0;"><strong>Portal Login:</strong> <a href="${clientUrl}/partner/login">${clientUrl}/partner/login</a></p>
              <p style="margin: 4px 0;"><strong>Franchise ID:</strong> <code>${partner.franchiseId}</code></p>
              <p style="margin: 4px 0;"><strong>Login Email:</strong> ${email}</p>
              <p style="margin: 4px 0;"><strong>Password:</strong> <code>${password}</code></p>
            </div>

            <p><a href="${clientUrl}/partner/login" style="display: inline-block; background: #002e7a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Partner CRM Portal</a></p>
          </div>
        `,
      });
      console.log(`[Admin Created Partner Email Sent] To: ${email}`);
    } catch (mailErr) {
      console.error('[Admin Created Partner Email Error]', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Partner registered successfully',
      partner,
      loginUrl: `/institute/${partner.slug}/login`,
      credentials: { email, password },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role === 'partner' && (!req.user.partnerId || req.user.partnerId.toString() !== req.params.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const isSuperAdmin = ['super_admin', 'superadmin', 'admin', 'staff'].includes(req.user?.role);
    const allowedFields = isSuperAdmin
      ? ['instituteName', 'ownerName', 'email', 'phone', 'password', 'address', 'city', 'state', 'pincode', 'agreementStartDate', 'agreementEndDate', 'status', 'tagline', 'themeColor', 'logo', 'loginBgImage', 'socialLinks', 'description', 'establishedYear', 'alternatePhone', 'aadhaarNumber', 'panNumber', 'landmark', 'mapsLink', 'premisesType', 'totalArea', 'classrooms', 'computers', 'securityDeposit', 'franchiseFee', 'bankDetails', 'gstNumber', 'documents', 'references', 'showInAdmissionForm', 'centerType', 'paymentInfo', 'proposalDetails', 'upiId', 'paymentQrImage']
      : ['phone', 'address', 'city', 'state', 'pincode', 'tagline', 'logo', 'loginBgImage', 'socialLinks', 'description', 'establishedYear', 'alternatePhone', 'landmark', 'mapsLink', 'socialLinks', 'upiId', 'paymentQrImage'];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.premisesType) updates.premisesType = updates.premisesType.toLowerCase();
    if (updates.status) updates.status = updates.status.toLowerCase();
    if (updates.email) updates.email = updates.email.toLowerCase().trim();

    const partner = await Partner.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: false });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Sync User credentials if Super Admin updated email, name, phone or password
    if (isSuperAdmin) {
      const userUpdates = {};
      if (updates.email) userUpdates.email = updates.email.toLowerCase().trim();
      if (updates.ownerName) userUpdates.name = updates.ownerName;
      if (updates.phone) userUpdates.phone = updates.phone;

      if (updates.password) {
        const bcrypt = require('bcryptjs');
        userUpdates.password = await bcrypt.hash(updates.password, 10);
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.updateMany({ $or: [{ partnerId: partner._id }, { email: partner.email }] }, { $set: userUpdates });
      }
    }

    res.json({ success: true, message: 'Partner center profile updated successfully', partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Partner Logo Upload Route with safe error handler
router.post('/:id/upload-logo', protect, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.error('[PARTNER LOGO UPLOAD ERROR]', err.message);
      return res.status(400).json({ success: false, message: err.message || 'Logo upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (req.user.role === 'partner' && req.user.partnerId?.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a logo image file' });
    }
    const logoPath = `/uploads/${req.file.filename}`;
    const partner = await Partner.findByIdAndUpdate(req.params.id, { logo: logoPath }, { new: true });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    const baseUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    res.json({ success: true, message: 'Logo uploaded successfully!', logo: `${baseUrl}${logoPath}`, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Partner Payment QR Upload Route
router.post('/:id/upload-payment-qr', protect, (req, res, next) => {
  upload.single('paymentQr')(req, res, (err) => {
    if (err) {
      console.error('[PARTNER QR UPLOAD ERROR]', err.message);
      return res.status(400).json({ success: false, message: err.message || 'QR upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (req.user.role === 'partner' && req.user.partnerId?.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a QR image file' });
    }
    const qrPath = `/uploads/${req.file.filename}`;
    const partner = await Partner.findByIdAndUpdate(req.params.id, { paymentQrImage: qrPath }, { new: true });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    res.json({ success: true, message: 'Payment QR uploaded successfully!', paymentQrImage: qrPath, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, superAdminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const partner = await Partner.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    if (status === 'inactive' || status === 'terminated') {
      await User.updateMany({ partnerId: partner._id }, { isActive: false });
    } else if (status === 'active') {
      await User.updateOne({ partnerId: partner._id, role: 'partner' }, { isActive: true });

      // Send approval confirmation email to partner
      try {
        const org = await OrgHomepage.findOne();
        const orgName = org?.settings?.orgName || 'Lili Organization';
        const themeColor = org?.settings?.themeColor || '#2563eb';
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        await sendEmail({
          email: partner.email,
          subject: `Partner Approved: ${partner.instituteName} - ${orgName}`,
          message: `Dear ${partner.ownerName}, your partner center ${partner.instituteName} has been approved. You can now login at ${clientUrl}/partner/login`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:${themeColor};color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="margin:0;font-size:22px">Partner Center Approved!</h1>
              <p style="margin:4px 0 0;opacity:0.9">${orgName}</p>
            </div>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px">
              <p>Dear <strong>${partner.ownerName}</strong>,</p>
              <p>Congratulations! Your partner center <strong>${partner.instituteName}</strong> has been approved and is now active.</p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
                <span style="color:#15803d;font-weight:bold;font-size:16px">Your center is now live and ready to accept admissions!</span>
              </div>
              <p>You can login to your partner portal at <a href="${clientUrl}/partner/login" style="color:${themeColor};font-weight:bold">${clientUrl}/partner/login</a></p>
              <p style="font-size:12px;color:#94a3b8;margin-top:20px">This is an automated email. Please do not reply.</p>
            </div>
          </div>`,
        });
        console.log(`[Partner Approval Email] Sent to: ${partner.email}`);
      } catch (mailErr) {
        console.error('[Partner Approval Email Error]', mailErr.message);
      }
    }
    res.json({ success: true, partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await Partner.findByIdAndDelete(req.params.id);
    await User.deleteMany({ partnerId: req.params.id });
    await Homepage.deleteOne({ partnerId: req.params.id });
    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Razorpay Order for Franchise / Partnership Application Fee
router.post('/public/create-franchise-order', async (req, res) => {
  try {
    const { planName, feeAmount, instituteName, name, email, phone } = req.body;

    const trimmedEmail = (email || '').toLowerCase().trim();
    if (trimmedEmail) {
      const existingUser = await User.findOne({ email: trimmedEmail });
      const existingPartner = await Partner.findOne({ email: trimmedEmail });
      if (existingUser || existingPartner) {
        return res.status(400).json({
          success: false,
          message: `Email '${email}' is already registered. Please use another email address or log in to your existing account.`,
        });
      }
    }

    const amount = Number(feeAmount) > 0 ? Number(feeAmount) : 15000;
    const amountInPaise = Math.round(amount * 100);

    if (!razorpayClient) {
      return res.status(503).json({
        success: false,
        message: 'Online payment gateway is temporarily unavailable. Please choose Pay Later option.',
      });
    }

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `RCP-FR-${Date.now().toString().slice(-8)}`,
      notes: {
        type: 'franchise_affiliation_fee',
        planName: planName || 'Franchise Partner Plan',
        instituteName: instituteName || 'Partner Center',
        ownerName: name || 'Partner',
        email: email || '',
        phone: phone || '',
      },
    };

    const razorpayOrder = await razorpayClient.orders.create(orderOptions);

    res.json({
      success: true,
      payableAmount: amount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
    });
  } catch (error) {
    console.error('Error creating franchise Razorpay order:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to initiate franchise payment' });
  }
});

router.post('/public/apply', async (req, res) => {
  try {
    const {
      instituteName, name, email, phone,
      address, city, state, pincode,
      ownership, floorLevel, spaceSqFt, computers,
      internet, powerBackup, experience, investment,
      timeline, expectedAdmissions, institutionType,
      organizationName,
      classroomCount, preferredCourses, labEquipments, hospitalTieUp,
      medicalStaffCount, internetSpeed, itInstructor, yogaMatsCount,
      yogaHallArea, certifiedInstructor, projectorAvailable,
      tradingTerminalsCount, seatingCapacity, facultyExperience,
      govtRegNo, pastPlacementDetails, biometricSystem,
      partnershipType, partnershipPlan, interestedVerticals, currentBusinessType, experienceInEducation, hearAboutUs,
      paymentMode, paidAmount, razorpayOrderId, razorpayPaymentId, razorpaySignature
    } = req.body;

    if (!instituteName || !name || !email || !phone || !address || !city || !state) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Payment verification if online payment
    const mode = paymentMode || 'offline_pay_later';
    let isPaymentVerified = false;

    if (mode === 'online_razorpay') {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Incomplete payment credentials from Razorpay',
        });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || 'D8Mqui5388u2E9bjOYL5uWDw';
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Unauthorized transaction.',
        });
      }

      isPaymentVerified = true;
    }

    let slug = slugify(instituteName + '-' + city);
    const existingSlug = await Partner.findOne({ slug });
    if (existingSlug) {
      slug = slug + '-' + Date.now().toString().slice(-4);
    }

    const franchiseId = await generateFranchiseId();
    const password = phone || 'partner123';

    const proposalDetails = {
      ownership, floorLevel, spaceSqFt, computers,
      internet, powerBackup, experience, investment,
      timeline, expectedAdmissions, institutionType,
      organizationName,
      classroomCount, preferredCourses, labEquipments, hospitalTieUp,
      medicalStaffCount, internetSpeed, itInstructor, yogaMatsCount,
      yogaHallArea, certifiedInstructor, projectorAvailable,
      tradingTerminalsCount, seatingCapacity, facultyExperience,
      govtRegNo, pastPlacementDetails, biometricSystem,
      partnershipType, partnershipPlan, interestedVerticals, currentBusinessType, experienceInEducation, hearAboutUs
    };

    const paymentInfo = {
      paymentMode: mode,
      paidAmount: Number(paidAmount) || 0,
      planName: partnershipPlan || 'Authorized Partner Plan',
      paymentStatus: isPaymentVerified ? 'paid' : 'pending',
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      razorpaySignature: razorpaySignature || undefined,
      paidAt: isPaymentVerified ? new Date() : undefined,
    };

    const partner = await Partner.create({
      franchiseId,
      instituteName,
      instituteType: 'new',
      ownerName: name,
      slug,
      email: email.toLowerCase(),
      phone,
      password,
      address,
      city,
      state,
      pincode,
      premisesType: ownership === 'Owned' ? 'owned' : 'rented',
      totalArea: spaceSqFt ? Number(spaceSqFt) : undefined,
      classrooms: classroomCount ? Number(classroomCount) : 1,
      computers: computers ? Number(computers) : 0,
      agreementStartDate: Date.now(),
      status: 'pending',
      proposalDetails,
      paymentInfo,
    });

    await User.create({
      name: name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'partner',
      partnerId: partner._id,
      isActive: false,
    });

    await createDefaultHomepage(partner._id, '#2563eb');

    // Send Confirmation Email with Credentials to Partner
    try {
      const org = await OrgHomepage.findOne();
      const orgName = org?.settings?.orgName || 'Lili Organization';
      const themeColor = org?.settings?.themeColor || '#2563eb';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const helpPhone = org?.contact?.phone || '+91 7354542010';
      const helpEmail = org?.contact?.email || 'info.lili.org@gmail.com';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Franchise Center Registration Confirmed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header Banner -->
            <tr>
              <td style="background-color: ${themeColor}; padding: 32px 24px; text-align: center; color: #ffffff;">
                <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                  ${orgName}
                </div>
                <div style="font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 500;">
                  National Skill & Authorized Training Partner Network
                </div>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding: 32px 28px;">
                <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px;">
                  🎉 Welcome to the Partner Network!
                </h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                  Dear <strong>${name}</strong>, congratulations on registering <strong>${instituteName}</strong>. Aapka franchise application record safaltapoorvak create ho gaya hai.
                </p>

                <!-- Credentials Card -->
                <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <div style="font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                    🔑 Partner Portal Login Credentials
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; color: #334155;">
                    <tr>
                      <td width="140" style="color: #64748b; font-weight: 600;">Partner Portal URL:</td>
                      <td>
                        <a href="${clientUrl}/partner/login" style="color: #2563eb; font-weight: 700; text-decoration: none;">
                          ${clientUrl}/partner/login
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Franchise Center ID:</td>
                      <td><span style="font-family: monospace; font-weight: 800; color: #0f172a; background: #e2e8f0; padding: 3px 8px; border-radius: 6px;">${partner.franchiseId}</span></td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Registered Email:</td>
                      <td><strong style="color: #0f172a;">${email}</strong></td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">Password:</td>
                      <td><span style="font-family: monospace; font-weight: 800; color: #0f172a; background: #e2e8f0; padding: 3px 8px; border-radius: 6px;">${password}</span></td>
                    </tr>
                  </table>
                </div>

                <!-- Registration & Financial Summary -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                    📋 Affiliation & Plan Details
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #475569;">
                    <tr>
                      <td>Selected Tier:</td>
                      <td align="right" style="font-weight: 700; color: #0f172a;">${paymentInfo.planName}</td>
                    </tr>
                    <tr>
                      <td>Center Location:</td>
                      <td align="right" style="font-weight: 600;">${city}, ${state}</td>
                    </tr>
                    <tr>
                      <td>Payment Status:</td>
                      <td align="right">
                        ${isPaymentVerified
                          ? '<span style="color: #15803d; font-weight: 800; background: #dcfce7; padding: 2px 8px; border-radius: 6px;">✓ PAID ONLINE (₹' + paymentInfo.paidAmount + ')</span>'
                          : '<span style="color: #b45309; font-weight: 700; background: #fef3c7; padding: 2px 8px; border-radius: 6px;">PAY LATER / PENDING</span>'
                        }
                      </td>
                    </tr>
                    ${paymentInfo.razorpayPaymentId ? `
                    <tr>
                      <td>Transaction Ref ID:</td>
                      <td align="right" style="font-family: monospace; font-size: 12px; color: #64748b;">${paymentInfo.razorpayPaymentId}</td>
                    </tr>` : ''}
                  </table>
                </div>

                <!-- Action Buttons -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px;">
                  <tr>
                    <td align="center">
                      <a href="${clientUrl}/partner/login" style="display: inline-block; background-color: ${themeColor}; color: #ffffff; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin-right: 8px; margin-bottom: 8px;">
                        🚀 Login to Partner Portal
                      </a>
                      <a href="${clientUrl}/franchise/receipt/${partner.franchiseId}" style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 14px; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; border: 1px solid #cbd5e1;">
                        📄 Download Registration Receipt
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                  Need help? Contact our partner helpdesk at <strong>${helpPhone}</strong> or email <strong>${helpEmail}</strong>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${orgName}. All rights reserved. Electronic dispatch.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await sendEmail({
        email: email.toLowerCase(),
        subject: `🎉 Franchise Center Registered: ${instituteName} [ID: ${partner.franchiseId}] - ${orgName}`,
        message: `Welcome to ${orgName}! Your Franchise Center ${instituteName} is registered. Franchise ID: ${partner.franchiseId}, Login Email: ${email}, Password: ${password}. Login at ${clientUrl}/partner/login or download receipt at ${clientUrl}/franchise/receipt/${partner.franchiseId}`,
        html: emailHtml,
      });
      console.log(`[Franchise Confirmation Email Sent] To: ${email} for Center: ${instituteName}`);
    } catch (mailErr) {
      console.error('[Franchise Email Error]', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: isPaymentVerified
        ? 'Payment verified & Franchise Application submitted successfully!'
        : 'Application submitted successfully. It will be reviewed by admin.',
      franchiseId: partner.franchiseId,
      partner,
      paymentStatus: paymentInfo.paymentStatus,
      paidAmount: paymentInfo.paidAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
