const path = require('path');
const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Student = require('../models/Student');
const OrgHomepage = require('../models/OrgHomepage');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const isMatch = await user.matchPassword(cleanPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }
    if (role && user.role !== role) {
      const isSuperAdminRole = user.role === 'super_admin' && (role === 'super_admin' || role === 'admin');
      if (!isSuperAdminRole) {
        return res.status(401).json({ success: false, message: `This account does not have ${role} permissions` });
      }
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id);
    let partner = null;
    if (user.partnerId) {
      partner = await Partner.findById(user.partnerId);
    }
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        partnerId: user.partnerId,
        isFirstLogin: user.isFirstLogin,
        lastPasswordChangedAt: user.lastPasswordChangedAt,
        partner,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    let partner = null;
    if (req.user.partnerId) {
      partner = await Partner.findById(req.user.partnerId);
    }
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        avatar: req.user.avatar,
        partnerId: req.user.partnerId,
        isFirstLogin: req.user.isFirstLogin,
        lastPasswordChangedAt: req.user.lastPasswordChangedAt,
        partner,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    user.isFirstLogin = false;
    user.lastPasswordChangedAt = new Date();
    await user.save();
    res.json({
      success: true,
      message: 'Password changed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: false,
        lastPasswordChangedAt: user.lastPasswordChangedAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password Route - Generates Reset Code / Token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a valid registered email address' });
    }

    const query = { email: email.toLowerCase().trim() };
    if (role) query.role = role;

    let user = await User.findOne(query);

    // If role specified but not matched, fallback to finding by email
    if (!user && role) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email address' });
    }

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: 'Your account is currently inactive. Please contact system admin.' });
    }

    // Generate a user-friendly 6-digit verification code & token
    const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    await user.save();

    // Prepare Email Content with Organization Branding
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const orgHp = await OrgHomepage.findOne().lean();
    const orgName = orgHp?.settings?.orgName || 'Lili Organization';
    const themeColor = orgHp?.settings?.themeColor || '#002e7a';
    const logoPath = orgHp?.settings?.logo;
    
    const attachments = [];
    let logoCid = '';
    if (logoPath) {
      const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
      const absLogoPath = path.join(__dirname, '..', cleanPath);
      if (fs.existsSync(absLogoPath)) {
        attachments.push({
          filename: 'logo.jpeg',
          path: absLogoPath,
          cid: 'orglogo@auth',
        });
        logoCid = 'cid:orglogo@auth';
      }
    }

    const emailSubject = `🔐 Password Reset Verification Code - ${orgName}`;
    const emailMessage = `Hello ${user.name},\n\nYour 6-digit verification code to reset your password is: ${rawToken}\n\nThis code will expire in 60 minutes.\nIf you did not request a password reset, please ignore this email.\n\nRegards,\n${orgName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, ${themeColor} 0%, #1e1b4b 100%); padding: 28px 24px; text-align: center;">
                    ${logoCid ? `
                      <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                        <tr>
                          <td style="background-color: #ffffff; padding: 5px; border-radius: 12px;">
                            <img src="${logoCid}" alt="${orgName}" width="50" height="50" style="display: block; border-radius: 8px; object-fit: contain;" />
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                    <h3 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 800;">${orgName}</h3>
                    <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Account Security & Verification</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 28px 24px;">
                    <p style="color: #0f172a; font-size: 15px; margin: 0 0 12px;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">
                      We received a request to reset your password. Use the 6-digit verification code below to complete your password reset:
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                      <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: ${themeColor}; font-family: monospace;">${rawToken}</span>
                    </div>
                    
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                      ⏱️ This verification code is valid for <strong>60 minutes</strong>. If you did not initiate this request, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">${orgName} · Automated Security Alert</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Dispatch verification email to user's registered email
    await sendEmail({
      email: user.email,
      subject: emailSubject,
      message: emailMessage,
      html: emailHtml,
      attachments,
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to your registered email (${user.email}).`,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password Route - Verifies Reset Code and Updates Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide reset code and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const hashedToken = crypto.createHash('sha256').update(token.toString().trim()).digest('hex');

    let user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    // Fallback search by raw token
    if (!user) {
      user = await User.findOne({
        resetPasswordToken: token.toString().trim(),
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code. Please request a new code.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.isFirstLogin = false;
    user.lastPasswordChangedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Google OAuth Login Route
router.post('/google-login', async (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, role } = req.body;
    let email = directEmail;
    let name = directName;

    if (credential) {
      try {
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.email) {
            email = googleData.email;
            name = googleData.name || name;
          }
        }
      } catch (gErr) {
        console.error('Google token verification error:', gErr);
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google authentication failed. No valid email received.' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // If User account is missing, check if a Partner or Student record exists with this email and auto-provision User login
    if (!user) {
      const partner = await Partner.findOne({ email: email.toLowerCase().trim() });
      if (partner) {
        user = await User.create({
          name: partner.ownerName || partner.instituteName || name || 'Partner',
          email: partner.email.toLowerCase().trim(),
          password: Math.random().toString(36).slice(-10) + 'Aa1!',
          phone: partner.phone || '0000000000',
          role: 'partner',
          partnerId: partner._id,
          isActive: partner.status === 'active' || true,
        });
      } else {
        const student = await Student.findOne({ email: email.toLowerCase().trim() });
        if (student) {
          user = await User.create({
            name: student.fullName || name || 'Student',
            email: student.email.toLowerCase().trim(),
            password: Math.random().toString(36).slice(-10) + 'Aa1!',
            phone: student.phone || '0000000000',
            role: 'student',
            partnerId: student.partnerId,
            isActive: student.status === 'active' || true,
          });
        }
      }
    }

    if (!user) {
      const roleLabel = role === 'student' ? 'student' : 'partner';
      return res.status(404).json({
        success: false,
        message: `No registered ${roleLabel} account found for this Google email (${email}). Please contact center administration to get registered.`
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account is deactivated. Contact administrator.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    let partner = null;
    if (user.partnerId) {
      partner = await Partner.findById(user.partnerId);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        partnerId: user.partnerId,
        isFirstLogin: user.isFirstLogin,
        lastPasswordChangedAt: user.lastPasswordChangedAt,
        partner,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

