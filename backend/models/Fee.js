const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  totalFee: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountReason: { type: String },
  installments: [{
    installmentNo: { type: Number },
    amount: { type: Number },
    dueDate: { type: Date },
    paidDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    paymentMode: { type: String, enum: ['cash', 'upi', 'online', 'cheque', 'card'] },
    transactionId: { type: String },
    receiptNo: { type: String },
  }],
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    mode: { type: String, enum: ['cash', 'upi', 'online', 'cheque', 'card'] },
    transactionId: { type: String },
    receiptNo: { type: String, required: true },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
  }],
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
