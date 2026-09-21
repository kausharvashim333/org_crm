const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const CounsellingSettings = require('../models/CounsellingSettings');
const CounsellingService = require('../models/CounsellingService');
const CounsellingSession = require('../models/CounsellingSession');
const CounsellingBooking = require('../models/CounsellingBooking');
const CounsellingSlot = require('../models/CounsellingSlot');
const CounsellingWaitlist = require('../models/CounsellingWaitlist');
const User = require('../models/User');
const { protect, superAdminOnly, counsellorOrAdmin } = require('../middleware/auth');
const {
  sendCounsellingConfirmEmail,
  sendCounsellingCancelEmail,
  sendWaitlistOfferEmail,
  sendRecordingEmail,
  sendJoinLinkEmail,
} = require('../utils/counsellingEmail');

const router = express.Router();

let razorpayClient = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'D8Mqui5388u2E9bjOYL5uWDw';
if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayClient = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  } catch (err) {
    console.error('Razorpay init error in counselling.js:', err);
  }
}

const LOCK_MS = 10 * 60 * 1000;

const generateBookingCode = async (prefix) => {
  const count = await CounsellingBooking.countDocuments();
  let num = count + 1;
  let code = `${prefix}-${String(num).padStart(5, '0')}`;
  while (await CounsellingBooking.findOne({ bookingCode: code })) {
    num += 1;
    code = `${prefix}-${String(num).padStart(5, '0')}`;
  }
  return code;
};

const activeSeatFilter = () => ({
  $or: [
    { paymentStatus: 'paid', status: { $nin: ['cancelled', 'refunded'] } },
    { status: 'pending', seatLockExpiresAt: { $gt: new Date() } },
  ],
});

const countOccupiedSeats = async (sessionId) => {
  return CounsellingBooking.countDocuments({ sessionId, ...activeSeatFilter() });
};

const syncSessionBookedCount = async (sessionId) => {
  if (!sessionId) return;
  const bookedCount = await countOccupiedSeats(sessionId);
  await CounsellingSession.findByIdAndUpdate(sessionId, { bookedCount });
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const generated = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generated === signature;
};

