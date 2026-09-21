const sendEmail = require('./sendEmail');
const CounsellingBooking = require('../models/CounsellingBooking');
const CounsellingSession = require('../models/CounsellingSession');

const clientBase = () => (process.env.CLIENT_URL || 'https://liliorg.in').replace(/\/$/, '');

const sessionStartsAt = (session) => {
  if (!session?.date) return null;
  const d = new Date(session.date);
  if (Number.isNaN(d.getTime())) return null;
  const [h, m] = String(session.startTime || '10:00').split(':');
  d.setHours(parseInt(h, 10) || 10, parseInt(m, 10) || 0, 0, 0);
  return d;
};

const formatWhen = (session) => {
  if (!session?.date) return '';
  const d = new Date(session.date);
  const dateStr = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return [dateStr, session.startTime && session.endTime ? `${session.startTime}–${session.endTime}` : session.startTime].filter(Boolean).join(' · ');
};

const wrapHtml = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <h2 style="color:#1e3a8a">${title}</h2>
    ${body}
    <p style="font-size:12px;color:#64748b;margin-top:24px">
      Counselling fee is non-refundable and not adjustable against course or admission fees.
    </p>
  </div>
`;

const sendIfEmail = async (booking, { subject, text, html, flag }) => {
  const email = (booking.email || '').trim();
  if (!email) return;
  if (flag && booking[flag]) return;
  await sendEmail({ email, subject, message: text, html });
  if (flag) {
    booking[flag] = true;
    await booking.save();
  }
};

exports.sendCounsellingConfirmEmail = async (booking, session) => {
  try {
    const receiptUrl = `${clientBase()}/counselling/receipt/${booking.bookingCode}`;
    const when = formatWhen(session);
    const meeting = session?.meetingLink && booking.paymentStatus === 'paid' ? session.meetingLink : '';
    const subject = `Counselling booked: ${booking.bookingCode}`;
    const text = [
      `Hi ${booking.name},`,
      `Your counselling booking ${booking.bookingCode} is confirmed.`,
      `Session: ${booking.itemTitle}`,
      when ? `When: ${when}` : '',
      `Amount paid: ₹${booking.amount}`,
      meeting ? `Join link: ${meeting}` : 'We will email the meeting / venue details before the session.',
      `Receipt: ${receiptUrl}`,
    ].filter(Boolean).join('\n');
    const html = wrapHtml('Booking confirmed', `
      <p>Hi ${booking.name},</p>
      <p>Your counselling booking <strong>${booking.bookingCode}</strong> is confirmed.</p>
      <p><strong>${booking.itemTitle}</strong>${when ? `<br/>${when}` : ''}</p>
      <p>Amount paid: <strong>₹${booking.amount}</strong></p>
      ${meeting ? `<p>Join / venue: <a href="${meeting}">${meeting}</a></p>` : '<p>Meeting or venue details will be shared on email before the session.</p>'}
      <p><a href="${receiptUrl}">View receipt</a></p>
    `);
    await sendIfEmail(booking, { subject, text, html, flag: 'emailConfirmSent' });
  } catch (err) {
    console.error('[Counselling confirm email]', err.message);
  }
};

exports.sendCounsellingCancelEmail = async (booking, session) => {
  try {
    const when = formatWhen(session);
    const subject = `Counselling cancelled: ${booking.bookingCode}`;
    const text = `Hi ${booking.name}, your counselling booking ${booking.bookingCode} (${booking.itemTitle}${when ? `, ${when}` : ''}) has been cancelled. If you were charged, our team will contact you about a refund.`;
    const html = wrapHtml('Booking cancelled', `<p>Hi ${booking.name},</p><p>${text}</p>`);
    await sendIfEmail(booking, { subject, text, html, flag: 'emailCancelSent' });
  } catch (err) {
    console.error('[Counselling cancel email]', err.message);
  }
};

exports.sendCounsellingReminderEmail = async (booking, session, kind) => {
  try {
    const flag = kind === 'hour' ? 'reminderHourSent' : 'reminderDaySent';
    const when = formatWhen(session);
    const meeting = session?.meetingLink ? session.meetingLink : '';
    const subject = kind === 'hour'
      ? `Starting soon: ${booking.itemTitle}`
      : `Reminder: counselling tomorrow — ${booking.bookingCode}`;
    const lead = kind === 'hour' ? 'Your counselling session starts in about an hour.' : 'This is a reminder for your counselling session.';
    const text = [
      `Hi ${booking.name},`,
      lead,
      `${booking.itemTitle}${when ? ` · ${when}` : ''}`,
      meeting ? `Join: ${meeting}` : '',
      `Booking ${booking.bookingCode}`,
    ].filter(Boolean).join('\n');
    const html = wrapHtml(kind === 'hour' ? 'Session starting soon' : 'Counselling reminder', `
      <p>Hi ${booking.name},</p>
      <p>${lead}</p>
      <p><strong>${booking.itemTitle}</strong>${when ? `<br/>${when}` : ''}</p>
      ${meeting ? `<p>Join: <a href="${meeting}">${meeting}</a></p>` : ''}
      <p>Booking code: ${booking.bookingCode}</p>
    `);
    await sendIfEmail(booking, { subject, text, html, flag });
  } catch (err) {
    console.error('[Counselling reminder email]', err.message);
  }
};

exports.sendWaitlistOfferEmail = async ({ name, email, session, offerExpiresAt }) => {
  try {
    if (!email) return;
    const bookUrl = `${clientBase()}/counselling`;
    const when = formatWhen(session);
    const until = offerExpiresAt ? new Date(offerExpiresAt).toLocaleString('en-IN') : '24 hours';
    await sendEmail({
      email,
      subject: `A seat opened: ${session.title}`,
      message: `Hi ${name}, a seat opened for ${session.title}${when ? ` (${when})` : ''}. Book within ${until}: ${bookUrl}`,
      html: wrapHtml('A counselling seat opened', `
        <p>Hi ${name},</p>
        <p>A seat opened for <strong>${session.title}</strong>${when ? `<br/>${when}` : ''}.</p>
        <p>Please book and pay on the website within 24 hours (${until}).</p>
        <p><a href="${bookUrl}">Book now</a></p>
      `),
    });
  } catch (err) {
    console.error('[Waitlist offer email]', err.message);
  }
};

exports.sendRecordingEmail = async (booking, session) => {
  try {
    if (!booking.email || !session?.recordingUrl) return;
    await sendEmail({
      email: booking.email,
      subject: `Recording: ${booking.itemTitle}`,
      message: `Hi ${booking.name}, the recording for ${booking.itemTitle} is ready: ${session.recordingUrl}`,
      html: wrapHtml('Session recording', `
        <p>Hi ${booking.name},</p>
        <p>Recording for <strong>${booking.itemTitle}</strong> is ready.</p>
        <p><a href="${session.recordingUrl}">Watch recording</a></p>
        <p>Booking: ${booking.bookingCode}</p>
      `),
    });
  } catch (err) {
    console.error('[Recording email]', err.message);
  }
};

exports.sendJoinLinkEmail = async (booking, session) => {
  try {
    if (!booking.email) return;
    const meeting = session?.meetingLink || session?.venue || '';
    const when = formatWhen(session);
    await sendEmail({
      email: booking.email,
      subject: `Join details: ${booking.bookingCode}`,
      message: `Hi ${booking.name}, join ${booking.itemTitle}${when ? ` (${when})` : ''}. ${meeting || 'Details will follow.'}`,
      html: wrapHtml('Join your counselling session', `
        <p>Hi ${booking.name},</p>
        <p><strong>${booking.itemTitle}</strong>${when ? `<br/>${when}` : ''}</p>
        ${meeting ? `<p>Join / venue: <a href="${meeting}">${meeting}</a></p>` : '<p>Join details will be shared shortly.</p>'}
        <p>Booking: ${booking.bookingCode}</p>
      `),
    });
  } catch (err) {
    console.error('[Join link email]', err.message);
  }
};

exports.sendGroupSessionScheduleEmail = async ({ booking, service, date, startTime, endTime, meetingLink }) => {
  try {
    const receiptUrl = `${clientBase()}/counselling/receipt/${booking.bookingCode}`;
    const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const timeStr = startTime && endTime ? `${startTime} – ${endTime}` : (startTime || '');
    const scheduleStr = [dateStr, timeStr].filter(Boolean).join(' · ');
    const subject = `Date & Time Confirmed: ${service.name} Group Session (${booking.bookingCode})`;

    const text = [
      `Hi ${booking.name},`,
      `The organization has scheduled your group session: ${service.name}.`,
      scheduleStr ? `Date & Time: ${scheduleStr}` : '',
      meetingLink ? `Meeting Link: ${meetingLink}` : 'Meeting link will be shared shortly before the session.',
      `Booking Code: ${booking.bookingCode}`,
      `Receipt: ${receiptUrl}`,
    ].filter(Boolean).join('\n');

    const html = wrapHtml('Group Session Schedule Confirmed', `
      <p>Hi <strong>${booking.name}</strong>,</p>
      <p>The organization has fixed and confirmed the schedule for your group session:</p>
      <div style="background:#f1f5f9;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:8px;margin:16px 0;">
        <h3 style="margin:0 0 8px 0;color:#1e1b4b;font-size:16px;">${service.name}</h3>
        ${scheduleStr ? `<p style="margin:4px 0;color:#334155;font-size:14px;"><strong>📅 Date & Time:</strong> ${scheduleStr}</p>` : ''}
        ${service.groupSessionDuration ? `<p style="margin:4px 0;color:#334155;font-size:13px;"><strong>⏱ Duration:</strong> ${service.groupSessionDuration}</p>` : ''}
      </div>
      ${meetingLink ? `
        <div style="margin:20px 0;">
          <a href="${meetingLink}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;font-size:13px;">Join Group Session</a>
          <p style="margin-top:8px;font-size:12px;color:#64748b;">Or direct link: <a href="${meetingLink}">${meetingLink}</a></p>
        </div>
      ` : '<p style="color:#64748b;font-size:13px;">The meeting join link will be emailed and messaged to you prior to the session.</p>'}
      <p style="font-size:12px;color:#64748b;margin-top:16px;">
        Booking Reference: <strong>${booking.bookingCode}</strong> · <a href="${receiptUrl}">View Receipt</a>
      </p>
    `);

    await sendEmail({ email: booking.email, subject, message: text, html });
  } catch (err) {
    console.error('[Group session schedule email error]:', err.message);
  }
};

exports.runCounsellingReminders = async () => {
  const now = Date.now();
  const bookings = await CounsellingBooking.find({
    paymentStatus: 'paid',
    status: { $in: ['confirmed', 'attended'] },
    type: 'group',
    sessionId: { $ne: null },
    email: { $exists: true, $nin: ['', null] },
    $or: [{ reminderDaySent: { $ne: true } }, { reminderHourSent: { $ne: true } }],
  }).limit(200);

  for (const booking of bookings) {
    const session = await CounsellingSession.findById(booking.sessionId);
    if (!session || session.status === 'cancelled') continue;
    const start = sessionStartsAt(session);
    if (!start) continue;
    const diff = start.getTime() - now;
    if (diff <= 0) continue;
    if (!booking.reminderDaySent && diff <= 26 * 60 * 60 * 1000 && diff >= 20 * 60 * 60 * 1000) {
      await exports.sendCounsellingReminderEmail(booking, session, 'day');
    }
    if (!booking.reminderHourSent && diff <= 90 * 60 * 1000 && diff >= 40 * 60 * 1000) {
      await exports.sendCounsellingReminderEmail(booking, session, 'hour');
    }
  }
};
