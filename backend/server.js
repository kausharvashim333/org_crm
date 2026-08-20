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

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Allows inline images/favicons
}));

// NoSQL Injection Sanitization
app.use(mongoSanitize());

// Rate Limiting for Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login attempts per window
  message: { success: false, message: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin === process.env.CLIENT_URL
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow dev traffic
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Franchise CRM API is running' });
});

// Auth Routes with Rate Limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth'));

// Module Routes
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

// Centralized Error Handler
app.use((err, req, res, next) => {
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
