const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['teacher', 'counselor', 'admin_staff', 'accountant', 'other'],
    default: 'teacher',
  },
  qualification: { type: String },
  subjects: [{ type: String }],
  courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  photo: { type: String },
  address: { type: String },
  joiningDate: { type: Date, default: Date.now },
  leavingDate: { type: Date },
  salary: { type: Number, default: 0 },
  salaryStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  experience: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
