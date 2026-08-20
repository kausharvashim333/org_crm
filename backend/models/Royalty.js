const mongoose = require('mongoose');

const royaltySchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  period: { type: String, required: true },
  totalRevenue: { type: Number, default: 0 },
  royaltyPercent: { type: Number, required: true },
  royaltyAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    mode: { type: String, enum: ['cash', 'upi', 'online', 'cheque', 'bank_transfer'] },
    transactionId: { type: String },
    receiptNo: { type: String },
    remarks: { type: String },
  }],
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Royalty', royaltySchema);
