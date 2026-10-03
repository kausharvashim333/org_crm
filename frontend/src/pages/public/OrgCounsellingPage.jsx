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
  Crown,
  Gift,
  Layers,
  ArrowUpRight,
  Filter,
  ChevronRight,
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
  
  // Segment Switcher: 'free' (default) | 'paid' | 'all'
  const [counsellingSegment, setCounsellingSegment] = useState('free');
  const [cardTrackOverrides, setCardTrackOverrides] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [detailFor, setDetailFor] = useState(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', message: '', slotId: '', mode: 'video' });

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
  const orgName = hp?.settings?.orgName || 'Lili Organization';
  const settings = data?.settings || {};
  const notice =
    settings.noticeText && !settings.noticeText.toLowerCase().includes('non-refundable')
      ? settings.noticeText
      : '';
  const whatsapp = (settings.whatsappNumber || '').replace(/\D/g, '');

  const openBook = (type, item, isFree = false) => {
    setBookFor({ type, item, isFree });
    setForm({ name: '', phone: '', email: '', city: '', message: '', slotId: '', mode: 'video' });
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
      const isFreeBooking = Boolean(bookFor.isFree);
      const payload = {
        type: bookFor.type,
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        message: form.message,
        track: isFreeBooking ? 'free' : 'paid',
        isFreeTrack: isFreeBooking,
      };

      if (bookFor.type === 'group') {
        if (bookFor.item.date && !bookFor.item.groupSessionDate && (data.sessions || []).some((s) => s._id === bookFor.item._id)) {
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

      if (res.data.freeConfirmed || isFreeBooking) {
        showSuccess('Session booked successfully! Confirmation receipt generated.');
        setBookFor(null);
        navigate(`/counselling/receipt/${booking.bookingCode}`);
        return;
      }

      if (!window.Razorpay || !res.data.razorpayOrderId) {
        showError('Payment gateway unavailable. Please try again later.');
        return;
      }

      const options = {
        key: res.data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
        amount: Math.round((res.data.amount || booking.amount) * 100),
        currency: 'INR',
        name: orgName,
        description: `Counselling: ${booking.itemTitle}`,
        order_id: res.data.razorpayOrderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            const verifyRes = await verifyCounsellingPayment({
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showSuccess('Payment successful! Your session is booked.');
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
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading career counselling services...</p>
        </div>
      </div>
    );
  }

  if (!data?.visible) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
        <Navbar activePage="counselling" />
        <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Career Counselling Coming Soon</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            Career guidance & 1-on-1 mentorship bookings will be opened shortly.
          </p>
          <Link
            to="/"
            className="mt-6 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition bg-indigo-600 hover:bg-indigo-700"
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

  // Sort: FREE SERVICES SHOWN FIRST in All list!
  const sortedServices = [...services].sort((a, b) => {
    const aFree = (a.isFree || Number(a.price || 0) === 0) ? 1 : 0;
    const bFree = (b.isFree || Number(b.price || 0) === 0) ? 1 : 0;
    if (aFree !== bFree) return bFree - aFree; // 1 comes before 0, free first!
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  const filteredServices = sortedServices.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.freeDescription?.toLowerCase().includes(q) ||
      s.paidDescription?.toLowerCase().includes(q) ||
      s.tagline?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      <SEO
        title={settings.pageTitle || '1-on-1 Career Counselling & Guidance - Free & Premium Sessions'}
        description={settings.pageSubtitle || 'Personalized career counselling and roadmap consultation with industry mentors.'}
      />
      <Navbar activePage="counselling" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, #6366f1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {settings.heroBadge || 'Expert Career Mentorship & Discovery'}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {settings.pageTitle || 'Career Counselling & Mentorship'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Choose from <span className="text-emerald-400 font-bold">100% Free Career Guidance (निःशुल्क)</span> or book a <span className="text-amber-300 font-bold">👑 Premium 1-on-1 Mentorship</span> for a complete 12-month career blueprint.
          </p>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Career Experts
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> 1-on-1 Private Consultation
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" /> Course & Placement Roadmap
            </span>
          </div>

          {notice && (
            <p className="text-[11px] text-amber-200/80 max-w-lg mx-auto pt-2 font-medium">
              ⚠️ {notice}
            </p>
          )}
        </div>
      </section>

      {/* Main Container */}
      <section className="py-10 px-4 max-w-6xl mx-auto w-full flex-1">
        
        {/* SEGMENT SWITCHER: Free (Default 1st) vs Paid (2nd) vs All (3rd) - NO SCROLL NEEDED */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-sm mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Main Segment Tabs: Responsive 3-Column Grid (Zero Scroll) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 w-full lg:max-w-xl">
            {/* 1. Free Guidance Tab (Default) */}
            <button
              type="button"
              onClick={() => setCounsellingSegment('free')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                counsellingSegment === 'free'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 shrink-0" />
                <span className="text-xs">Free Guidance</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                counsellingSegment === 'free' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                100% Free
              </span>
            </button>

            {/* 2. Paid / Premium Mentorship Tab */}
            <button
              type="button"
              onClick={() => setCounsellingSegment('paid')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                counsellingSegment === 'paid'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white shadow-md shadow-amber-500/30 font-black'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 shrink-0 fill-current" />
                <span className="text-xs">Premium Mentorship</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                counsellingSegment === 'paid' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                👑 Premium
              </span>
            </button>

            {/* 3. All Sessions Tab */}
            <button
              type="button"
              onClick={() => setCounsellingSegment('all')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                counsellingSegment === 'all'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 shrink-0 text-indigo-600" />
                <span className="text-xs">All Sessions</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                counsellingSegment === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {services.length}
              </span>
            </button>
          </div>

          {/* WhatsApp Support Link */}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" /> Quick WhatsApp Doubt
            </a>
          )}
        </div>

        {/* 1-on-1 Services Grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {counsellingSegment === 'free'
                  ? 'Free Career Discovery Sessions'
                  : counsellingSegment === 'paid'
                  ? '👑 Premium 1-on-1 Career Mentorship'
                  : '1-on-1 Career Guidance Sessions (Free Sessions First)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {counsellingSegment === 'free'
                  ? 'Zero fee required. Complete free guidance for course selection and roadmap.'
                  : counsellingSegment === 'paid'
                  ? 'In-depth personalized consultation with senior mentors and job strategies.'
                  : 'Every session is offered in both Free Guidance and Premium Mentorship tracks.'}
              </p>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-xs">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No counselling services available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map((s, i) => {
                // Determine whether this card shows Free or Paid track
                const isItemFreeByDefault = s.isFree || Number(s.price || 0) === 0;
                const isViewFree = counsellingSegment === 'free'
                  ? true
                  : (counsellingSegment === 'paid'
                      ? false
                      : (cardTrackOverrides[s._id] ? cardTrackOverrides[s._id] === 'free' : isItemFreeByDefault));

                const currentDescription = isViewFree
                  ? (s.freeDescription || s.description || 'Quick 15-minute career clarity consultation, course curriculum recommendations, and eligibility guidance.')
                  : (s.paidDescription || s.description || 'Deep 45-minute personalized roadmap, industry portfolio review, placement strategies & senior mentor guidance.');

                return (
                  <div
                    key={s._id || i}
                    className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${
                      !isViewFree
                        ? 'border-amber-300/60 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 ring-1 ring-amber-400/20'
                        : 'border-slate-200/80 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10'
                    }`}
                  >
                    {/* Header Banner — Compact */}
                    <div className={`px-3.5 py-2.5 relative text-white ${
                      isViewFree
                        ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900'
                        : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-amber-950/70'
                    }`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white/90 border border-white/15">
                          {modeLabels[s.mode] || 'Video / Call'}
                        </span>

                        {isViewFree ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                            <Gift className="w-2.5 h-2.5" /> Free
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 flex items-center gap-1 shadow-sm border border-amber-300">
                            <Crown className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                            <span>PREMIUM</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-white text-sm leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                        {s.name}
                      </h3>
                    </div>

                    {/* Card Body — Compact */}
                    <div className="px-3.5 py-3 flex-1 flex flex-col justify-between space-y-2.5">
                      
                      {/* Track Switcher if in 'All' Tab */}
                      {counsellingSegment === 'all' && (
                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCardTrackOverrides((prev) => ({ ...prev, [s._id]: 'free' }))}
                            className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isViewFree ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Gift className="w-3 h-3" /> Free
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardTrackOverrides((prev) => ({ ...prev, [s._id]: 'paid' }))}
                            className={`flex-1 py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              !isViewFree ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Crown className="w-3 h-3 fill-slate-950" /> Premium
                          </button>
                        </div>
                      )}

                      {/* Description — Truncated, full text in View More popup */}
                      <div>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {currentDescription}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDetailFor({ type: 'one_on_one', item: s, isFree: isViewFree, description: currentDescription })}
                          className={`mt-1 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                            isViewFree ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'
                          }`}
                        >
                          View More <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">
                            {modeLabels[s.mode] || '1-on-1 Session'}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            isViewFree
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1'
                          }`}>
                            {!isViewFree && <Crown className="w-2.5 h-2.5 fill-amber-900" />}
                            {isViewFree ? '100% Free' : 'Premium'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openBook('one_on_one', s, isViewFree)}
                          className={`w-full py-2 px-3 text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                            isViewFree
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:opacity-95 shadow-amber-500/25'
                          }`}
                        >
                          {!isViewFree && <Crown className="w-3.5 h-3.5 fill-white" />}
                          <span>{isViewFree ? 'Book Free Session (निःशुल्क)' : 'Book Premium Mentorship'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Group Sessions & Masterclasses Section */}
        {groupServices.length > 0 && (
          <section className="pt-6 pb-12 border-t border-slate-200">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Interactive Masterclasses</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Upcoming Group Webinars & Sessions</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Topic-focused live masterclasses & group guidance batches with live Q&A.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupServices.map((s) => {
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
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-4 relative group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Users className="w-3 h-3 text-indigo-600" /> Group Masterclass
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
                          Live Interactive
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                        {s.name}
                      </h3>

                      {isScheduled && (
                        <div className="px-2.5 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Scheduled: <strong>{scheduleDateStr}</strong></span>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {s.description || 'Interactive live group webinar with dedicated doubt solving.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDetailFor({
                            type: 'group',
                            item: s,
                            isFree: true,
                            description: s.description || 'Interactive live group webinar with dedicated doubt solving.',
                            scheduleDateStr,
                          })}
                          className="mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
                        >
                          View More <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Open for Registration
                      </span>

                      <button
                        type="button"
                        onClick={() => openBook('group', s, true)}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        Book Seat <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </section>

      {/* Why Book Counselling Banner */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Why Guidance Matters</span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Avoid wrong course choices & save years of effort
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Choosing the right IT or vocational skill qualification depends on your career aptitude and real market demand.
              A single consultation gives you a clear roadmap and personalized guidance.
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

      {/* View More — Full Details Modal */}
      {detailFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailFor(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl overflow-hidden flex flex-col border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className={`p-5 text-white relative ${
              detailFor.type === 'group'
                ? 'bg-gradient-to-r from-indigo-700 to-indigo-900'
                : detailFor.isFree
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                  : 'bg-gradient-to-r from-slate-950 via-indigo-900 to-amber-950'
            }`}>
              <button
                type="button"
                onClick={() => setDetailFor(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                {detailFor.type === 'group' ? 'Group Masterclass' : detailFor.isFree ? 'Free Session' : 'Premium Mentorship'}
              </span>
              <h3 className="font-black text-lg leading-snug mt-2 pr-8">{detailFor.item.name}</h3>
              <p className="text-xs text-white/80 mt-1">
                {detailFor.type === 'group'
                  ? (detailFor.scheduleDateStr ? `Scheduled: ${detailFor.scheduleDateStr}` : 'Date & time will be shared by the organization')
                  : (modeLabels[detailFor.item.mode] || '1-on-1 Session')}
              </p>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{detailFor.description}</p>

              {detailFor.type === 'one_on_one' && (
                <>
                  <div className={`space-y-1.5 p-3 rounded-xl border ${
                    detailFor.isFree ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/40 border-amber-200/60'
                  }`}>
                    {(detailFor.isFree ? [
                      '1-on-1 Consultation via Video / Phone / WhatsApp',
                      'Course Syllabus & Career Eligibility Roadmap',
                    ] : [
                      'Comprehensive 12-Month Career & Placement Blueprint',
                      'Direct Senior Mentor Q&A and Action Plan',
                    ]).map((h) => (
                      <div key={h} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        {detailFor.isFree
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          : <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />}
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`p-3 rounded-xl text-[11px] leading-snug border ${
                    detailFor.isFree ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <p className="font-semibold">
                      नोट: काउंसलिंग {detailFor.isFree ? 'अनुभवी काउंसलर (Experienced Counsellor)' : 'अनुभवी वर्किंग प्रोफेशनल (Experienced Working Professional)'} द्वारा कराई जाएगी।
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setDetailFor(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { const d = detailFor; setDetailFor(null); openBook(d.type, d.item, d.isFree); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer ${
                  detailFor.type === 'group'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : detailFor.isFree ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gradient-to-r from-amber-500 to-indigo-600'
                }`}
              >
                {detailFor.type === 'group' ? 'Book Seat' : detailFor.isFree ? 'Book Free Session' : 'Book Premium Mentorship'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Drawer / Modal */}
      {bookFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className={`p-5 text-white relative ${
              bookFor.isFree
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : 'bg-gradient-to-r from-slate-950 via-indigo-900 to-amber-950'
            }`}>
              <button
                type="button"
                onClick={() => setBookFor(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-1">
                {bookFor.isFree ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                    🎁 100% Free Career Session
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 flex items-center gap-1 font-bold">
                    <Crown className="w-3 h-3 fill-amber-950" /> Premium Mentorship
                  </span>
                )}
              </div>

              <h3 className="font-black text-lg pr-8 leading-tight">
                {bookFor.item.name || bookFor.item.title}
              </h3>
              <p className="text-xs opacity-90 mt-1 font-medium">
                {bookFor.isFree
                  ? 'Zero fee required • Instant confirmation receipt'
                  : `₹${bookFor.item.price || 499} • Video / Phone / WhatsApp`}
              </p>
            </div>

            {/* Bilingual Note in Booking Modal */}
            <div className="px-6 pt-4 pb-0">
              <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                bookFor.isFree
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-xs'
                  : 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-xs'
              }`}>
                <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5 ${
                  bookFor.isFree ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'
                }`}>
                  नोट / Note
                </span>
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 text-xs">
                    {bookFor.isFree ? (
                      <>काउंसलिंग <strong className="text-emerald-900 font-bold">अनुभवी काउंसलर (Experienced Counsellor)</strong> द्वारा कराई जाएगी।</>
                    ) : (
                      <>काउंसलिंग <strong className="text-amber-900 font-bold">अनुभवी वर्किंग प्रोफेशनल (Experienced Working Professional)</strong> द्वारा कराई जाएगी।</>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {bookFor.isFree
                      ? 'Counselling will be conducted by experienced counsellors.'
                      : 'Counselling will be conducted by experienced working professionals.'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Student Name *</label>
                <input
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter candidate name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="tel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="For join link"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">City / Location</label>
                <input
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="E.g. Lucknow, Delhi, Varanasi"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              {bookFor.type === 'one_on_one' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Preferred Consultation Mode</label>
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
                          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Career Query (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Which course or job role do you want advice on?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    bookFor.isFree
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:opacity-95 shadow-amber-500/30'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Booking...</span>
                    </>
                  ) : (
                    <>
                      {!bookFor.isFree && <Crown className="w-3.5 h-3.5 fill-white" />}
                      <span>
                        {bookFor.isFree
                          ? 'Confirm FREE Session (निःशुल्क स्लॉट बुक करें)'
                          : `Pay ₹${bookFor.item.price || 499} & Book Premium Mentorship`}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  🔒 256-bit SSL encrypted • Instant confirmation receipt generated
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
