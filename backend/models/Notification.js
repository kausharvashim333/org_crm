const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['broadcast', 'individual', 'project', 'fee', 'certificate', 'system'],
    default: 'broadcast',
  },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