const offerWaitlistSeat = async (sessionId) => {
  const session = await CounsellingSession.findById(sessionId);
  if (!session) return;
  const occupied = await countOccupiedSeats(sessionId);
  if (occupied >= (session.seats || 0)) return;
  await CounsellingWaitlist.updateMany(
    { sessionId, status: 'offered', offerExpiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );
  const next = await CounsellingWaitlist.findOne({ sessionId, status: 'waiting' }).sort({ createdAt: 1 });
  if (!next) return;
  next.status = 'offered';
  next.offeredAt = new Date();
  next.offerExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await next.save();
  sendWaitlistOfferEmail({ name: next.name, email: next.email, session, offerExpiresAt: next.offerExpiresAt });
};

const releaseExpiredSlotHolds = async () => {
  await CounsellingSlot.updateMany(
    { status: 'held', heldUntil: { $lt: new Date() } },
    { $set: { status: 'open' }, $unset: { heldUntil: 1, bookingId: 1 } }
  );
};

const publicBookingPayload = (booking, extra = {}) => ({
  _id: booking._id,
  bookingCode: booking.bookingCode,
  type: booking.type,
  itemTitle: booking.itemTitle,
  name: booking.name,
  phone: booking.phone,
  email: booking.email,
  city: booking.city,
  amount: booking.amount,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  paymentMode: booking.paymentMode,
  paidAt: booking.paidAt,
  ...extra,
});

const getOrCreateSettings = async () => {
  let settings = await CounsellingSettings.findOne();
  if (!settings) settings = await CounsellingSettings.create({});
  return settings;
};

const isUpcomingSession = (session) => {
  if (!session?.date) return false;
  const sessionDay = new Date(session.date);
  const now = new Date();
  const endOfSessionDay = new Date(sessionDay);
  endOfSessionDay.setHours(23, 59, 59, 999);
  if (session.bookingClosesAt && new Date(session.bookingClosesAt) < now) return false;
  return endOfSessionDay >= now;
};

router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    if (!settings.showOnWebsite) {
      return res.json({
        success: true,
        visible: false,
        settings,
        services: [],
        sessions: [],
      });
    }

    const services = await CounsellingService.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    const published = await CounsellingSession.find({
      status: 'published',
      showOnWebsite: { $ne: false },
    }).sort({ date: 1, startTime: 1 });

    await releaseExpiredSlotHolds();
    const upcoming = published.filter(isUpcomingSession);
    const sessions = [];
    for (const s of upcoming) {
      const occupied = await countOccupiedSeats(s._id);
      const obj = s.toObject();
      obj.bookedCount = occupied;
      obj.seatsLeft = Math.max(0, (obj.seats || 0) - occupied);
      delete obj.meetingLink;
      sessions.push(obj);
    }
    const now = new Date();
    const slots = await CounsellingSlot.find({
      status: { $in: ['open', 'held'] },
      startAt: { $gt: now },
    }).sort({ startAt: 1 }).lean();
    const openSlots = slots.filter((sl) => sl.status === 'open' || (sl.heldUntil && new Date(sl.heldUntil) < now));

    res.json({
      success: true,
      visible: true,
      settings,
      services,
      sessions,
      slots: openSlots.map((sl) => ({
        _id: sl._id,
        serviceId: sl.serviceId,
        startAt: sl.startAt,
        endAt: sl.endAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/settings', protect, superAdminOnly, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', protect, superAdminOnly, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const allowed = ['showOnWebsite', 'pageTitle', 'pageSubtitle', 'heroBadge', 'whatsappNumber', 'noticeText'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    });
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const { GoogleGenerativeAI } = require('@google/generative-ai');

const getPopularCuratedMeta = (name = '', description = '', mode = 'video', duration = '30 min') => {
  const combined = `${name || ''} ${description || ''}`.toLowerCase().trim();

  if (/12th|10th|school|stream|science|arts|commerce|matric|intermediate/.test(combined)) {
    return {
      taglines: [
        'Personalized guidance to choose the right stream, courses & college path',
        'Confused after 10th/12th? Get 1-on-1 clarity on high-paying career paths',
        'Make confident stream & college choices with proven aptitude mapping',
        'Discover top degrees, eligibility & career scope tailored for your profile',
        'Step-by-step roadmap from school graduation to top university admissions',
      ],
      includes: 'Stream & subject selection guidance, Top 3 degree & career roadmaps, College eligibility & entrance exam tips, Parent-student doubt clearance, Action summary notes',
    };
  }

  if (/job|placement|interview|resume|cv|salary|fresher|switch|hiring|hr round/.test(combined)) {
    return {
      taglines: [
        'Crack high-impact job interviews & build an industry-ready resume',
        '1-on-1 career coaching to accelerate your placement & salary package',
        'Strategic career switch guidance from active industry experts',
        'Master technical & HR rounds with personalized mock interview tips',
        'Turn job rejections into offers with a personalized career upgrade plan',
      ],
      includes: 'ATS-friendly resume audit, LinkedIn profile optimization, Live mock interview & feedback, Salary negotiation strategy, 7-day WhatsApp doubt support',
    };
  }

  if (/it|tech|code|coding|software|web|full stack|frontend|backend|data|python|java|cloud|ai|devops/.test(combined)) {
    return {
      taglines: [
        'Structured personalized roadmap to break into high-growth tech careers',
        'Master in-demand software skills with real-world project mentorship',
        'From beginner to job-ready developer: 1-on-1 tailored tech roadmap',
        'Portfolio review, coding interview secrets & tech industry navigation',
        'Accelerate your IT career with practical skills and placement tactics',
      ],
      includes: 'GitHub & project portfolio review, Practical tech roadmap (Languages & Frameworks), DSA & problem-solving strategy, Real tech interview questions breakdown, Curated learning resources',
    };
  }

  if (/govt|sarkari|upsc|ssc|railway|banking|defense|police|civil service/.test(combined)) {
    return {
      taglines: [
        'Targeted strategy, exam selection & high-yield preparation guidance',
        'Smart preparation blueprint to crack competitive exams on first attempt',
        'Expert mentorship on syllabus prioritization, test series & time mastery',
        'Clear your doubts on govt job eligibility, vacancies & career security',
        'Structured study schedule & proven revision tactics by experienced mentors',
      ],
      includes: 'Exam syllabus breakdown & scoring topics, Standard booklist & test series guide, Daily preparation & revision schedule, Mistakes to avoid in first attempt, 1-on-1 strategy & doubt solving',
    };
  }

  if (/college|degree|university|admission|bca|mca|btech|diploma|mba|bba|campus/.test(combined)) {
    return {
      taglines: [
        'Expert clarity on college selection, degree ROI & real industry relevance',
        'Compare courses & universities to secure the best admission for your future',
        'Avoid costly degree mistakes with unbiased 1-on-1 college counselling',
        'Evaluate top accredited colleges, fee structures & campus placement records',
        'Find the perfect degree aligned with your passions and market demand',
      ],
      includes: 'College vs degree ROI comparison, Cutoff & admission process guide, Direct placement record insights, Course specialization recommendation, Personalized decision checklist',
    };
  }

  if (/finance|tally|gst|accounting|tax|ca|commerce|audit|bookkeeping/.test(combined)) {
    return {
      taglines: [
        'Direct mentorship on modern accounting careers, GST & corporate finance',
        'Master computerized accounting & unlock high-demand financial roles',
        'Fast-track your accounting career with practical industry knowledge',
        'Professional guidance on accounting certifications & corporate compliance',
        'Step into corporate finance & taxation with verified job-ready skills',
      ],
      includes: 'Practical accounting workflow breakdown, GST/TDS compliance career scope, Recommended certifications & tools, Corporate entry-level job roadmap, Interview questions cheat sheet',
    };
  }

  if (/design|graphic|ui|ux|multimedia|animation|video editing|figma|photoshop/.test(combined)) {
    return {
      taglines: [
        'Build a winning design portfolio, freelance profile & creative career',
        'Master modern UI/UX and visual design tools with expert feedback',
        'Turn your creative passion into a high-paying professional design career',
        'Industry-standard portfolio review and freelance client acquisition tips',
        'Accelerate your creative journey with 1-on-1 design mentorship',
      ],
      includes: 'Portfolio & Behance/Figma audit, Design tools & workflow roadmap, Freelance client pitch & pricing guide, Live creative critique & feedback, Resource pack & typography guidelines',
    };
  }

  const topicName = name ? name.trim() : (description ? description.trim().slice(0, 30) : 'your career');
  return {
    taglines: [
      `1-on-1 personalized mentorship & actionable roadmap for ${topicName}`,
      'Clear confusion, choose the right direction & fast-track your success',
      'Personalized career strategy tailored to your strengths, goals & passions',
      'Get actionable feedback from experienced mentors in a private 1-on-1 call',
      'Unlock your true potential with an industry-tested career success roadmap',
    ],
    includes: 'Personalized career action roadmap, Strengths & skill gap analysis, Step-by-step career milestones, Resource & learning recommendations, 1-on-1 private mentoring call',
  };
};

const getPopularCuratedTaglines = (name, mode = 'video', duration = '30 min', description = '') => {
  return getPopularCuratedMeta(name, description, mode, duration).taglines;
};

const generateServiceTagline = (name, mode = 'video', duration = '30 min', description = '') => {
  const meta = getPopularCuratedMeta(name, description, mode, duration);
  return meta.taglines[0];
};

const generateAIServiceMeta = async (name, description = '', mode = 'video', duration = '30 min') => {
  const fallback = getPopularCuratedMeta(name, description, mode, duration);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || (!name?.trim() && !description?.trim())) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are a world-class educational marketing copywriter and career coach for modern edtech platforms (Topmate, UpGrad, Coursera).
Based on the following 1-on-1 counselling service:
Service Name / Topic: "${(name || '').trim()}"
Service Description: "${(description || '').trim()}"
Format / Mode: ${mode || 'Video call'}
Duration: ${duration || '30 min'}

Requirements:
1. "taglines": 5 popular, catchy, high-converting taglines (7-15 words). If a description is provided, the taglines MUST closely reflect the value and intent explained in the description.
2. "includes": A comma-separated string of 4 to 5 realistic, service-specific deliverables/inclusions that a candidate ACTUALLY needs for this exact topic & description (e.g. ATS Resume review, Portfolio critique, Stream assessment, Syllabus blueprint, etc. Strictly relevant to the service, avoid generic fluff).

Return ONLY a valid JSON object in this exact format (no markdown code fence):
{
  "taglines": ["Tagline 1", "Tagline 2", "Tagline 3", "Tagline 4", "Tagline 5"],
  "includes": "Deliverable 1, Deliverable 2, Deliverable 3, Deliverable 4, Deliverable 5"
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.taglines) && parsed.taglines.length > 0) {
      return {
        taglines: parsed.taglines.slice(0, 5).map((t) => String(t).trim()),
        includes: typeof parsed.includes === 'string' && parsed.includes.trim()
          ? parsed.includes.trim()
          : (Array.isArray(parsed.includes) ? parsed.includes.join(', ') : fallback.includes),
      };
    }
  } catch (err) {
    console.warn('[AI Service Meta Generation Fallback]', err.message);
  }
  return fallback;
};

router.post('/services/generate-tagline', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, mode, duration } = req.body;
    const meta = await generateAIServiceMeta(name, description, mode, duration);
    res.json({
      success: true,
      tagline: meta.taglines[0] || generateServiceTagline(name, mode, duration, description),
      taglines: meta.taglines,
      includes: meta.includes,
    });
  } catch (error) {
    const fallback = getPopularCuratedMeta(req.body?.name, req.body?.description, req.body?.mode, req.body?.duration);
    res.json({ success: true, tagline: fallback.taglines[0], taglines: fallback.taglines, includes: fallback.includes });
  }
});

