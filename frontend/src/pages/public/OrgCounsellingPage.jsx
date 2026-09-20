import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic, getPublicCounselling, createCounsellingOrder, verifyCounsellingPayment, joinCounsellingWaitlist } from '../../api';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  Sparkles, Video, Phone, MessageCircle, Calendar, Clock, Users, CheckCircle2,
  ArrowRight, ShieldAlert, MapPin, IndianRupee, X
} from 'lucide-react';

const modeIcons = {
  video: Video, phone: Phone, whatsapp: MessageCircle,
  zoom: Video, meet: Video, hall: MapPin, center: MapPin,
};
const modeLabels = {
  phone: 'Phone', whatsapp: 'WhatsApp', video: 'Video call',
  zoom: 'Zoom', meet: 'Google Meet', hall: 'Institute hall', center: 'Partner center',
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

  const loadPublic = () => getPublicCounselling().then((res) => setData(res.data || { visible: false, services: [], sessions: [] }));

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
  const orgName = hp?.settings?.orgName || 'Counselling';
  const settings = data?.settings || {};
  const notice = settings.noticeText || 'Counselling fee is non-refundable and not adjustable against course or admission fees.';
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
      if (bookFor.type === 'group') payload.sessionId = bookFor.item._id;
      else {
        payload.serviceId = bookFor.item._id;
        if (form.slotId) payload.slotId = form.slotId;
      }

      const res = await createCounsellingOrder(payload);
      const booking = res.data.booking;

      if (res.data.freeConfirmed) {
        showSuccess('Seat booked');
        setBookFor(null);
        navigate(`/counselling/receipt/${booking.bookingCode}`);
        return;
      }

      if (!window.Razorpay || !res.data.razorpayOrderId) {
        showError('Payment gateway not available. Try again later.');
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
            showSuccess('Payment successful');
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
          <ShieldAlert className="w-14 h-14 text-slate-300 mb-4" />
          <h1 className="text-2xl font-black text-slate-800">Counselling coming soon</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md">Paid career counselling is not published on the website yet.</p>
          <Link to="/" className="mt-6 text-sm font-bold" style={{ color: themeColor }}>Back to home</Link>
        </div>
        <Footer homepageData={hp} />
      </div>
    );
  }

  const services = data.services || [];
  const sessions = data.sessions || [];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <SEO title={settings.pageTitle || 'Career Counselling'} description={settings.pageSubtitle || ''} />
      <Navbar activePage="counselling" />

      <section className="py-16 px-4 text-center bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/10">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            {settings.heroBadge || 'Career Guidance'}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{settings.pageTitle || 'Paid Career Counselling'}</h1>
          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed">{settings.pageSubtitle}</p>
          <p className="text-xs text-amber-200/90 max-w-xl mx-auto pt-2">{notice}</p>
        </div>
      </section>

      <section className="py-14 px-4 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800">1-on-1 sessions</h2>
          <p className="text-sm text-slate-500 mt-1">Talk privately with a counsellor. Fee is not adjusted in admission.</p>
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center border border-dashed rounded-2xl bg-white">No 1-on-1 plans published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {services.map((s) => {
              const Icon = modeIcons[s.mode] || Video;
              return (
                <div key={s._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                  {s.badge && <span className="self-start text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 mb-3">{s.badge}</span>}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
                      <Icon className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.tagline}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{s.description}</p>
                  {(s.includes || []).length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {s.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-5 pt-4 border-t flex items-end justify-between gap-3">
                    <div>
                      {s.originalPrice > s.price && s.originalPrice > 0 && (
                        <span className="text-xs text-slate-400 line-through mr-1">₹{s.originalPrice}</span>
                      )}
                      <p className="text-xl font-black text-slate-900">₹{s.price}</p>
                      <p className="text-[11px] text-slate-500">{s.duration} · {modeLabels[s.mode] || s.mode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openBook('one_on_one', s)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book & pay <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="py-14 px-4 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800">Upcoming group sessions</h2>
          <p className="text-sm text-slate-500 mt-1">Fixed date, limited seats. Join with other students and parents.</p>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400 py-10 text-center border border-dashed rounded-2xl bg-white">No upcoming group sessions.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const full = (s.seatsLeft ?? 0) <= 0;
              const dateLabel = s.date ? new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={s._id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-extrabold text-slate-800 text-lg">{s.title}</h3>
                    {s.topic && <p className="text-sm text-slate-500">{s.topic}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dateLabel}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {s.startTime}–{s.endTime} {s.duration ? `(${s.duration})` : ''}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.seatsLeft} / {s.seats} seats left</span>
                      <span>{modeLabels[s.mode] || s.mode}{s.counsellorName ? ` · ${s.counsellorName}` : ''}</span>
                    </div>
                    {s.description && <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                    <div className="flex items-baseline gap-1">
                      {s.originalFee > s.fee && s.originalFee > 0 && <span className="text-xs text-slate-400 line-through">₹{s.originalFee}</span>}
                      <span className="text-2xl font-black text-slate-900 flex items-center"><IndianRupee className="w-5 h-5" />{s.fee}</span>
                    </div>
                    {full ? (
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl text-xs font-bold border"
                        onClick={() => openBook('waitlist', s)}
                      >
                        Join waitlist
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBook('group', s)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                        style={{ backgroundColor: themeColor }}
                      >
                        Book & pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-amber-900">{notice}</p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-emerald-700"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp counsellor
            </a>
          )}
        </div>
      </section>

      {bookFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 text-white relative" style={{ backgroundColor: themeColor }}>
              <button type="button" onClick={() => setBookFor(null)} className="absolute right-3 top-3 p-1 rounded-lg bg-white/10">
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-black text-sm pr-8">{bookFor.type === 'waitlist' ? 'Waitlist: ' : 'Pay to book: '}{bookFor.item.name || bookFor.item.title}</h3>
              <p className="text-xs opacity-90 mt-0.5">{bookFor.type === 'waitlist' ? 'We email you if a seat opens (24 hrs to book).' : `₹${bookFor.type === 'group' ? bookFor.item.fee : bookFor.item.price} · not adjustable against admission`}</p>
            </div>
            <form onSubmit={handlePay} className="p-5 space-y-3">
              <input required className="input-field text-sm" placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="tel" className="input-field text-sm" placeholder="10-digit mobile *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input required type="email" className="input-field text-sm" placeholder="Email (Gmail) *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              {bookFor.type === 'one_on_one' && (data?.slots || []).filter((sl) => String(sl.serviceId) === String(bookFor.item._id)).length > 0 && (
                <select className="input-field text-sm" value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })}>
                  <option value="">Any slot (we'll schedule later)</option>
                  {(data.slots || []).filter((sl) => String(sl.serviceId) === String(bookFor.item._id)).map((sl) => (
                    <option key={sl._id} value={sl._id}>{new Date(sl.startAt).toLocaleString()}</option>
                  ))}
                </select>
              )}
              <textarea rows="2" className="input-field text-sm" placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: themeColor }}>
                {submitting ? 'Please wait...' : bookFor.type === 'waitlist' ? 'Join waitlist' : 'Pay with Razorpay'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer homepageData={hp} />
    </div>
  );
}
