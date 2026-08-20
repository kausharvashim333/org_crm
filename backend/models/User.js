const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String },
  role: {
    type: String,
    enum: ['super_admin', 'partner', 'staff', 'student'],
    required: true,
  },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  isActive: { type: Boolean, default: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  assignedRoleName: { type: String, default: 'Super Admin' },
  avatar: { type: String },
  lastLogin: { type: Date },
  isFirstLogin: { type: Boolean, default: true },
  lastPasswordChangedAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  try {
    return await bcrypt.compare(String(enteredPassword), String(this.password));
  } catch (err) {
    console.error('Password compare error:', err.message);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
