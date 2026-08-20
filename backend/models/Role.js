const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  isSystem: { type: Boolean, default: false }, // System roles like super_admin, partner cannot be deleted
  permissions: {
    dashboard: { view: { type: Boolean, default: true } },
    partners: { view: { type: Boolean, default: true }, create: { type: Boolean, default: false }, edit: { type: Boolean, default: false }, delete: { type: Boolean, default: false }, approve: { type: Boolean, default: false } },
    students: { view: { type: Boolean, default: true }, create: { type: Boolean, default: false }, edit: { type: Boolean, default: false }, delete: { type: Boolean, default: false } },
    courses: { view: { type: Boolean, default: true }, create: { type: Boolean, default: false }, edit: { type: Boolean, default: false }, delete: { type: Boolean, default: false }, approve: { type: Boolean, default: false } },
    certificates: { view: { type: Boolean, default: true }, approve: { type: Boolean, default: false }, delete: { type: Boolean, default: false } },
    royalty: { view: { type: Boolean, default: true }, generate: { type: Boolean, default: false }, pay: { type: Boolean, default: false } },
    website: { view: { type: Boolean, default: true }, edit: { type: Boolean, default: false } },
    inquiries: { view: { type: Boolean, default: true }, edit: { type: Boolean, default: false }, delete: { type: Boolean, default: false } },
    projects: { view: { type: Boolean, default: true }, create: { type: Boolean, default: false }, assign: { type: Boolean, default: false }, approve: { type: Boolean, default: false } },
    settings: { view: { type: Boolean, default: true }, edit: { type: Boolean, default: false } },
    security: { view: { type: Boolean, default: true }, export: { type: Boolean, default: false } },
  },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
