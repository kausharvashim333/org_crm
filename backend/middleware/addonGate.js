const PartnerAddon = require('../models/PartnerAddon');
const Addon = require('../models/Addon');

/**
 * Middleware to check if partner has an active add-on.
 * Usage: router.get('/', protect, partnerOrAdmin, requireAddon('exam_system'), ...)
 * Super admin always passes. Partners must have active add-on.
 */
module.exports = function requireAddon(addonKey) {
  return async (req, res, next) => {
    try {
      // Super admin and admin always have access
      if (['super_admin', 'admin'].includes(req.user?.role)) {
        return next();
      }

      // Staff inherits from partner — check partner's add-ons
      const partnerId = req.user?.partnerId;
      if (!partnerId) {
        return res.status(403).json({
          success: false,
          message: 'This feature requires an active add-on subscription. Please visit the Add-on Store to purchase.',
          addonRequired: addonKey,
        });
      }

      // Check if add-on is default (included for all)
      const addon = await Addon.findOne({ key: addonKey });
      if (!addon) {
        return res.status(403).json({
          success: false,
          message: 'This feature is not available.',
          addonRequired: addonKey,
        });
      }
      if (addon.isDefault) {
        return next();
      }

      // Check if partner has active subscription
      const pa = await PartnerAddon.findOne({
        partnerId,
        addonKey,
        status: 'active',
      });

      if (!pa) {
        return res.status(403).json({
          success: false,
          message: 'This feature requires an active add-on subscription. Please visit the Add-on Store to purchase.',
          addonRequired: addonKey,
        });
      }

      // Check expiry
      if (pa.expiresAt && pa.expiresAt < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Your add-on subscription has expired. Please renew in the Add-on Store.',
          addonRequired: addonKey,
          expired: true,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
