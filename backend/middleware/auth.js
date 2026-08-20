const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET || 'liliorg_production_jwt_secret_key_9876543210';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Not authorized, token expired or invalid' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    // Super admin has universal access, plus check specified roles (supporting aliases)
    const isAllowed =
      userRole === 'super_admin' ||
      roles.includes(userRole) ||
      (roles.includes('superadmin') && userRole === 'super_admin') ||
      (roles.includes('super_admin') && userRole === 'superadmin') ||
      (roles.includes('admin') && ['super_admin', 'admin', 'staff'].includes(userRole));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

exports.superAdminOnly = (req, res, next) => {
  if (!['super_admin', 'admin', 'staff'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Super Admin access required' });
  }
  next();
};

exports.partnerOrAdmin = (req, res, next) => {
  if (!['super_admin', 'admin', 'staff', 'partner'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Partner or Admin access required' });
  }
  next();
};
