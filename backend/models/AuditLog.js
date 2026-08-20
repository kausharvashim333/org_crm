const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userEmail: { type: String },
  role: { type: String },
  module: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  ipAddress: { type: String, default: '127.0.0.1' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
