const nodemailer = require('nodemailer');

/**
 * Send Email helper function using Nodemailer
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465
    auth: {
      user: process.env.SMTP_EMAIL || process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Lili Organization'}" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'office.reg.lili@gmail.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
    attachments: options.attachments || [],
  };

  try {
    if ((process.env.SMTP_EMAIL || process.env.SMTP_USER) && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Message ID: ${info.messageId} to ${options.email}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCH SIMULATION] (SMTP Credentials Not Set in .env)`);
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text/HTML Message: ${options.message}`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('[Email Send Error]', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
