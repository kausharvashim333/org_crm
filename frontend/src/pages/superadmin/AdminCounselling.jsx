import { useState, useEffect } from 'react';
import {
  getCounsellingSettings, updateCounsellingSettings,
  getCounsellingServices, createCounsellingService, updateCounsellingService, deleteCounsellingService,
  getCounsellingSessions, createCounsellingSession, updateCounsellingSession, deleteCounsellingSession,
  uploadOrgImage, getCounsellingBookings, createManualCounsellingBooking, updateCounsellingBooking,
  getCounsellors, createCounsellor, updateCounsellor, deleteCounsellor,
  copyCounsellingSession, getCounsellingWaitlist,
  createCounsellingSlot, getCounsellingSlots, deleteCounsellingSlot, sendCounsellingRecording, resendCounsellingJoin,
  generateCounsellingTagline,
} from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Plus, Edit, Trash2, Save, Users, Video, Calendar, Upload, ClipboardList, Sparkles, Wand2, RefreshCw, Check } from 'lucide-react';

const emptyService = {
  name: '', tagline: '', description: '', duration: '30 min', mode: 'video',
  price: 499, originalPrice: '', includes: '', badge: '', image: '', isActive: true, counsellorId: '',
};

const emptySession = {
  title: '', topic: '', description: '', date: '', startTime: '11:00', endTime: '12:30',
  duration: '90 min', mode: 'zoom', meetingLink: '', venue: '', seats: 30,
  fee: 199, originalFee: '', language: 'Hindi', counsellorName: '', counsellorId: '',
  targetAudience: '12th students & parents', interestArea: '',
  status: 'draft', coverImage: '', bookingClosesAt: '', showOnWebsite: true,
};

const modeLabels = { phone: 'Phone', whatsapp: 'WhatsApp', video: 'Video', zoom: 'Zoom', meet: 'Google Meet', hall: 'Institute hall', center: 'Partner center' };