router.get('/services', protect, superAdminOnly, async (req, res) => {
  try {
    const services = await CounsellingService.find().populate('counsellorId', 'name email').sort({ displayOrder: 1, createdAt: 1 });
    for (const s of services) {
      if (!s.tagline || !s.tagline.trim()) {
        s.tagline = generateServiceTagline(s.name, s.mode, s.duration);
        await s.save();
      }
    }
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/services', protect, superAdminOnly, async (req, res) => {
  try {
    const count = await CounsellingService.countDocuments();
    const tagline = (req.body.tagline && req.body.tagline.trim())
      ? req.body.tagline.trim()
      : generateServiceTagline(req.body.name, req.body.mode, req.body.duration);

    const service = await CounsellingService.create({
      ...req.body,
      tagline,
      displayOrder: req.body.displayOrder ?? count,
      includes: Array.isArray(req.body.includes)
        ? req.body.includes
        : String(req.body.includes || '').split(',').map((s) => s.trim()).filter(Boolean),
      price: Number(req.body.price) || 0,
      originalPrice: Number(req.body.originalPrice) || 0,
      groupPrice: Number(req.body.groupPrice) || 0,
      originalGroupPrice: Number(req.body.originalGroupPrice) || 0,
    });
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/services/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.includes !== undefined && !Array.isArray(payload.includes)) {
      payload.includes = String(payload.includes).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (payload.price !== undefined) payload.price = Number(payload.price) || 0;
    if (payload.originalPrice !== undefined) payload.originalPrice = Number(payload.originalPrice) || 0;
    if (payload.groupPrice !== undefined) payload.groupPrice = Number(payload.groupPrice) || 0;
    if (payload.originalGroupPrice !== undefined) payload.originalGroupPrice = Number(payload.originalGroupPrice) || 0;
    if (payload.name && (!payload.tagline || !String(payload.tagline).trim())) {
      payload.tagline = generateServiceTagline(payload.name, payload.mode, payload.duration);
    }
    const service = await CounsellingService.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/services/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const service = await CounsellingService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sessions', protect, superAdminOnly, async (req, res) => {
  try {
    const sessions = await CounsellingSession.find().populate('counsellorId', 'name email').sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sessions', protect, superAdminOnly, async (req, res) => {
  try {
    const session = await CounsellingSession.create({
      ...req.body,
      seats: Number(req.body.seats) || 30,
      fee: Number(req.body.fee) || 0,
      originalFee: Number(req.body.originalFee) || 0,
      bookedCount: 0,
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/sessions/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.seats !== undefined) payload.seats = Number(payload.seats) || 0;
    if (payload.fee !== undefined) payload.fee = Number(payload.fee) || 0;
    if (payload.originalFee !== undefined) payload.originalFee = Number(payload.originalFee) || 0;
    delete payload.bookedCount;
    const session = await CounsellingSession.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/sessions/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const session = await CounsellingSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    const toCancel = await CounsellingBooking.find({
      sessionId: req.params.id,
      status: { $nin: ['cancelled', 'refunded'] },
    });
    await CounsellingBooking.updateMany(
      { sessionId: req.params.id, status: { $nin: ['cancelled', 'refunded'] } },
      { status: 'cancelled' }
    );
    toCancel.forEach((b) => sendCounsellingCancelEmail(b, session));
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/create-order', async (req, res) => {
  try {
    const { type, serviceId, sessionId, slotId, name, phone, email, city, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }
    const phoneNorm = normalizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(phoneNorm)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid Gmail / email is required for booking confirmation' });
    }

    let itemTitle = '';
    let amount = 0;
    let service = null;
    let session = null;
    let slot = null;
    await releaseExpiredSlotHolds();

    if (type === 'group') {
      if (sessionId) {
        session = await CounsellingSession.findById(sessionId);
        if (!session || session.status !== 'published' || session.showOnWebsite === false) {
          return res.status(404).json({ success: false, message: 'Session not available' });
        }
        if (!isUpcomingSession(session)) {
          return res.status(400).json({ success: false, message: 'This session is closed for booking' });
        }
        const existingPaid = await CounsellingBooking.findOne({
          sessionId: session._id,
          phone: phoneNorm,
          paymentStatus: 'paid',
          status: { $nin: ['cancelled', 'refunded'] },
        });
        if (existingPaid) {
          return res.status(400).json({ success: false, message: 'This number already has a confirmed seat for this session' });
        }
        const occupied = await countOccupiedSeats(session._id);
        if (occupied >= (session.seats || 0)) {
          return res.status(400).json({ success: false, message: 'Seats are full for this session' });
        }
        itemTitle = session.title;
        amount = Number(session.fee) || 0;
      } else if (serviceId) {
        service = await CounsellingService.findById(serviceId);
        if (!service || service.isActive === false) {
          return res.status(404).json({ success: false, message: 'Counselling service not available' });
        }
        itemTitle = `${service.name} (Group Session)`;
        amount = Number(service.groupPrice !== undefined && service.groupPrice !== null ? service.groupPrice : service.price) || 0;
      } else {
        return res.status(400).json({ success: false, message: 'Session or service is required for group booking' });
      }
    } else {
      service = await CounsellingService.findById(serviceId);
      if (!service || service.isActive === false) {
        return res.status(404).json({ success: false, message: 'Counselling service not available' });
      }
      itemTitle = service.name;
      amount = Number(service.price) || 0;
      if (slotId) {
        slot = await CounsellingSlot.findById(slotId);
        if (!slot || String(slot.serviceId) !== String(service._id)) {
          return res.status(400).json({ success: false, message: 'Invalid time slot' });
        }
        if (slot.status === 'booked' || (slot.status === 'held' && slot.heldUntil > new Date())) {
          return res.status(400).json({ success: false, message: 'This slot is no longer available' });
        }
        if (new Date(slot.startAt) <= new Date()) {
          return res.status(400).json({ success: false, message: 'This slot has already started' });
        }
      }
    }

    const bookingCode = await generateBookingCode(type === 'group' ? 'GC' : 'CS');
    const booking = await CounsellingBooking.create({
      bookingCode,
      type: type === 'group' ? 'group' : 'one_on_one',
      serviceId: service?._id,
      sessionId: session?._id,
      itemTitle,
      name: name.trim(),
      phone: phoneNorm,
      email: (email || '').trim().toLowerCase(),
      city: city || '',
      message: message || '',
      amount,
      status: 'pending',
      paymentStatus: amount > 0 ? 'unpaid' : 'paid',
      paymentMode: amount > 0 ? 'razorpay' : 'free',
      seatLockExpiresAt: amount > 0 ? new Date(Date.now() + LOCK_MS) : undefined,
      paidAt: amount > 0 ? undefined : new Date(),
      slotId: slot?._id,
    });

    if (slot) {
      slot.status = amount > 0 ? 'held' : 'booked';
      slot.bookingId = booking._id;
      slot.heldUntil = amount > 0 ? new Date(Date.now() + LOCK_MS) : undefined;
      await slot.save();
    }

    if (amount === 0) {
      booking.status = 'confirmed';
      await booking.save();
      if (session) await syncSessionBookedCount(session._id);
      sendCounsellingConfirmEmail(booking, session);
      return res.status(201).json({
        success: true,
        booking: publicBookingPayload(booking),
        razorpayOrderId: null,
        razorpayKeyId,
        freeConfirmed: true,
      });
    }

    if (!razorpayClient) {
      await CounsellingBooking.findByIdAndDelete(booking._id);
      return res.status(500).json({ success: false, message: 'Payment gateway is not configured' });
    }

    const razorpayOrder = await razorpayClient.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: bookingCode,
      notes: {
        purpose: 'Counselling booking',
        bookingId: booking._id.toString(),
        bookingCode,
        type: booking.type,
      },
    });

    booking.razorpayOrderId = razorpayOrder.id;
    await booking.save();
    if (session) await syncSessionBookedCount(session._id);

    res.status(201).json({
      success: true,
      booking: publicBookingPayload(booking),
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId,
      amount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/verify', async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const booking = await CounsellingBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus === 'paid') {
      return res.json({ success: true, booking: publicBookingPayload(booking) });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Incomplete payment credentials' });
    }
    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Order mismatch' });
    }
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    if (booking.type === 'group' && booking.sessionId) {
      const session = await CounsellingSession.findById(booking.sessionId);
      if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
      const occupied = await countOccupiedSeats(session._id);
      const thisLockCounts = booking.status === 'pending' && booking.seatLockExpiresAt && booking.seatLockExpiresAt > new Date();
      const others = thisLockCounts ? occupied - 1 : occupied;
      if (others >= (session.seats || 0)) {
        booking.status = 'cancelled';
        booking.paymentStatus = 'failed';
        await booking.save();
        return res.status(400).json({ success: false, message: 'Seats filled before payment completed. Contact admin for refund if charged.' });
      }
    }

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();
    booking.seatLockExpiresAt = undefined;
    await booking.save();
    if (booking.slotId) {
      await CounsellingSlot.findByIdAndUpdate(booking.slotId, { status: 'booked', bookingId: booking._id, $unset: { heldUntil: 1 } });
    }
    if (booking.sessionId) {
      await syncSessionBookedCount(booking.sessionId);
      await CounsellingWaitlist.updateMany(
        { sessionId: booking.sessionId, email: booking.email, status: { $in: ['waiting', 'offered'] } },
        { status: 'booked' }
      );
    }
    const paidSession = booking.sessionId ? await CounsellingSession.findById(booking.sessionId) : null;
    sendCounsellingConfirmEmail(booking, paidSession);

    res.json({ success: true, booking: publicBookingPayload(booking) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/public/receipt/:code', async (req, res) => {
  try {
    const booking = await CounsellingBooking.findOne({ bookingCode: req.params.code })
      .populate('serviceId', 'name duration mode')
      .populate('sessionId', 'title date startTime endTime mode venue counsellorName language');
    if (!booking || booking.paymentStatus !== 'paid') {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const session = booking.sessionId && typeof booking.sessionId === 'object' ? booking.sessionId.toObject() : null;
    if (session) delete session.meetingLink;

    res.json({
      success: true,
      booking: {
        ...publicBookingPayload(booking),
        service: booking.serviceId,
        session,
        notice: 'Counselling fee is non-refundable and not adjustable against course or admission fees.',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/bookings', protect, superAdminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId;
    const bookings = await CounsellingBooking.find(filter)
      .populate('serviceId', 'name')
      .populate('sessionId', 'title date startTime')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bookings/manual', protect, superAdminOnly, async (req, res) => {
  try {
    const { type, serviceId, sessionId, name, phone, email, city, amount, adminNote } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    const phoneNorm = normalizePhone(phone);
    let itemTitle = '';
    let amt = Number(amount);
    if (type === 'group') {
      if (sessionId) {
        const session = await CounsellingSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        itemTitle = session.title;
        if (Number.isNaN(amt)) amt = Number(session.fee) || 0;
        const occupied = await countOccupiedSeats(session._id);
        if (occupied >= (session.seats || 0)) {
          return res.status(400).json({ success: false, message: 'Seats are full' });
        }
      } else if (serviceId) {
        const service = await CounsellingService.findById(serviceId);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
        itemTitle = `${service.name} (Group Session)`;
        if (Number.isNaN(amt)) amt = Number(service.groupPrice !== undefined && service.groupPrice !== null ? service.groupPrice : service.price) || 0;
      } else {
        return res.status(400).json({ success: false, message: 'Session or service required' });
      }
    } else {
      const service = await CounsellingService.findById(serviceId);
      if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
      itemTitle = service.name;
      if (Number.isNaN(amt)) amt = Number(service.price) || 0;
    }

    const booking = await CounsellingBooking.create({
      bookingCode: await generateBookingCode(type === 'group' ? 'GC' : 'CS'),
      type: type === 'group' ? 'group' : 'one_on_one',
      serviceId: serviceId || undefined,
      sessionId: sessionId || undefined,
      itemTitle,
      name: name.trim(),
      phone: phoneNorm,
      email: (email || '').trim().toLowerCase(),
      city: city || '',
      amount: amt || 0,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMode: amt > 0 ? 'cash' : 'free',
      paidAt: new Date(),
      adminNote: adminNote || 'Manual cash booking',
    });
    if (booking.sessionId) await syncSessionBookedCount(booking.sessionId);
    const sess = booking.sessionId ? await CounsellingSession.findById(booking.sessionId) : null;
    sendCounsellingConfirmEmail(booking, sess);
    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/bookings/:id', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const booking = await CounsellingBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const allowed = ['status', 'attended', 'convertedToAdmission', 'convertedCourse', 'adminNote'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) booking[key] = req.body[key];
    });

    if (req.body.attended === true) booking.status = 'attended';
    if (req.body.attended === false && booking.status === 'attended') booking.status = 'confirmed';
    if (req.body.status === 'no_show') {
      booking.attended = false;
      booking.status = 'no_show';
    }
    if (req.body.status === 'cancelled' || req.body.status === 'refunded') {
      if (req.body.status === 'refunded') booking.paymentStatus = 'refunded';
    }

    const becameCancelled = ['cancelled', 'refunded'].includes(booking.status);
    await booking.save();
    if (becameCancelled && booking.slotId) {
      await CounsellingSlot.findByIdAndUpdate(booking.slotId, { status: 'open', $unset: { bookingId: 1, heldUntil: 1 } });
    }
    if (booking.sessionId) await syncSessionBookedCount(booking.sessionId);
    if (becameCancelled) {
      const sess = booking.sessionId ? await CounsellingSession.findById(booking.sessionId) : null;
      sendCounsellingCancelEmail(booking, sess);
      if (booking.sessionId) offerWaitlistSeat(booking.sessionId);
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/public/waitlist', async (req, res) => {
  try {
    const { sessionId, name, phone, email, city } = req.body;
    if (!sessionId || !name || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Name, phone, email and session are required' });
    }
    const session = await CounsellingSession.findById(sessionId);
    if (!session || session.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Session not available' });
    }
    const occupied = await countOccupiedSeats(session._id);
    if (occupied < (session.seats || 0)) {
      return res.status(400).json({ success: false, message: 'Seats are still available — book instead of waitlisting' });
    }
    const phoneNorm = normalizePhone(phone);
    const emailNorm = email.trim().toLowerCase();
    const existing = await CounsellingWaitlist.findOne({
      sessionId,
      email: emailNorm,
      status: { $in: ['waiting', 'offered'] },
    });
    if (existing) return res.json({ success: true, waitlist: existing, message: 'Already on the waitlist' });
    const entry = await CounsellingWaitlist.create({
      sessionId, name: name.trim(), phone: phoneNorm, email: emailNorm, city: city || '',
    });
    res.status(201).json({ success: true, waitlist: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/counsellors', protect, superAdminOnly, async (req, res) => {
  try {
    const counsellors = await User.find({ role: 'counsellor' }).select('name email phone isActive lastLogin createdAt').sort({ name: 1 });
    const [serviceCounts, sessionCounts] = await Promise.all([
      CounsellingService.aggregate([{ $match: { counsellorId: { $ne: null } } }, { $group: { _id: '$counsellorId', count: { $sum: 1 } } }]),
      CounsellingSession.aggregate([{ $match: { counsellorId: { $ne: null } } }, { $group: { _id: '$counsellorId', count: { $sum: 1 } } }]),
    ]);
    const svcMap = Object.fromEntries(serviceCounts.map((c) => [String(c._id), c.count]));
    const sesMap = Object.fromEntries(sessionCounts.map((c) => [String(c._id), c.count]));
    res.json({
      success: true,
      counsellors: counsellors.map((c) => ({
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        lastLogin: c.lastLogin,
        createdAt: c.createdAt,
        serviceCount: svcMap[String(c._id)] || 0,
        sessionCount: sesMap[String(c._id)] || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/counsellors', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password,
      role: 'counsellor',
      isActive: true,
      assignedRoleName: 'Counsellor',
    });
    res.status(201).json({ success: true, counsellor: { _id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/counsellors/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'counsellor' });
    if (!user) return res.status(404).json({ success: false, message: 'Counsellor not found' });
    const { name, email, phone, isActive, password } = req.body;
    if (email && email.toLowerCase().trim() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase().trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
      user.email = email.toLowerCase().trim();
    }
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = !!isActive;
    if (password) user.password = password;
    await user.save();
    res.json({ success: true, counsellor: { _id: user._id, name: user.name, email: user.email, phone: user.phone, isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/counsellors/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'counsellor' });
    if (!user) return res.status(404).json({ success: false, message: 'Counsellor not found' });
    await Promise.all([
      CounsellingService.updateMany({ counsellorId: user._id }, { $unset: { counsellorId: 1 } }),
      CounsellingSession.updateMany({ counsellorId: user._id }, { $unset: { counsellorId: 1 } }),
      CounsellingSlot.deleteMany({ counsellorId: user._id, status: 'open' }),
    ]);
    await user.deleteOne();
    res.json({ success: true, message: 'Counsellor deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sessions/:id/copy', protect, superAdminOnly, async (req, res) => {
  try {
    const source = await CounsellingSession.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Session not found' });
    const weeks = Math.min(12, Math.max(1, Number(req.body.weeks) || 1));
    const created = [];
    for (let i = 1; i <= weeks; i += 1) {
      const nextDate = new Date(source.date);
      nextDate.setDate(nextDate.getDate() + (7 * i));
      const copy = await CounsellingSession.create({
        title: source.title,
        topic: source.topic,
        description: source.description,
        date: nextDate,
        startTime: source.startTime,
        endTime: source.endTime,
        duration: source.duration,
        mode: source.mode,
        meetingLink: source.meetingLink,
        venue: source.venue,
        seats: source.seats,
        bookedCount: 0,
        fee: source.fee,
        originalFee: source.originalFee,
        language: source.language,
        counsellorName: source.counsellorName,
        counsellorId: source.counsellorId,
        targetAudience: source.targetAudience,
        interestArea: source.interestArea,
        status: req.body.status || 'published',
        showOnWebsite: source.showOnWebsite,
      });
      created.push(copy);
    }
    res.status(201).json({ success: true, count: created.length, sessions: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/slots', protect, counsellorOrAdmin, async (req, res) => {
  try {
    await releaseExpiredSlotHolds();
    const filter = {};
    if (req.query.serviceId) filter.serviceId = req.query.serviceId;
    if (req.user.role === 'counsellor') filter.counsellorId = req.user._id;
    const slots = await CounsellingSlot.find(filter).sort({ startAt: 1 }).populate('serviceId', 'name');
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/slots', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const { serviceId, startAt, endAt, counsellorId } = req.body;
    if (!serviceId || !startAt) return res.status(400).json({ success: false, message: 'Service and start time required' });
    const assigned = req.user.role === 'counsellor' ? req.user._id : (counsellorId || undefined);
    const slot = await CounsellingSlot.create({
      serviceId,
      counsellorId: assigned,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      status: 'open',
    });
    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/slots/:id', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const slot = await CounsellingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (req.user.role === 'counsellor' && slot.counsellorId && String(slot.counsellorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not your slot' });
    }
    if (slot.status === 'booked') return res.status(400).json({ success: false, message: 'Cannot delete a booked slot' });
    await slot.deleteOne();
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/waitlist', protect, superAdminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.sessionId) filter.sessionId = req.query.sessionId;
    const entries = await CounsellingWaitlist.find(filter).populate('sessionId', 'title date').sort({ createdAt: 1 });
    res.json({ success: true, waitlist: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sessions/:id/recording', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const session = await CounsellingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (req.user.role === 'counsellor' && session.counsellorId && String(session.counsellorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not assigned to this session' });
    }
    session.recordingUrl = req.body.recordingUrl || '';
    await session.save();
    const paid = await CounsellingBooking.find({
      sessionId: session._id,
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'attended'] },
    });
    paid.forEach((b) => sendRecordingEmail(b, session));
    session.recordingEmailedAt = new Date();
    await session.save();
    res.json({ success: true, session, emailed: paid.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bookings/:id/resend-join', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const booking = await CounsellingBooking.findById(req.params.id);
    if (!booking || booking.paymentStatus !== 'paid') {
      return res.status(404).json({ success: false, message: 'Paid booking not found' });
    }
    const session = booking.sessionId ? await CounsellingSession.findById(booking.sessionId) : null;
    await sendJoinLinkEmail(booking, session);
    res.json({ success: true, message: 'Join details emailed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/sessions/:id/meeting-link', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const session = await CounsellingSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (req.user.role === 'counsellor' && session.counsellorId && String(session.counsellorId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not your assigned session' });
    }
    if (req.body.meetingLink !== undefined) session.meetingLink = req.body.meetingLink;
    if (req.body.mode !== undefined) session.mode = req.body.mode;
    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/portal/mine', protect, counsellorOrAdmin, async (req, res) => {
  try {
    const isAdmin = ['super_admin', 'admin', 'staff'].includes(req.user.role);
    const uid = req.user._id;
    const sessionFilter = isAdmin ? {} : { counsellorId: uid };
    const serviceFilter = isAdmin
      ? {}
      : { $or: [{ counsellorId: uid }, { counsellorId: { $exists: false } }, { counsellorId: null }] };

    const sessions = await CounsellingSession.find(sessionFilter).sort({ date: 1 });
    const services = await CounsellingService.find(serviceFilter).sort({ displayOrder: 1, name: 1 });
    const sessionIds = sessions.map((s) => s._id);
    const serviceIds = services.map((s) => s._id);

    const counsellorSlots = await CounsellingSlot.find(isAdmin ? {} : { counsellorId: uid })
      .populate('serviceId', 'name duration mode price')
      .sort({ startAt: 1 });
    const slotIds = counsellorSlots.map((s) => s._id);

    const bookingFilter = isAdmin
      ? { paymentStatus: 'paid' }
      : {
          paymentStatus: 'paid',
          $or: [
            { sessionId: { $in: sessionIds } },
            { serviceId: { $in: serviceIds } },
            { slotId: { $in: slotIds } },
          ],
        };

    const bookings = await CounsellingBooking.find(bookingFilter)
      .populate('slotId')
      .populate('sessionId')
      .populate('serviceId', 'name duration mode price')
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({ success: true, sessions, services, bookings, slots: counsellorSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
