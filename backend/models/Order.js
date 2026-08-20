const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  invoiceNumber: {
    type: String,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
  },
  
  // Customer Details
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerCity: { type: String },
  customerState: { type: String },
  
  // Learning Mode
  learningMode: {
    type: String,
    enum: ['online', 'hybrid_offline_lab'],
    default: 'online',
  },
  preferredFranchiseCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
  },

  // Pricing & Coupon
  originalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  couponCode: { type: String },

  // Payment Details
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'upi_qr', 'mock_gateway', 'direct_transfer'],
    default: 'mock_gateway',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: { type: String },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  paidAt: { type: Date },

  // Notes
  notes: { type: String },
}, { timestamps: true });

// Auto generate Order & Invoice numbers before saving if new
orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.invoiceNumber = `INV-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