export default function AdminCounselling() {
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    showOnWebsite: true, pageTitle: '', pageSubtitle: '', heroBadge: '', whatsappNumber: '', noticeText: '',
  });
  const [services, setServices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showService, setShowService] = useState(false);
  const [editService, setEditService] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [showSession, setShowSession] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [uploading, setUploading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ type: 'group', sessionId: '', serviceId: '', name: '', phone: '', email: '', city: '', amount: '', adminNote: '' });
  const [counsellors, setCounsellors] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [slots, setSlots] = useState([]);
  const [newCounsellor, setNewCounsellor] = useState({ name: '', email: '', phone: '', password: '' });
  const [editCounsellor, setEditCounsellor] = useState(null);
  const [counsellorForm, setCounsellorForm] = useState({ name: '', email: '', phone: '', password: '', isActive: true });
  const [slotForm, setSlotForm] = useState({ serviceId: '', startAt: '', counsellorId: '' });
  const [taglineUserEdited, setTaglineUserEdited] = useState(false);
  const [includesUserEdited, setIncludesUserEdited] = useState(false);
  const { showSuccess, showError } = useToast();

  const getContextualMeta = (name = '', description = '') => {
    const combined = `${name || ''} ${description || ''}`.toLowerCase().trim();
    if (!combined) {
      return {
        tagline: '1-on-1 personalized mentorship to unlock your dream career',
        includes: 'Personalized career roadmap, Strengths & gap analysis, 3 actionable milestones, Learning resources, 1-on-1 private mentoring call',
      };
    }

    if (/12th|10th|school|stream|science|arts|commerce|matric|intermediate/.test(combined)) {
      return {
        tagline: 'Personalized guidance to choose the right stream, courses & college path',
        includes: 'Stream & subject selection guidance, Top 3 degree & career roadmaps, College eligibility & entrance exam tips, Parent-student doubt clearance, Action summary notes',
      };
    }
    if (/job|placement|interview|resume|cv|salary|fresher|switch|hiring|hr round/.test(combined)) {
      return {
        tagline: 'Crack high-impact job interviews & build an industry-ready resume',
        includes: 'ATS-friendly resume audit, LinkedIn profile optimization, Live mock interview & feedback, Salary negotiation strategy, 7-day WhatsApp doubt support',
      };
    }
    if (/it|tech|code|coding|software|web|full stack|frontend|backend|data|python|java|cloud|ai|devops/.test(combined)) {
      return {
        tagline: 'Structured personalized roadmap to break into high-growth tech careers',
        includes: 'GitHub & project portfolio review, Practical tech roadmap (Languages & Frameworks), DSA & problem-solving strategy, Real tech interview questions breakdown, Curated learning resources',
      };
    }
    if (/govt|sarkari|upsc|ssc|railway|banking|defense|police|civil service/.test(combined)) {
      return {
        tagline: 'Targeted strategy, exam selection & high-yield preparation guidance',
        includes: 'Exam syllabus breakdown & scoring topics, Standard booklist & test series guide, Daily preparation & revision schedule, Mistakes to avoid in first attempt, 1-on-1 strategy & doubt solving',
      };
    }
    if (/college|degree|university|admission|bca|mca|btech|diploma|mba|bba|campus/.test(combined)) {
      return {
        tagline: 'Expert clarity on college selection, degree ROI & real industry relevance',
        includes: 'College vs degree ROI comparison, Cutoff & admission process guide, Direct placement record insights, Course specialization recommendation, Personalized decision checklist',
      };
    }
    if (/finance|tally|gst|accounting|tax|ca|commerce|audit|bookkeeping/.test(combined)) {
      return {
        tagline: 'Direct mentorship on modern accounting careers, GST & corporate finance',
        includes: 'Practical accounting workflow breakdown, GST/TDS compliance career scope, Recommended certifications & tools, Corporate entry-level job roadmap, Interview questions cheat sheet',
      };
    }
    if (/design|graphic|ui|ux|multimedia|animation|video editing|figma|photoshop/.test(combined)) {
      return {
        tagline: 'Build a winning design portfolio, freelance profile & creative career',
        includes: 'Portfolio & Behance/Figma audit, Design tools & workflow roadmap, Freelance client pitch & pricing guide, Live creative critique & feedback, Resource pack & typography guidelines',
      };
    }

    const topicName = name ? name.trim() : (description ? description.trim().slice(0, 30) : 'your career');
    return {
      tagline: `1-on-1 personalized mentorship & actionable roadmap for ${topicName}`,
      includes: 'Personalized career action roadmap, Strengths & skill gap analysis, Step-by-step career milestones, Resource & learning recommendations, 1-on-1 private mentoring call',
    };
  };

  const getContextualTagline = (name = '', description = '') => getContextualMeta(name, description).tagline;
  const getContextualIncludes = (name = '', description = '') => getContextualMeta(name, description).includes;

  const [taglineModal, setTaglineModal] = useState({
    open: false,
    loading: false,
    taglines: [],
    suggestedIncludes: '',
  });

  const handleOpenAITaglines = async (overrideName, overrideDesc) => {
    const targetName = (overrideName !== undefined ? overrideName : serviceForm.name || '').trim();
    const targetDesc = (overrideDesc !== undefined ? overrideDesc : serviceForm.description || '').trim();
    if (!targetName && !targetDesc) {
      showError('Please enter a service name or description first');
      return;
    }
    setTaglineModal({ open: true, loading: true, taglines: [], suggestedIncludes: '' });
    try {
      const res = await generateCounsellingTagline({
        name: targetName,
        description: targetDesc,
        mode: serviceForm.mode,
        duration: serviceForm.duration,
      });
      if (res?.data?.success && Array.isArray(res.data.taglines) && res.data.taglines.length > 0) {
        setTaglineModal({
          open: true,
          loading: false,
          taglines: res.data.taglines,
          suggestedIncludes: res.data.includes || getContextualIncludes(targetName, targetDesc),
        });
      } else {
        const meta = getContextualMeta(targetName, targetDesc);
        setTaglineModal({
          open: true,
          loading: false,
          taglines: [
            meta.tagline,
            `1-on-1 personalized mentorship to ace your ${targetName || 'goals'}`,
            `Structured roadmap & expert guidance tailored for ${targetName || 'career growth'}`,
            `Practical step-by-step strategy with industry mentors for ${targetName || 'success'}`,
            `Gain absolute clarity, avoid career mistakes & succeed in ${targetName || 'your path'}`,
          ],
          suggestedIncludes: meta.includes,
        });
      }
    } catch (err) {
      const meta = getContextualMeta(targetName, targetDesc);
      setTaglineModal({
        open: true,
        loading: false,
        taglines: [
          meta.tagline,
          `1-on-1 personalized mentorship to ace your ${targetName || 'goals'}`,
          `Structured roadmap & expert guidance tailored for ${targetName || 'career growth'}`,
          `Practical step-by-step strategy with industry mentors for ${targetName || 'success'}`,
          `Gain absolute clarity, avoid career mistakes & succeed in ${targetName || 'your path'}`,
        ],
        suggestedIncludes: meta.includes,
      });
    }
  };

  const load = async () => {
    try {
      const [sRes, svcRes, sesRes, bRes, cRes, wRes, slRes] = await Promise.all([
        getCounsellingSettings(),
        getCounsellingServices(),
        getCounsellingSessions(),
        getCounsellingBookings(),
        getCounsellors().catch(() => ({ data: { counsellors: [] } })),
        getCounsellingWaitlist().catch(() => ({ data: { waitlist: [] } })),
        getCounsellingSlots().catch(() => ({ data: { slots: [] } })),
      ]);
      setSettings(sRes.data.settings || settings);
      setServices(svcRes.data.services || []);
      setSessions(sesRes.data.sessions || []);
      setBookings(bRes.data.bookings || []);
      setCounsellors(cRes.data.counsellors || []);
      setWaitlist(wRes.data.waitlist || []);
      setSlots(slRes.data.slots || []);
    } catch {
      showError('Failed to load counselling data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await updateCounsellingSettings(settings);
      setSettings(res.data.settings);
      showSuccess('Website settings saved');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const openNewService = () => {
    setEditService(null);
    setServiceForm(emptyService);
    setTaglineUserEdited(false);
    setIncludesUserEdited(false);
    setShowService(true);
  };

  const openEditService = (s) => {
    setEditService(s);
    setServiceForm({
      name: s.name || '', tagline: s.tagline || '', description: s.description || '',
      duration: s.duration || '30 min', mode: s.mode || 'video',
      price: s.price ?? 0, originalPrice: s.originalPrice || '',
      includes: (s.includes || []).join(', '), badge: s.badge || '',
      image: s.image || '', isActive: s.isActive !== false, counsellorId: s.counsellorId?._id || s.counsellorId || '',
    });
    setTaglineUserEdited(Boolean(s.tagline));
    setIncludesUserEdited(Boolean(s.includes && s.includes.length));
    setShowService(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...serviceForm,
        price: Number(serviceForm.price) || 0,
        originalPrice: Number(serviceForm.originalPrice) || 0,
        includes: String(serviceForm.includes).split(',').map((x) => x.trim()).filter(Boolean),
        counsellorId: serviceForm.counsellorId || null,
      };
      if (editService) {
        await updateCounsellingService(editService._id, payload);
        showSuccess('Service updated');
      } else {
        await createCounsellingService(payload);
        showSuccess('Service created');
      }
      setShowService(false);
      setEditService(null);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Delete this counselling service?')) return;
    try {
      await deleteCounsellingService(id);
      showSuccess('Service deleted');
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openNewSession = () => {
    setEditSession(null);
    setSessionForm(emptySession);
    setShowSession(true);
  };

  const toDateInput = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  const toDateTimeLocal = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  const openEditSession = (s) => {
    setEditSession(s);
    setSessionForm({
      title: s.title || '', topic: s.topic || '', description: s.description || '',
      date: toDateInput(s.date), startTime: s.startTime || '11:00', endTime: s.endTime || '12:30',
      duration: s.duration || '90 min', mode: s.mode || 'zoom',
      meetingLink: s.meetingLink || '', venue: s.venue || '',
      seats: s.seats ?? 30, fee: s.fee ?? 0, originalFee: s.originalFee || '',
      language: s.language || 'Hindi', counsellorName: s.counsellorName || '',
      targetAudience: s.targetAudience || '', interestArea: s.interestArea || '',
      status: s.status || 'draft', coverImage: s.coverImage || '',
      bookingClosesAt: toDateTimeLocal(s.bookingClosesAt),
      showOnWebsite: s.showOnWebsite !== false,
      counsellorId: s.counsellorId?._id || s.counsellorId || '',
    });
    setShowSession(true);
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...sessionForm,
        seats: Number(sessionForm.seats) || 0,
        fee: Number(sessionForm.fee) || 0,
        originalFee: Number(sessionForm.originalFee) || 0,
        bookingClosesAt: sessionForm.bookingClosesAt ? new Date(sessionForm.bookingClosesAt) : null,
        counsellorId: sessionForm.counsellorId || null,
      };
      if (editSession) {
        await updateCounsellingSession(editSession._id, payload);
        showSuccess('Group session updated');
      } else {
        await createCounsellingSession(payload);
        showSuccess('Group session created');
      }
      setShowSession(false);
      setEditSession(null);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save session');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!confirm('Delete this group session?')) return;
    try {
      await deleteCounsellingSession(id);
      showSuccess('Session deleted');
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const patchBooking = async (id, data, msg) => {
    try {
      await updateCounsellingBooking(id, data);
      showSuccess(msg);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await createManualCounsellingBooking({
        ...manualForm,
        amount: manualForm.amount === '' ? undefined : Number(manualForm.amount),
      });
      showSuccess('Manual booking added');
      setShowManual(false);
      setManualForm({ type: 'group', sessionId: '', serviceId: '', name: '', phone: '', email: '', city: '', amount: '', adminNote: '' });
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'paid') return b.paymentStatus === 'paid';
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'converted') return b.convertedToAdmission;
    return b.status === bookingFilter;
  });

  const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const exportCsv = () => {
    const rows = [
      ['Code', 'Type', 'Item', 'Name', 'Phone', 'Amount', 'Payment', 'Status', 'Attended', 'Converted', 'Course'],
      ...filteredBookings.map((b) => [
        b.bookingCode, b.type, b.itemTitle, b.name, b.phone, b.amount, b.paymentStatus, b.status,
        b.attended ? 'yes' : 'no', b.convertedToAdmission ? 'yes' : 'no', b.convertedCourse || '',
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'counselling-bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadImage = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      setter(res.data.imageUrl);
      showSuccess('Image uploaded');
    } catch {
      showError('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading counselling...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Counselling</h1>
        <p className="text-gray-500 text-sm">1-on-1 plans and group sessions shown on the public website</p>
      </div>

      <form onSubmit={handleSaveSettings} className="card space-y-4">
        <h3 className="font-semibold text-slate-800 border-b pb-2">Website page settings</h3>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={settings.showOnWebsite !== false} onChange={(e) => setSettings({ ...settings, showOnWebsite: e.target.checked })} />
          Show Counselling on website (navbar + /counselling)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Page title</label>
            <input className="input-field" value={settings.pageTitle || ''} onChange={(e) => setSettings({ ...settings, pageTitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hero badge</label>
            <input className="input-field" value={settings.heroBadge || ''} onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtitle</label>
            <input className="input-field" value={settings.pageSubtitle || ''} onChange={(e) => setSettings({ ...settings, pageSubtitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp number</label>
            <input className="input-field" placeholder="91xxxxxxxxxx" value={settings.whatsappNumber || ''} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fee notice</label>
            <input className="input-field" value={settings.noticeText || ''} onChange={(e) => setSettings({ ...settings, noticeText: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save page settings</button>
      </form>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('services')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'services' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
          <Video className="w-4 h-4 inline mr-1" /> 1-on-1 services ({services.length})
        </button>
        <button onClick={() => setTab('sessions')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'sessions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
          <Users className="w-4 h-4 inline mr-1" /> Group sessions ({sessions.length})
        </button>
        <button onClick={() => setTab('bookings')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'bookings' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
          <ClipboardList className="w-4 h-4 inline mr-1" /> Bookings ({bookings.length})
        </button>
        <button onClick={() => setTab('team')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'team' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
          Team & slots
        </button>
      </div>

      {tab === 'services' && (
        <>
          <div className="flex justify-end">
            <button onClick={openNewService} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add service</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.length === 0 && <p className="text-sm text-slate-400 col-span-full py-8 text-center">No 1-on-1 services yet.</p>}
            {services.map((s) => (
              <div key={s._id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{s.name}</h3>
                    <p className="text-xs text-slate-500">{s.tagline}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditService(s)} className="text-indigo-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteService(s._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="font-bold text-indigo-700">₹{s.price} · {s.duration} · {modeLabels[s.mode] || s.mode}</span>
                  {s.isActive ? <span className="badge badge-success text-[10px]">Live</span> : <span className="badge badge-warning text-[10px]">Hidden</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'sessions' && (
        <>
          <div className="flex justify-end">
            <button onClick={openNewSession} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add group session</button>
          </div>
          <div className="space-y-3">
            {sessions.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">No group sessions yet.</p>}
            {sessions.map((s) => (
              <div key={s._id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-800">{s.title}</h3>
                    <span className={`badge text-[10px] ${s.status === 'published' ? 'badge-success' : s.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{s.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">{s.topic}</p>
                  <p className="text-xs text-slate-600">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {s.date ? new Date(s.date).toLocaleDateString() : '—'} · {s.startTime}–{s.endTime} · {modeLabels[s.mode] || s.mode} · {s.bookedCount || 0}/{s.seats} seats · ₹{s.fee}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" className="text-xs text-slate-600 px-2" onClick={async () => {
                    const weeks = window.prompt('Copy weekly for how many weeks?', '4');
                    if (!weeks) return;
                    try { await copyCounsellingSession(s._id, { weeks: Number(weeks) }); showSuccess('Copied'); load(); }
                    catch (e) { showError(e.response?.data?.message || 'Copy failed'); }
                  }}>Copy weekly</button>
                  <button type="button" className="text-xs text-slate-600 px-2" onClick={async () => {
                    const url = window.prompt('Recording URL', s.recordingUrl || '');
                    if (!url) return;
                    try { await sendCounsellingRecording(s._id, { recordingUrl: url }); showSuccess('Recording emailed'); }
                    catch (e) { showError(e.response?.data?.message || 'Failed'); }
                  }}>Recording email</button>
                  <button onClick={() => openEditSession(s)} className="text-indigo-600 p-1.5"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteSession(s._id)} className="text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select className="input-field text-xs w-auto" value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending lock</option>
              <option value="confirmed">Confirmed</option>
              <option value="attended">Attended</option>
              <option value="no_show">No-show</option>
              <option value="cancelled">Cancelled</option>
              <option value="converted">Converted to admission</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={exportCsv} className="btn-secondary text-xs">Export CSV</button>
              <button type="button" onClick={() => setShowManual(true)} className="btn-primary text-xs flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Cash booking</button>
            </div>
          </div>
          {filteredBookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No bookings.</p>
          ) : (
            <div className="overflow-x-auto card">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="p-2">Code</th>
                    <th className="p-2">Person</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">₹</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b._id} className="border-b last:border-0">
                      <td className="p-2 font-mono font-bold">{b.bookingCode}</td>
                      <td className="p-2">
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-slate-500">{b.phone}</p>
                      </td>
                      <td className="p-2">
                        <p>{b.itemTitle}</p>
                        <p className="text-slate-400">{b.type === 'group' ? 'Group' : '1-on-1'}</p>
                      </td>
                      <td className="p-2 font-bold">{b.amount} <span className="font-normal text-slate-400">{b.paymentStatus}</span></td>
                      <td className="p-2">
                        <span className="badge text-[10px]">{b.status}</span>
                        {b.convertedToAdmission && <span className="badge badge-success text-[10px] ml-1">Admission</span>}
                      </td>
                      <td className="p-2 space-x-1 whitespace-nowrap">
                        {b.paymentStatus === 'paid' && b.status !== 'cancelled' && (
                          <>
                            <button type="button" className="text-emerald-700" onClick={() => patchBooking(b._id, { attended: true }, 'Marked attended')}>Attended</button>
                            <button type="button" className="text-amber-700" onClick={() => patchBooking(b._id, { status: 'no_show' }, 'Marked no-show')}>No-show</button>
                            <button type="button" className="text-indigo-700" onClick={() => {
                              const course = window.prompt('Admission course name (optional)', b.convertedCourse || '');
                              if (course === null) return;
                              patchBooking(b._id, { convertedToAdmission: true, convertedCourse: course }, 'Marked converted');
                            }}>Converted</button>
                            <button type="button" className="text-slate-700" onClick={async () => { try { await resendCounsellingJoin(b._id); showSuccess('Join email sent'); } catch (e) { showError(e.response?.data?.message || 'Failed'); } }}>Resend join</button>
                            <button type="button" className="text-red-600" onClick={() => confirm('Cancel this booking?') && patchBooking(b._id, { status: 'cancelled' }, 'Cancelled')}>Cancel</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-6">
          <form className="card space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            try { await createCounsellor(newCounsellor); showSuccess('Counsellor created'); setNewCounsellor({ name: '', email: '', phone: '', password: '' }); load(); }
            catch (err) { showError(err.response?.data?.message || 'Failed'); }
          }}>
            <h3 className="font-bold">Add counsellor login</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input required className="input-field" placeholder="Name" value={newCounsellor.name} onChange={(e) => setNewCounsellor({ ...newCounsellor, name: e.target.value })} />
              <input required type="email" className="input-field" placeholder="Email" value={newCounsellor.email} onChange={(e) => setNewCounsellor({ ...newCounsellor, email: e.target.value })} />
              <input className="input-field" placeholder="Phone" value={newCounsellor.phone} onChange={(e) => setNewCounsellor({ ...newCounsellor, phone: e.target.value })} />
              <input required type="password" className="input-field" placeholder="Password" value={newCounsellor.password} onChange={(e) => setNewCounsellor({ ...newCounsellor, password: e.target.value })} />
            </div>
            <button className="btn-primary text-sm">Create counsellor</button>
            <p className="text-xs text-slate-500">{counsellors.length} counsellor(s). They login at /counsellor/login</p>
          </form>
          <div className="card overflow-x-auto">
            <h3 className="font-bold mb-3">Counsellors</h3>
            {counsellors.length === 0 ? (
              <p className="text-sm text-slate-400">No counsellors yet. Create one above.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b">
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Phone</th>
                    <th className="py-2 pr-2">Assigned</th>
                    <th className="py-2 pr-2">Last login</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {counsellors.map((c) => (
                    <tr key={c._id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-2 font-semibold">{c.name}</td>
                      <td className="py-2.5 pr-2">{c.email}</td>
                      <td className="py-2.5 pr-2">{c.phone || '—'}</td>
                      <td className="py-2.5 pr-2">{c.serviceCount || 0} svc · {c.sessionCount || 0} sessions</td>
                      <td className="py-2.5 pr-2">{c.lastLogin ? new Date(c.lastLogin).toLocaleString() : 'Never'}</td>
                      <td className="py-2.5 pr-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {c.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <button type="button" className="text-indigo-600 mr-3" onClick={() => {
                          setEditCounsellor(c);
                          setCounsellorForm({ name: c.name, email: c.email, phone: c.phone || '', password: '', isActive: c.isActive !== false });
                        }}>Edit</button>
                        <button type="button" className="text-amber-600 mr-3" onClick={async () => {
                          try { await updateCounsellor(c._id, { isActive: !c.isActive }); showSuccess(c.isActive ? 'Access disabled' : 'Access enabled'); load(); }
                          catch (e) { showError(e.response?.data?.message || 'Failed'); }
                        }}>{c.isActive ? 'Disable' : 'Enable'}</button>
                        <button type="button" className="text-red-600" onClick={async () => {
                          if (!confirm(`Delete counsellor ${c.name}? Their assignments will be removed.`)) return;
                          try { await deleteCounsellor(c._id); showSuccess('Deleted'); load(); }
                          catch (e) { showError(e.response?.data?.message || 'Failed'); }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <form className="card space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            try { await createCounsellingSlot(slotForm); showSuccess('Slot added'); setSlotForm({ serviceId: '', startAt: '', counsellorId: '' }); load(); }
            catch (err) { showError(err.response?.data?.message || 'Failed'); }
          }}>
            <h3 className="font-bold">1-on-1 open slots</h3>
            <div className="flex flex-wrap gap-2">
              <select required className="input-field text-xs" value={slotForm.serviceId} onChange={(e) => setSlotForm({ ...slotForm, serviceId: e.target.value })}>
                <option value="">Service</option>
                {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select className="input-field text-xs" value={slotForm.counsellorId} onChange={(e) => setSlotForm({ ...slotForm, counsellorId: e.target.value })}>
                <option value="">Counsellor</option>
                {counsellors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input required type="datetime-local" className="input-field text-xs" value={slotForm.startAt} onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })} />
              <button className="btn-primary text-xs">Add</button>
            </div>
            {slots.map((sl) => (
              <div key={sl._id} className="flex justify-between text-xs border rounded p-2">
                <span>{new Date(sl.startAt).toLocaleString()} · {sl.status}</span>
                {sl.status !== 'booked' && <button type="button" className="text-red-600" onClick={async () => { await deleteCounsellingSlot(sl._id); load(); }}>Delete</button>}
              </div>
            ))}
          </form>
          <div className="card">
            <h3 className="font-bold mb-2">Waitlist</h3>
            {waitlist.length === 0 && <p className="text-sm text-slate-400">Empty.</p>}
            {waitlist.map((w) => (
              <p key={w._id} className="text-xs border-b py-2">{w.name} · {w.email} · {w.sessionId?.title || ''} · {w.status}</p>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={!!editCounsellor} onClose={() => setEditCounsellor(null)} title={`Edit counsellor — ${editCounsellor?.name || ''}`}>
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await updateCounsellor(editCounsellor._id, {
              name: counsellorForm.name,
              email: counsellorForm.email,
              phone: counsellorForm.phone,
              isActive: counsellorForm.isActive,
              ...(counsellorForm.password ? { password: counsellorForm.password } : {}),
            });
            showSuccess('Counsellor updated');
            setEditCounsellor(null);
            load();
          } catch (err) { showError(err.response?.data?.message || 'Failed'); }
        }}>
          <input required className="input-field" placeholder="Name" value={counsellorForm.name} onChange={(e) => setCounsellorForm({ ...counsellorForm, name: e.target.value })} />
          <input required type="email" className="input-field" placeholder="Email" value={counsellorForm.email} onChange={(e) => setCounsellorForm({ ...counsellorForm, email: e.target.value })} />
          <input className="input-field" placeholder="Phone" value={counsellorForm.phone} onChange={(e) => setCounsellorForm({ ...counsellorForm, phone: e.target.value })} />
          <input type="password" className="input-field" placeholder="New password (leave blank to keep current)" value={counsellorForm.password} onChange={(e) => setCounsellorForm({ ...counsellorForm, password: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={counsellorForm.isActive} onChange={(e) => setCounsellorForm({ ...counsellorForm, isActive: e.target.checked })} /> Active (can login)</label>
          <button type="submit" className="btn-primary w-full">Save counsellor</button>
        </form>
      </Modal>

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="Manual cash booking">
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <select className="input-field" value={manualForm.type} onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}>
            <option value="group">Group session</option>
            <option value="one_on_one">1-on-1 service</option>
          </select>
          {manualForm.type === 'group' ? (
            <select required className="input-field" value={manualForm.sessionId} onChange={(e) => setManualForm({ ...manualForm, sessionId: e.target.value })}>
              <option value="">Select session</option>
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
            </select>
          ) : (
            <select required className="input-field" value={manualForm.serviceId} onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}>
              <option value="">Select service</option>
              {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          )}
          <input required className="input-field" placeholder="Name" value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} />
          <input required className="input-field" placeholder="Phone" value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} />
          <input required type="email" className="input-field" placeholder="Email (for confirmation)" value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} />
          <input className="input-field" placeholder="Amount (blank = default fee)" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} />
          <input className="input-field" placeholder="Admin note" value={manualForm.adminNote} onChange={(e) => setManualForm({ ...manualForm, adminNote: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Add paid booking</button>
        </form>
      </Modal>

      <Modal isOpen={showService} onClose={() => setShowService(false)} title={editService ? 'Edit 1-on-1 service' : 'Add 1-on-1 service'} size="lg">
        <form onSubmit={handleServiceSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                required
                className="input-field"
                placeholder="E.g. Career Guidance after 12th"
                value={serviceForm.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setServiceForm((prev) => {
                    const autoTagline = !taglineUserEdited || !prev.tagline ? getContextualTagline(newName, prev.description) : prev.tagline;
                    const autoIncludes = !includesUserEdited || !prev.includes ? getContextualIncludes(newName, prev.description) : prev.includes;
                    return { ...prev, name: newName, tagline: autoTagline, includes: autoIncludes };
                  });
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <label className="block text-xs font-medium">Tagline</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAITaglines()}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 transition-all cursor-pointer shadow-xs"
                    title="Generate trending taglines & deliverables from AI"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-600 animate-pulse" />
                    <span>Popular AI Taglines</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = getContextualTagline(serviceForm.name, serviceForm.description);
                      setServiceForm((prev) => ({ ...prev, tagline: generated }));
                      setTaglineUserEdited(true);
                      showSuccess('Tagline auto-generated from description & topic!');
                    }}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-0.5 cursor-pointer"
                    title="Auto quick-fill from description"
                  >
                    <Sparkles className="w-3 h-3" /> From description
                  </button>
                </div>
              </div>
              <input
                className="input-field"
                placeholder="Auto-generated based on description & topic"
                value={serviceForm.tagline}
                onChange={(e) => {
                  setServiceForm({ ...serviceForm, tagline: e.target.value });
                  setTaglineUserEdited(true);
                }}
              />
            </div>
            <div><label className="block text-xs font-medium mb-1">Duration</label><input className="input-field" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} /></div>
            <div>
              <label className="block text-xs font-medium mb-1">Mode</label>
              <select className="input-field" value={serviceForm.mode} onChange={(e) => setServiceForm({ ...serviceForm, mode: e.target.value })}>
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium mb-1">Price (₹)</label><input type="number" min="0" className="input-field" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Original price (optional)</label><input type="number" min="0" className="input-field" value={serviceForm.originalPrice} onChange={(e) => setServiceForm({ ...serviceForm, originalPrice: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Badge</label><input className="input-field" placeholder="Popular / New" value={serviceForm.badge} onChange={(e) => setServiceForm({ ...serviceForm, badge: e.target.value })} /></div>
            <div>
              <label className="block text-xs font-medium mb-1">Image</label>
              <div className="flex gap-2">
                <input className="input-field text-xs" value={serviceForm.image} onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })} />
                <label className="btn-secondary text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, (url) => setServiceForm((p) => ({ ...p, image: url })))} />
                </label>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium">Description</label>
              <button
                type="button"
                onClick={() => {
                  const meta = getContextualMeta(serviceForm.name, serviceForm.description);
                  setServiceForm((prev) => ({
                    ...prev,
                    tagline: meta.tagline,
                    includes: meta.includes,
                  }));
                  setTaglineUserEdited(true);
                  setIncludesUserEdited(true);
                  showSuccess('Generated tagline & service deliverables from description!');
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                title="Generate tagline and includes based on this description"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Auto-update Tagline & Includes
              </button>
            </div>
            <textarea
              rows="2"
              className="input-field"
              placeholder="Briefly describe what this counselling service covers..."
              value={serviceForm.description}
              onChange={(e) => {
                const newDesc = e.target.value;
                setServiceForm((prev) => {
                  const autoTagline = !taglineUserEdited || !prev.tagline ? getContextualTagline(prev.name, newDesc) : prev.tagline;
                  const autoIncludes = !includesUserEdited || !prev.includes ? getContextualIncludes(prev.name, newDesc) : prev.includes;
                  return { ...prev, description: newDesc, tagline: autoTagline, includes: autoIncludes };
                });
              }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium">Includes (Service-wise deliverables, comma separated)</label>
              <button
                type="button"
                onClick={() => {
                  const autoIncludes = getContextualIncludes(serviceForm.name, serviceForm.description);
                  setServiceForm((prev) => ({ ...prev, includes: autoIncludes }));
                  setIncludesUserEdited(true);
                  showSuccess('Service-specific deliverables generated!');
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                title="Generate service-specific inclusions needed for this topic"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" /> Auto includes
              </button>
            </div>
            <input
              className="input-field"
              value={serviceForm.includes}
              onChange={(e) => {
                setServiceForm({ ...serviceForm, includes: e.target.value });
                setIncludesUserEdited(true);
              }}
              placeholder="E.g. ATS Resume review, Mock interview feedback, 7-day follow-up"
            />
          </div>
          <select className="input-field" value={serviceForm.counsellorId || ''} onChange={(e) => setServiceForm({ ...serviceForm, counsellorId: e.target.value })}>
            <option value="">Assigned counsellor (optional)</option>
            {counsellors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={serviceForm.isActive} onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })} /> Show on website</label>
          <button type="submit" className="btn-primary w-full">{editService ? 'Update service' : 'Create service'}</button>
        </form>
      </Modal>

      {/* AI Popular Tagline Generator Modal */}
      <Modal
        isOpen={taglineModal.open}
        onClose={() => setTaglineModal((prev) => ({ ...prev, open: false }))}
        title="Popular & Trending Tagline Generator"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Service Topic</p>
                <p className="text-sm font-semibold text-slate-800">{serviceForm.name || 'General Career Mentorship'}</p>
              </div>
              <button
                type="button"
                disabled={taglineModal.loading}
                onClick={() => handleOpenAITaglines()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${taglineModal.loading ? 'animate-spin' : ''}`} />
                {taglineModal.loading ? 'Generating...' : 'Regenerate'}
              </button>
            </div>
            {serviceForm.description && (
              <p className="text-xs text-slate-500 line-clamp-1 border-t border-slate-200/60 pt-1">
                <span className="font-medium text-slate-700">Description context:</span> {serviceForm.description}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600">
            Select a high-converting tagline tailored to your service topic & description:
          </p>

          {taglineModal.loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Analyzing description & fetching trending taglines...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {taglineModal.taglines.map((item, idx) => {
                const isCurrent = serviceForm.tagline === item;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setServiceForm((prev) => ({ ...prev, tagline: item }));
                      setTaglineUserEdited(true);
                      setTaglineModal((prev) => ({ ...prev, open: false }));
                      showSuccess('Tagline applied!');
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium group-hover:text-indigo-950">
                        {item}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-indigo-600 border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}
                    >
                      {isCurrent ? <Check className="w-3 h-3" /> : null}
                      {isCurrent ? 'Active' : 'Use this'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {taglineModal.suggestedIncludes && (
            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex items-start justify-between gap-3">
              <div className="text-xs">
                <p className="font-semibold text-indigo-900 mb-0.5">🎯 Service-Specific Deliverables (Includes):</p>
                <p className="text-indigo-700 leading-relaxed text-[11px]">{taglineModal.suggestedIncludes}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setServiceForm((prev) => ({ ...prev, includes: taglineModal.suggestedIncludes }));
                  setIncludesUserEdited(true);
                  showSuccess('Service-specific deliverables applied!');
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-2xs whitespace-nowrap cursor-pointer mt-0.5"
              >
                Apply Includes
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setTaglineModal((prev) => ({ ...prev, open: false }))}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showSession} onClose={() => setShowSession(false)} title={editSession ? 'Edit group session' : 'Add group session'} size="lg">
        <form onSubmit={handleSessionSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1">Title *</label><input required className="input-field" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Topic</label><input className="input-field" value={sessionForm.topic} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Date *</label><input type="date" required className="input-field" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Start</label><input type="time" className="input-field" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">End</label><input type="time" className="input-field" value={sessionForm.endTime} onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Duration</label><input className="input-field" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })} /></div>
            <div>
              <label className="block text-xs font-medium mb-1">Mode</label>
              <select className="input-field" value={sessionForm.mode} onChange={(e) => setSessionForm({ ...sessionForm, mode: e.target.value })}>
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="hall">Institute hall</option>
                <option value="center">Partner center</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium mb-1">Meeting link</label><input className="input-field" value={sessionForm.meetingLink} onChange={(e) => setSessionForm({ ...sessionForm, meetingLink: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Venue</label><input className="input-field" value={sessionForm.venue} onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Seats</label><input type="number" min="1" className="input-field" value={sessionForm.seats} onChange={(e) => setSessionForm({ ...sessionForm, seats: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Fee (₹)</label><input type="number" min="0" className="input-field" value={sessionForm.fee} onChange={(e) => setSessionForm({ ...sessionForm, fee: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Original fee</label><input type="number" min="0" className="input-field" value={sessionForm.originalFee} onChange={(e) => setSessionForm({ ...sessionForm, originalFee: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Language</label><input className="input-field" value={sessionForm.language} onChange={(e) => setSessionForm({ ...sessionForm, language: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Counsellor</label><input className="input-field" value={sessionForm.counsellorName} onChange={(e) => setSessionForm({ ...sessionForm, counsellorName: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Target audience</label><input className="input-field" value={sessionForm.targetAudience} onChange={(e) => setSessionForm({ ...sessionForm, targetAudience: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Interest area</label><input className="input-field" value={sessionForm.interestArea} onChange={(e) => setSessionForm({ ...sessionForm, interestArea: e.target.value })} /></div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select className="input-field" value={sessionForm.status} onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium mb-1">Booking closes</label><input type="datetime-local" className="input-field" value={sessionForm.bookingClosesAt} onChange={(e) => setSessionForm({ ...sessionForm, bookingClosesAt: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Cover image</label>
              <div className="flex gap-2">
                <input className="input-field text-xs" value={sessionForm.coverImage} onChange={(e) => setSessionForm({ ...sessionForm, coverImage: e.target.value })} />
                <label className="btn-secondary text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, (url) => setSessionForm((p) => ({ ...p, coverImage: url })))} />
                </label>
              </div>
            </div>
          </div>
          <div><label className="block text-xs font-medium mb-1">Description</label><textarea rows="2" className="input-field" value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} /></div>
          <select className="input-field" value={sessionForm.counsellorId || ''} onChange={(e) => setSessionForm({ ...sessionForm, counsellorId: e.target.value })}>
            <option value="">Assigned counsellor login (optional)</option>
            {counsellors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sessionForm.showOnWebsite} onChange={(e) => setSessionForm({ ...sessionForm, showOnWebsite: e.target.checked })} /> Show on website when published</label>
          <button type="submit" className="btn-primary w-full">{editSession ? 'Update session' : 'Create session'}</button>
        </form>
      </Modal>
    </div>
  );
}
