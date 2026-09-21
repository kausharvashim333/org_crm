import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getOrgHomepagePublic,
  getPublicCounselling,
  createCounsellingOrder,
  verifyCounsellingPayment,
  joinCounsellingWaitlist,
} from '../../api';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  Sparkles,
  Video,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  MapPin,
  X,
  ShieldCheck,
  Zap,
  Check,
  Award,
  HelpCircle,
} from 'lucide-react';

const modeIcons = {
  video: Video,
  phone: Phone,
  whatsapp: MessageCircle,
  zoom: Video,
  meet: Video,
  hall: MapPin,
  center: MapPin,
};

const modeLabels = {
  phone: 'Phone Call',
  whatsapp: 'WhatsApp Call',
  video: 'Video Call',
  zoom: 'Zoom Meet',
  meet: 'Google Meet',
  hall: 'Institute Hall',
  center: 'Partner Center',
};

export default function OrgCounsellingPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [hp, setHp] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookFor, setBookFor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', message: '', slotId: '' });

  const loadPublic = () =>
    getPublicCounselling().then((res) => setData(res.data || { visible: false, services: [], sessions: [] }));

  useEffect(() => {
    Promise.all([
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
      getPublicCounselling().catch(() => ({ data: { visible: false, services: [], sessions: [] } })),
    ]).then(([hpRes, cRes]) => {
      setHp(hpRes.data?.homepage || {});
      setData(cRes.data || { visible: false, services: [], sessions: [] });
      setLoading(false);
    });
  }, []);

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Computer Institute';
  const settings = data?.settings || {};
  const notice =
    settings.noticeText ||
    'Counselling fee is non-refundable and not adjustable against course admission fees.';
  const whatsapp = (settings.whatsappNumber || '').replace(/\D/g, '');

  const openBook = (type, item) => {
    setBookFor({ type, item });
    setForm({ name: '', phone: '', email: '', city: '', message: '', slotId: '' });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!bookFor) return;
    if (bookFor.type === 'waitlist') {
      setSubmitting(true);
      try {
        await joinCounsellingWaitlist({
          sessionId: bookFor.item._id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city,
        });
        showSuccess('Added to waitlist. We will email you if a seat opens.');
        setBookFor(null);
      } catch (err) {
        showError(err.response?.data?.message || 'Could not join waitlist');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: bookFor.type,
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        message: form.message,
      };
      if (bookFor.type === 'group') {
        if (bookFor.item.date && !bookFor.item.groupSessionDate && sessions.some((s) => s._id === bookFor.item._id)) {
          payload.sessionId = bookFor.item._id;
        } else {
          payload.serviceId = bookFor.item._id;
        }
      } else {
        payload.serviceId = bookFor.item._id;
        if (form.slotId) payload.slotId = form.slotId;
      }

      const res = await createCounsellingOrder(payload);
      const booking = res.data.booking;

      if (res.data.freeConfirmed) {
        showSuccess('Seat booked successfully!');
        setBookFor(null);
        navigate(`/counselling/receipt/${booking.bookingCode}`);
        return;
      }

      if (!window.Razorpay || !res.data.razorpayOrderId) {
        showError('Payment gateway unavailable. Please try again later.');
        return;
      }

      const options = {
        key: res.data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round((res.data.amount || booking.amount) * 100),
        currency: 'INR',
        name: orgName,
        description: `Counselling: ${booking.itemTitle}`,
        order_id: res.data.razorpayOrderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: themeColor },
        handler: async (response) => {
          try {
            const verifyRes = await verifyCounsellingPayment({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showSuccess('Payment successful!');
            setBookFor(null);
            navigate(`/counselling/receipt/${verifyRes.data.booking.bookingCode}`);
          } catch (err) {
            showError(err.response?.data?.message || 'Payment verification failed');
            loadPublic();
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => showError('Payment failed or cancelled'));
      rzp.open();
      loadPublic();
    } catch (err) {
      showError(err.response?.data?.message || 'Could not start booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.visible) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <Navbar activePage="counselling" />
        <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Career Counselling Coming Soon</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            Paid career guidance & 1-on-1 mentorship bookings will be opened shortly.
          </p>
          <Link
            to="/"
            className="mt-6 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition"
            style={{ backgroundColor: themeColor }}
          >
            Back to Home
          </Link>
        </div>
        <Footer homepageData={hp} />
      </div>
    );
  }

  const services = data.services || [];
  const sessions = data.sessions || [];
  const groupServices = services.filter((s) => {
    return Boolean(
      s.enableGroupSession ||
      (s.groupPrice !== undefined && s.groupPrice !== null && s.groupPrice !== '')
    );
  });

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      <SEO
        title={settings.pageTitle || '1-on-1 Career Counselling & Guidance'}
        description={settings.pageSubtitle || 'Personalized career counselling and roadmap consultation'}
      />
      <Navbar activePage="counselling" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, #6366f1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            {settings.heroBadge || 'Expert Career Mentorship'}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {settings.pageTitle || '1-on-1 Career Counselling'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {settings.pageSubtitle ||
              'Clear confusion, discover the right courses, and build a high-income future with certified mentors.'}
          </p>

          {/* Trust Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Career Experts
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> 1-on-1 Private Consultation
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" /> Personalized Roadmap
            </span>
          </div>

          {notice && (
            <p className="text-[11px] text-amber-200/80 max-w-lg mx-auto pt-2 font-medium">
              ⚠️ {notice}
            </p>
          )}
        </div>
      </section>

      {/* 1-on-1 Services Section */}
      <section className="py-14 px-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Personal Guidance</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">1-on-1 Counselling Services</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a service below to schedule your private consultation session.
            </p>
          </div>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Quick Doubt on WhatsApp
            </a>
          )}
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No 1-on-1 services available right now</p>
            <p className="text-xs text-slate-500 mt-1">Please check back soon or browse our group sessions.</p>
          </div>
        ) : (
          /* Redesigned Compact, Attractive, Professional Service Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => {
              const Icon = modeIcons[s.mode] || Video;
              const hasDiscount = s.originalPrice > s.price && s.originalPrice > 0;
              const discountPercent = hasDiscount ? Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100) : 0;
              const includesList = s.includes || [];

              return (
                <div
                  key={s._id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 relative group"
                >
                    {/* Top Bar: All 3 Modes Badges & Promotional Badge */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Video className="w-2.5 h-2.5 text-indigo-600" /> Video
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" /> Phone
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                            <MessageCircle className="w-2.5 h-2.5 text-green-600" /> WhatsApp
                          </span>
                        </div>

                        {s.badge ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200">
                            {s.badge}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {s.duration || '30 min'}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </h3>
                      </div>

                      {/* Description - Neat 2-line clamp */}
                      {s.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {s.description}
                        </p>
                      )}
                    </div>

                  {/* Card Bottom: Pricing & Action Button */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">
                          ₹{s.price}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{s.originalPrice}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {discountPercent}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        1-on-1 • {s.duration || '30 min'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBook('one_on_one', s)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 hover:opacity-95 transition"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Group Sessions & Masterclasses Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Interactive Masterclasses</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Upcoming Group Webinars & Sessions</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Topic-focused live masterclasses & group guidance batches with live Q&A.
          </p>
        </div>

        {groupServices.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No group sessions scheduled at this moment</p>
            <p className="text-xs text-slate-500 mt-0.5">New group batches and live webinars will be announced soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupServices.map((s) => {
              const groupFee = s.groupPrice !== undefined && s.groupPrice !== null ? s.groupPrice : 0;
              const originalGroupFee = s.originalGroupPrice || 0;
              const hasGroupDiscount = originalGroupFee > groupFee && originalGroupFee > 0;
              const groupDiscountPercent = hasGroupDiscount
                ? Math.round(((originalGroupFee - groupFee) / originalGroupFee) * 100)
                : 0;
              const isScheduled = Boolean(s.groupSessionDate);
              const scheduleDateStr = isScheduled
                ? new Date(s.groupSessionDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : null;

              return (
                <div
                  key={`grp_${s._id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 relative group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Users className="w-2.5 h-2.5 text-indigo-600" /> Group Session
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Video className="w-2.5 h-2.5 text-emerald-600" /> Live Interactive
                        </span>
                      </div>

                      {s.badge ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-200">
                          {s.badge}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {s.groupSessionDuration || s.duration || '60 min'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h3>
                    </div>

                    {/* Schedule / Date Box */}
                    {isScheduled ? (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Batch Date: <span className="text-emerald-700 font-black">{scheduleDateStr}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {s.groupSessionStartTime || '11:00'} – {s.groupSessionEndTime || '12:30'}
                          </span>
                          {s.groupSessionDuration && <span>• {s.groupSessionDuration}</span>}
                        </div>
                        <p className="text-[10px] text-emerald-600 font-normal">
                          Live joining link will be sent to your email after booking.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Date & Time: <span className="text-indigo-600 font-bold">Organization fix karegi</span></span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Batch schedule & meeting link will be coordinated and shared via WhatsApp / Email after registration.
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    {s.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing & Booking */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">
                          {groupFee > 0 ? `₹${groupFee}` : 'FREE'}
                        </span>
                        {hasGroupDiscount && (
                          <>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{originalGroupFee}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {groupDiscountPercent}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Group Session • {s.groupSessionDuration || s.duration || '60 min'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBook('group', s)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 hover:opacity-95 transition"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book Seat <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why Book 1-on-1 Counselling - Confidence Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-sm">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Why Counselling Matters</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Avoid wrong course choices & wasted years
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Choosing the right qualification depends on your current skills, career aptitude, and market demand.
              A single 30-minute consultation gives you a clear roadmap and saves you from regret.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real Industry Insights
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Syllabus & Job Scope Comparison
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Placement Consultation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Drawer / Modal */}
      {bookFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 text-white relative" style={{ backgroundColor: themeColor }}>
              <button
                type="button"
                onClick={() => setBookFor(null)}
                className="absolute right-3 top-3 p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-bold text-base pr-8">
                {bookFor.type === 'waitlist' ? 'Join Waitlist: ' : 'Book Session: '}
                {bookFor.item.name || bookFor.item.title}
              </h3>
              <p className="text-xs opacity-90 mt-0.5 font-medium">
                {bookFor.type === 'waitlist'
                  ? 'We will notify you immediately if a seat opens.'
                  : `${
                      bookFor.type === 'group'
                        ? ((bookFor.item.groupPrice !== undefined ? bookFor.item.groupPrice : bookFor.item.fee) > 0
                            ? `₹${bookFor.item.groupPrice !== undefined ? bookFor.item.groupPrice : bookFor.item.fee}`
                            : 'FREE')
                        : `₹${bookFor.item.price}`
                    } • ${
                      bookFor.type === 'group'
                        ? (modeLabels[bookFor.item.mode] || 'Group Session')
                        : 'Video • Phone • WhatsApp'
                    }`}
              </p>
            </div>

            <form onSubmit={handlePay} className="p-5 space-y-3 text-xs">
              {bookFor.type === 'group' && (
                bookFor.item.groupSessionDate ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Scheduled Batch: {new Date(bookFor.item.groupSessionDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      ⏰ Time: {bookFor.item.groupSessionStartTime || '11:00'} – {bookFor.item.groupSessionEndTime || '12:30'} ({bookFor.item.groupSessionDuration || bookFor.item.duration || '60 min'})
                    </p>
                  </div>
                ) : (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Date & Time: Organization dwara fix ki jayegi</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Registration ke baad batch schedule aur live meeting link organization aapke WhatsApp aur Email par share karegi.
                    </p>
                  </div>
                )
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter student / candidate name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">10-Digit Mobile Phone *</label>
                <input
                  required
                  type="tel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="E.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="name@gmail.com (for join link)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">City / Location</label>
                <input
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="E.g. Patna, Delhi, Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              {bookFor.type === 'one_on_one' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Preferred Consultation Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'video', label: 'Video Call', icon: Video, color: 'text-indigo-600' },
                      { id: 'phone', label: 'Phone Call', icon: Phone, color: 'text-emerald-600' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = (form.mode || 'video') === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setForm({ ...form, mode: m.id })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bookFor.type === 'one_on_one' &&
                (data?.slots || []).filter((sl) => String(sl.serviceId?._id || sl.serviceId) === String(bookFor.item._id)).length > 0 && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Select Available Time Slot</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      value={form.slotId}
                      onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                    >
                      <option value="">Any slot (we will schedule mutually later)</option>
                      {(data.slots || [])
                        .filter((sl) => String(sl.serviceId?._id || sl.serviceId) === String(bookFor.item._id))
                        .map((sl) => (
                          <option key={sl._id} value={sl._id}>
                            {new Date(sl.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Question / Career Query (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="What course or career doubt do you want guidance on?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition"
                  style={{ backgroundColor: themeColor }}
                >
                  {submitting
                    ? 'Processing...'
                    : bookFor.type === 'group'
                    ? ((bookFor.item.groupPrice !== undefined && bookFor.item.groupPrice !== null ? bookFor.item.groupPrice : (bookFor.item.fee ?? 0)) > 0
                        ? `Pay ₹${bookFor.item.groupPrice !== undefined && bookFor.item.groupPrice !== null ? bookFor.item.groupPrice : bookFor.item.fee} Securely`
                        : 'Confirm FREE Booking')
                    : (bookFor.item.price > 0 ? `Pay ₹${bookFor.item.price} Securely` : 'Confirm FREE Booking')}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  🔒 Secured with 256-bit SSL & instant confirmation email
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer homepageData={hp} />
    </div>
  );
}
