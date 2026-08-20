const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const fs = require('fs');
dotenv.config();

process.on('uncaughtException', (err) => {
  fs.appendFileSync(path.join(__dirname, 'out.log'), `[UNCAUGHT EXCEPTION] ${err.stack || err.message}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.appendFileSync(path.join(__dirname, 'out.log'), `[UNHANDLED REJECTION] ${reason.stack || reason}\n`);
});

const app = express();

// Enable Trust Proxy for accurate client IP detection behind Nginx reverse proxy
app.set('trust proxy', 1);

// 1. Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Allows inline fonts/images
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  dnsPrefetchControl: { allow: false },
}));

// 2. NoSQL Injection Sanitization (Removes $ and . in keys)
app.use(mongoSanitize({
  replaceWith: '_',
}));

// 3. Global API Rate Limiter (DoS / Flood Protection)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 requests per 15 minutes window
  message: { success: false, message: 'Too many requests from this IP. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalApiLimiter);

// 4. Strict Rate Limiting for Auth & Sensitive Endpoints (Brute-force Protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per window
  message: { success: false, message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Strict Rate Limiting for Forgot Password / OTP (Email Bombing / Spam Protection)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 password reset requests per 15 minutes
  message: { success: false, message: 'Too many password reset requests. Please wait 15 minutes before requesting again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Public Forms Rate Limiter (Inquiries & Spam Protection)
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit to 15 inquiries per 15 minutes per IP
  message: { success: false, message: 'Too many inquiry submissions from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 7. CORS Configuration (Strict Allowed Origins Whitelist)
const allowedOrigins = [
  'https://liliorg.in',
  'https://www.liliorg.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Cross-Origin Request Blocked by Security Policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 8. Body Parser Payload Limits (Prevent Memory Exhaustion DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static uploads directory with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Franchise CRM API is running securely' });
});

// Sensitive Route Protection
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/google-login', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/inquiries/public', publicFormLimiter);

// Auth & Module Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/students', require('./routes/students'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/royalty', require('./routes/royalty'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/org-homepage', require('./routes/orgHomepage'));
app.use('/api/student-lms', require('./routes/studentLms'));
app.use('/api/rbac', require('./routes/rbac'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));

// Centralized Error Handler (Prevent Stack Trace Leakage)
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: 'Access forbidden: CORS policy violation' });
  }
  console.error('[SERVER ERROR]', err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('[DATABASE CONNECT ERROR]', err.message);
});
