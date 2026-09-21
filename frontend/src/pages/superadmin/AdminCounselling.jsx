import { useState, useEffect } from 'react';
import {
  getCounsellingSettings, updateCounsellingSettings,
  getCounsellingServices, createCounsellingService, updateCounsellingService, deleteCounsellingService,
  scheduleCounsellingGroupSession,
  getCounsellingSessions,
  uploadOrgImage, getCounsellingBookings, createManualCounsellingBooking, updateCounsellingBooking,
  getCounsellors, createCounsellor, updateCounsellor, deleteCounsellor,
  copyCounsellingSession, getCounsellingWaitlist,
  createCounsellingSlot, getCounsellingSlots, deleteCounsellingSlot, sendCounsellingRecording, resendCounsellingJoin,
} from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Plus, Edit, Trash2, Save, Users, Video, Calendar, Upload, ClipboardList, Sparkles, Phone, MessageCircle, Clock, Link as LinkIcon, Send } from 'lucide-react';

const emptyService = {
  name: '', tagline: '', description: '', duration: '30 min', mode: 'video',
  price: 499, originalPrice: '',
  enableGroupSession: false, groupPrice: '', originalGroupPrice: '',
  groupSessionDate: '', groupSessionStartTime: '11:00', groupSessionEndTime: '12:30',
  groupSessionDuration: '60 min', groupSessionMeetingLink: '',
  includes: '', badge: '', image: '', isActive: true, counsellorId: '',
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
  const [scheduleService, setScheduleService] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    groupSessionDate: '',
    groupSessionStartTime: '11:00',
    groupSessionEndTime: '12:30',
    groupSessionDuration: '60 min',
    groupSessionMeetingLink: '',
    notifyCandidates: true,
  });
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

  const toDateInput = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
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
    const hasGroup = s.enableGroupSession || (s.groupPrice !== undefined && s.groupPrice !== null && s.groupPrice !== '');
    setServiceForm({
      name: s.name || '', tagline: s.tagline || '', description: s.description || '',
      duration: s.duration || '30 min', mode: s.mode || 'video',
      price: s.price ?? 0, originalPrice: s.originalPrice || '',
      enableGroupSession: hasGroup,
      groupPrice: s.groupPrice !== undefined && s.groupPrice !== null ? s.groupPrice : '',
      originalGroupPrice: s.originalGroupPrice || '',
      groupSessionDate: s.groupSessionDate ? toDateInput(s.groupSessionDate) : '',
      groupSessionStartTime: s.groupSessionStartTime || '11:00',
      groupSessionEndTime: s.groupSessionEndTime || '12:30',
      groupSessionDuration: s.groupSessionDuration || '60 min',
      groupSessionMeetingLink: s.groupSessionMeetingLink || '',
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
        tagline: '',
        price: Number(serviceForm.price) || 0,
        originalPrice: Number(serviceForm.originalPrice) || 0,
        enableGroupSession: Boolean(serviceForm.enableGroupSession),
        groupPrice: serviceForm.enableGroupSession && serviceForm.groupPrice !== '' ? Number(serviceForm.groupPrice) : undefined,
        originalGroupPrice: Number(serviceForm.originalGroupPrice) || 0,
        groupSessionDate: serviceForm.groupSessionDate ? new Date(serviceForm.groupSessionDate) : undefined,
        groupSessionStartTime: serviceForm.groupSessionStartTime || '11:00',
        groupSessionEndTime: serviceForm.groupSessionEndTime || '12:30',
        groupSessionDuration: serviceForm.groupSessionDuration || '60 min',
        groupSessionMeetingLink: serviceForm.groupSessionMeetingLink || '',
        includes: String(serviceForm.includes || '').split(',').map((x) => x.trim()).filter(Boolean),
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

  const openScheduleModal = (s) => {
    setScheduleService(s);
    setScheduleForm({
      groupSessionDate: s.groupSessionDate ? toDateInput(s.groupSessionDate) : '',
      groupSessionStartTime: s.groupSessionStartTime || '11:00',
      groupSessionEndTime: s.groupSessionEndTime || '12:30',
      groupSessionDuration: s.groupSessionDuration || '60 min',
      groupSessionMeetingLink: s.groupSessionMeetingLink || '',
      notifyCandidates: true,
    });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleService) return;
    try {
      const res = await scheduleCounsellingGroupSession(scheduleService._id, scheduleForm);
      showSuccess(
        scheduleForm.notifyCandidates && res.data.notifiedCount > 0
          ? `Schedule saved & email sent to ${res.data.notifiedCount} candidate(s)!`
          : 'Group session schedule saved!'
      );
      setScheduleService(null);
      load();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update schedule');
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

  const groupServices = services.filter(
    (s) => s.enableGroupSession || (s.groupPrice !== undefined && s.groupPrice !== null && s.groupPrice !== '')
  );

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
          <Video className="w-4 h-4 inline mr-1" /> 1-on-1 Services ({services.length})
        </button>
        <button onClick={() => setTab('sessions')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'sessions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
          <Users className="w-4 h-4 inline mr-1" /> Group Batches ({groupServices.length})
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
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditService(s)} className="text-indigo-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteService(s._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="font-bold text-indigo-700">1-on-1: ₹{s.price} · Group: ₹{s.groupPrice ?? 0} · {s.duration}</span>
                  {s.isActive ? <span className="badge badge-success text-[10px]">Live</span> : <span className="badge badge-warning text-[10px]">Hidden</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-indigo-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Group Batches & Schedules
              </h3>
              <p className="text-xs text-indigo-700 mt-1">
                Group sessions are automatically created from your 1-on-1 services whenever Group Session is enabled or a Group Fee is configured. Set the batch Date & Time below—registered candidates will be notified automatically by email.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab('services')}
              className="btn-secondary text-xs shrink-0 self-start sm:self-center"
            >
              Configure Service Fees
            </button>
          </div>

          <div className="space-y-3">
            {groupServices.length === 0 && (
              <div className="text-center py-12 card bg-slate-50 border-dashed border-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No group sessions active</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  To offer a group session, edit any service in the 1-on-1 Services tab and enable "Group Session" with its fee.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('services')}
                  className="mt-3 btn-primary text-xs"
                >
                  Go to 1-on-1 Services
                </button>
              </div>
            )}
            {groupServices.map((s) => {
              const hasDate = Boolean(s.groupSessionDate);
              const bookedCount = s.bookedGroupCount || 0;
              return (
                <div key={s._id} className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 hover:border-indigo-200 transition">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-800">{s.name}</h3>
                      <span className="badge text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                        Group Fee: ₹{s.groupPrice ?? 0}
                      </span>
                      {s.originalGroupPrice > 0 && (
                        <span className="text-xs text-slate-400 line-through">₹{s.originalGroupPrice}</span>
                      )}
                      <span className="badge text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        👥 {bookedCount} Candidate{bookedCount === 1 ? '' : 's'} registered
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      {hasDate ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(s.groupSessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.groupSessionStartTime} – {s.groupSessionEndTime}
                          {s.groupSessionDuration ? ` (${s.groupSessionDuration})` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Date & Time: Organization fix karegi (Pending schedule)
                        </span>
                      )}

                      {s.groupSessionMeetingLink && (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                          <LinkIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                          {s.groupSessionMeetingLink}
                        </span>
                      )}
                    </div>

                    {s.groupSessionNotifiedAt && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Send className="w-3 h-3 text-slate-400" />
                        Last notification emailed to candidates: {new Date(s.groupSessionNotifiedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openScheduleModal(s)}
                      className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {hasDate ? 'Update Date & Time / Notify' : 'Set Date & Time & Email Candidates'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditService(s)}
                      className="btn-secondary text-xs flex items-center gap-1"
                      title="Edit Service Details or Fee"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Service
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
            <select
              required
              className="input-field"
              value={manualForm.serviceId ? `svc_${manualForm.serviceId}` : (manualForm.sessionId || '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith('svc_')) {
                  const sId = val.replace('svc_', '');
                  const svc = services.find((x) => x._id === sId);
                  setManualForm({
                    ...manualForm,
                    serviceId: sId,
                    sessionId: '',
                    amount: manualForm.amount === '' ? (svc?.groupPrice ?? 0) : manualForm.amount,
                  });
                } else {
                  const ses = sessions.find((x) => x._id === val);
                  setManualForm({
                    ...manualForm,
                    sessionId: val,
                    serviceId: '',
                    amount: manualForm.amount === '' ? (ses?.fee ?? '') : manualForm.amount,
                  });
                }
              }}
            >
              <option value="">Select group service batch...</option>
              {groupServices.length > 0 ? (
                groupServices.map((s) => (
                  <option key={s._id} value={`svc_${s._id}`}>
                    {s.name} (Fee: ₹{s.groupPrice ?? 0}) {s.groupSessionDate ? `[📅 ${new Date(s.groupSessionDate).toLocaleDateString()}]` : '[Date TBA]'}
                  </option>
                ))
              ) : (
                <option value="" disabled>No group services available</option>
              )}
            </select>
          ) : (
            <select required className="input-field" value={manualForm.serviceId} onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}>
              <option value="">Select service</option>
              {services.map((s) => <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>)}
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                required
                className="input-field"
                placeholder="e.g. 1-on-1 Career Strategy Consultation"
                value={serviceForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setServiceForm((prev) => {
                    const next = { ...prev, name: val };
                    if (!taglineUserEdited) next.tagline = getContextualTagline(val, next.description);
                    if (!includesUserEdited) next.includes = getContextualIncludes(val, next.description);
                    return next;
                  });
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Consultation Modes (Available to students)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'video', label: 'Video Call', icon: Video, color: 'text-indigo-600' },
                  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'text-emerald-600' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = (serviceForm.mode || 'video') === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setServiceForm({ ...serviceForm, mode: m.id })}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? m.color : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Duration</label><input className="input-field" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">Badge</label><input className="input-field" placeholder="Popular / New" value={serviceForm.badge} onChange={(e) => setServiceForm({ ...serviceForm, badge: e.target.value })} /></div>
            
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">1-on-1 Consultation Pricing</span>
            </div>
            <div><label className="block text-xs font-medium mb-1">1-on-1 Price (₹) *</label><input type="number" min="0" className="input-field" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
            <div><label className="block text-xs font-medium mb-1">1-on-1 Original price (optional)</label><input type="number" min="0" className="input-field" value={serviceForm.originalPrice} onChange={(e) => setServiceForm({ ...serviceForm, originalPrice: e.target.value })} /></div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wide cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(serviceForm.enableGroupSession)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setServiceForm((p) => ({
                        ...p,
                        enableGroupSession: checked,
                        groupPrice: checked ? (p.groupPrice !== '' && p.groupPrice !== undefined ? p.groupPrice : 199) : '',
                      }));
                    }}
                  />
                  Enable Group Session For This Service
                </label>
                <span className="text-[11px] text-slate-400">Set 0 for FREE group session</span>
              </div>
              <p className="text-[11px] text-slate-500">
                When enabled, candidates can book this service as a group session at this specific group fee. The date & time will be set by the organization.
              </p>
            </div>
            {serviceForm.enableGroupSession && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">Group Session Fee (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required={serviceForm.enableGroupSession}
                    className="input-field"
                    placeholder="E.g. 199 or 0"
                    value={serviceForm.groupPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, groupPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Group Original Price (optional strike-through)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="E.g. 499"
                    value={serviceForm.originalGroupPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, originalGroupPrice: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
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
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              rows="2"
              className="input-field"
              placeholder="Briefly describe what this counselling service covers..."
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
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

      {/* Schedule Group Batch Modal */}
      <Modal
        isOpen={Boolean(scheduleService)}
        onClose={() => setScheduleService(null)}
        title={scheduleService ? `Set Date & Time: ${scheduleService.name}` : 'Group Schedule'}
        size="md"
      >
        {scheduleService && (
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800">
              <p className="font-semibold mb-0.5">📅 Group Batch Schedule & Candidate Notification</p>
              <p>
                Set the date, time and meeting link for this group batch. If the checkbox below is selected, an automated confirmation email with meeting details will be sent immediately to all registered candidates ({scheduleService.bookedGroupCount || 0} candidate(s)).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Session Date *</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={scheduleForm.groupSessionDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, groupSessionDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  className="input-field"
                  value={scheduleForm.groupSessionStartTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, groupSessionStartTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">End Time</label>
                <input
                  type="time"
                  className="input-field"
                  value={scheduleForm.groupSessionEndTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, groupSessionEndTime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Duration Label</label>
                <input
                  className="input-field"
                  placeholder="e.g. 60 min, 1 hour 30 min"
                  value={scheduleForm.groupSessionDuration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, groupSessionDuration: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Meeting Link (Google Meet / Zoom)</label>
                <input
                  className="input-field"
                  placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                  value={scheduleForm.groupSessionMeetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, groupSessionMeetingLink: e.target.value })}
                />
                <p className="text-[11px] text-slate-400 mt-0.5">This link is kept private and emailed directly to registered students.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={scheduleForm.notifyCandidates}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notifyCandidates: e.target.checked })}
                />
                <span>
                  <strong>Send Email Notification Now:</strong> Send schedule update with meeting link to all {scheduleService.bookedGroupCount || 0} registered candidates.
                </span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleService(null)}
                className="btn-secondary w-1/3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary w-2/3 text-xs flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Save Schedule {scheduleForm.notifyCandidates ? '& Send Email' : ''}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
