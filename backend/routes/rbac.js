const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Partner = require('../models/Partner');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect, superAdminOnly } = require('../middleware/auth');

// --- ROLES & PERMISSIONS ---

// Get all roles
router.get('/roles', protect, superAdminOnly, async (req, res) => {
  try {
    let roles = await Role.find().sort({ createdAt: -1 });
    if (roles.length === 0) {
      // Seed default system roles
      const defaultSuperAdmin = await Role.create({
        name: 'Super Admin',
        description: 'Full system access across all modules',
        isSystem: true,
        permissions: {
          dashboard: { view: true },
          partners: { view: true, create: true, edit: true, delete: true, approve: true },
          students: { view: true, create: true, edit: true, delete: true },
          courses: { view: true, create: true, edit: true, delete: true, approve: true },
          certificates: { view: true, approve: true, delete: true },
          royalty: { view: true, generate: true, pay: true },
          website: { view: true, edit: true },
          inquiries: { view: true, edit: true, delete: true },
          projects: { view: true, create: true, assign: true, approve: true },
          settings: { view: true, edit: true },
          security: { view: true, export: true },
        },
      });
      const defaultManager = await Role.create({
        name: 'Accounts Manager',
        description: 'Manages franchisee royalties, payments, and fees',
        isSystem: false,
        permissions: {
          dashboard: { view: true },
          partners: { view: true, create: false, edit: false, delete: false, approve: false },
          royalty: { view: true, generate: true, pay: true },
          inquiries: { view: true, edit: true, delete: false },
          security: { view: true, export: false },
        },
      });
      roles = [defaultSuperAdmin, defaultManager];
    }
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create role
router.post('/roles', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Role with this name already exists' });
    }
    const role = await Role.create({ name, description, permissions });
    
    // Log action
    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'RBAC',
      action: 'Create Role',
      details: `Created custom role: ${name}`,
    });

    res.status(201).json({ success: true, role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update role
router.put('/roles/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'RBAC',
      action: 'Update Role',
      details: `Updated role permissions for: ${role.name}`,
    });

    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete role
router.delete('/roles/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'System default roles cannot be deleted' });
    }
    await role.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'RBAC',
      action: 'Delete Role',
      details: `Deleted role: ${role.name}`,
    });

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SUB-ADMIN STAFF MANAGEMENT ---

// Get all admin staff users
router.get('/staff-users', protect, superAdminOnly, async (req, res) => {
  try {
    const staffUsers = await User.find({ role: 'super_admin' })
      .populate('roleId', 'name description permissions')
      .sort({ createdAt: -1 });
    res.json({ success: true, staffUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create admin staff user
router.post('/staff-users', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, roleId, roleName } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'super_admin',
      roleId: roleId || undefined,
      assignedRoleName: roleName || 'Super Admin',
    });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'SubAdmin',
      action: 'Create Staff',
      details: `Created new admin staff user: ${email} with assigned role: ${roleName || 'Super Admin'}`,
    });

    res.status(201).json({ success: true, staffUser: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update admin staff user
router.put('/staff-users/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { name, phone, roleId, roleName, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });
    if (user.role !== 'super_admin') return res.status(400).json({ success: false, message: 'Can only edit admin staff users' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (roleId !== undefined) { user.roleId = roleId || undefined; user.assignedRoleName = roleName || 'Super Admin'; }
    if (isActive !== undefined) user.isActive = isActive;
    if (password && password.length >= 6) user.password = password;

    await user.save();

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'SubAdmin',
      action: 'Update Staff',
      details: `Updated admin staff user: ${user.email}`,
    });

    res.json({ success: true, staffUser: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete admin staff user
router.delete('/staff-users/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff user not found' });
    if (user.email === req.user.email) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    if (user.role !== 'super_admin') return res.status(400).json({ success: false, message: 'Can only delete admin staff users' });

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'SubAdmin',
      action: 'Delete Staff',
      details: `Deleted admin staff user: ${user.email}`,
    });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Staff user deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AUDIT LOGS ---

// Get audit logs
router.get('/audit-logs', protect, superAdminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SECURITY & DATABASE BACKUP EXPORT ---

// Export system backup summary
router.get('/security/export', protect, superAdminOnly, async (req, res) => {
  try {
    const partnersCount = await Partner.countDocuments();
    const studentsCount = await Student.countDocuments();
    const coursesCount = await Course.countDocuments();

    const backupMeta = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      systemSummary: {
        totalPartners: partnersCount,
        totalStudents: studentsCount,
        totalCourses: coursesCount,
        status: 'Healthy',
      },
    };

    await AuditLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      role: req.user.role,
      module: 'Security',
      action: 'Database Backup Export',
      details: 'Exported system security & summary backup',
    });

    res.json({ success: true, backupMeta });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
