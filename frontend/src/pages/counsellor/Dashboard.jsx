import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCounsellorPortal,
  updateCounsellingBooking,
  createCounsellingSlot,
  deleteCounsellingSlot,
  sendCounsellingRecording,
  resendCounsellingJoin,
  updateCounsellingSessionMeetingLink,
  updateProfile,
  changePassword,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import {
  LogOut,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Phone,
  MessageSquare,
  Video,
  Search,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  User,
  Shield,
  FileText,
  Download,
  Sparkles,
  Check,
  TrendingUp,
} from 'lucide-react';

export default function CounsellorDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ sessions: [], bookings: [], slots: [], services: [] });
  const [activeTab, setActiveTab] = useState('overview'); // overview | bookings | sessions | slots
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all'); // all | today | upcoming | attended | no_show | converted

  // Forms and Modals State
  const [slotForm, setSlotForm] = useState({ serviceId: '', startAt: '', endAt: '' });
  const [recUrls, setRecUrls] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [notesModal, setNotesModal] = useState({ open: false, booking: null, note: '' });
  const [convertModal, setConvertModal] = useState({ open: false, booking: null, course: '', note: '' });
  const [attendeesModal, setAttendeesModal] = useState({ open: false, session: null });
  const [meetingModal, setMeetingModal] = useState({ open: false, session: null, meetingLink: '', mode: 'zoom' });
  const [profileModal, setProfileModal] = useState(false);

  // Profile Form
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getCounsellorPortal();
      setData(res.data || { sessions: [], bookings: [], slots: [], services: [] });
    } catch {
      showError('Failed to load counselling portal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  // Copy helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Date Checkers
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (d) => isSameDay(d, new Date());

  const isFuture = (d) => {
    if (!d) return false;
    return new Date(d).getTime() > Date.now();
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalBookings = data.bookings.length;
    const attendedCount = data.bookings.filter((b) => b.attended || b.status === 'attended').length;
    const convertedCount = data.bookings.filter((b) => b.convertedToAdmission).length;
    const conversionRate = totalBookings > 0 ? Math.round((convertedCount / totalBookings) * 100) : 0;

    const todayBookings = data.bookings.filter((b) => {
      const scheduleTime = b.slotId?.startAt || b.sessionId?.date;
      return scheduleTime ? isToday(scheduleTime) : isToday(b.createdAt);
    });

    const todaySessions = data.sessions.filter((s) => isToday(s.date));
    const todayTotal = todayBookings.length + todaySessions.length;
    const openSlots = data.slots.filter((s) => s.status === 'open').length;

    return {
      totalBookings,
      attendedCount,
      convertedCount,
      conversionRate,
      todayTotal,
      openSlots,
      totalSessions: data.sessions.length,
    };
  }, [data]);

  // Next Upcoming Meeting (1-on-1 or Webinar)
  const nextUpcoming = useMemo(() => {
    const upcomingEvents = [];

    // Check sessions
    data.sessions.forEach((s) => {
      if (s.date && isFuture(s.date)) {
        upcomingEvents.push({
          type: 'group',
          title: s.title,
          startAt: new Date(s.date),
          timeStr: `${new Date(s.date).toLocaleDateString()} ${s.startTime || ''}`,
          meetingLink: s.meetingLink,
          mode: s.mode,
          data: s,
        });
      }
    });

    // Check 1-on-1 bookings
    data.bookings.forEach((b) => {
      const start = b.slotId?.startAt;
      if (start && isFuture(start) && b.status !== 'cancelled' && b.status !== 'attended') {
        upcomingEvents.push({
          type: 'one_on_one',
          title: `${b.name} (${b.itemTitle || '1-on-1 Counselling'})`,
          startAt: new Date(start),
          timeStr: new Date(start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
          candidateName: b.name,
          phone: b.phone,
          meetingLink: b.sessionId?.meetingLink || '',
          data: b,
        });
      }
    });

    upcomingEvents.sort((a, b) => a.startAt - b.startAt);
    return upcomingEvents[0] || null;
  }, [data]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return data.bookings.filter((b) => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        b.name?.toLowerCase().includes(term) ||
        b.phone?.includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.bookingCode?.toLowerCase().includes(term) ||
        b.city?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Status Tabs
      const scheduleTime = b.slotId?.startAt || b.sessionId?.date;
      if (bookingStatusFilter === 'today') {
        return scheduleTime ? isToday(scheduleTime) : isToday(b.createdAt);
      }
      if (bookingStatusFilter === 'upcoming') {
        return scheduleTime ? isFuture(scheduleTime) && b.status !== 'attended' && b.status !== 'cancelled' : false;
      }
      if (bookingStatusFilter === 'attended') {
        return b.attended || b.status === 'attended';
      }
      if (bookingStatusFilter === 'no_show') {
        return b.status === 'no_show';
      }
      if (bookingStatusFilter === 'converted') {
        return b.convertedToAdmission;
      }
      return true;
    });
  }, [data.bookings, searchTerm, bookingStatusFilter]);

  // Today's Agenda (Combined Bookings & Sessions for Today)
  const todayAgenda = useMemo(() => {
    const items = [];
    data.bookings.forEach((b) => {
      const time = b.slotId?.startAt;
      if (time && isToday(time)) {
        items.push({
          type: '1-on-1 Appointment',
          title: `${b.name} - ${b.itemTitle || 'Career Counseling'}`,
          time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: new Date(time).getTime(),
          booking: b,
        });
      }
    });

    data.sessions.forEach((s) => {
      if (s.date && isToday(s.date)) {
        items.push({
          type: 'Group Webinar',
          title: s.title,
          time: s.startTime || 'Scheduled',
          rawTime: new Date(s.date).getTime(),
          session: s,
        });
      }
    });

    return items.sort((a, b) => a.rawTime - b.rawTime);
  }, [data]);

  // Patch Booking Status / Notes
  const handleUpdateBooking = async (id, payload, successMsg) => {
    try {
      await updateCounsellingBooking(id, payload);
      showSuccess(successMsg || 'Updated successfully');
      loadData();
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to update booking');
    }
  };

  // WhatsApp helper
  const openWhatsApp = (b) => {
    const cleanPhone = (b.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return showError('No valid phone number found');

    const slotTime = b.slotId?.startAt
      ? new Date(b.slotId.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
      : 'scheduled time';

    const text = encodeURIComponent(
      `Namaste ${b.name}! 👋\n\nI am ${user?.name || 'your Career Counsellor'} regarding your Career Guidance session scheduled for *${slotTime}* (Ref: *${b.bookingCode}*).\n\nPlease let me know if you have any questions before our call. Excited to speak with you!`
    );

    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  // Call helper
  const makeCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Export Webinar Attendees to CSV
  const exportWebinarAttendees = (session) => {
    const attendees = data.bookings.filter((b) => String(b.sessionId?._id || b.sessionId) === String(session._id));
    if (attendees.length === 0) {
      return showError('No registered attendees found to export');
    }

    const headers = ['Booking Code,Name,Phone,Email,City,Amount,Attended,Converted,Created At'];
    const rows = attendees.map((a) => [
      `"${a.bookingCode || ''}"`,
      `"${a.name || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.email || ''}"`,
      `"${a.city || ''}"`,
      `"${a.amount || 0}"`,
      `"${a.attended ? 'Yes' : 'No'}"`,
      `"${a.convertedToAdmission ? a.convertedCourse || 'Yes' : 'No'}"`,
      `"${new Date(a.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${session.title.replace(/\s+/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmittingProfile(true);
      const res = await updateProfile(profileForm);
      if (updateUser) updateUser(res.data?.user || profileForm);
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showError('New password and confirm password do not match');
    }
    try {
      setSubmittingPassword(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfileModal(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Modern Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-base tracking-tight">{user?.name || 'Counsellor'}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Career Expert
                </span>
              </div>
              <p className="text-xs text-slate-400">Counselling & Mentorship Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={loadData}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setProfileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Profile & Security</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/counsellor/login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Today', icon: Clock, count: stats.todayTotal },
            { id: 'bookings', label: '1-on-1 Appointments', icon: Users, count: stats.totalBookings },
            { id: 'sessions', label: 'Group Webinars', icon: Video, count: stats.totalSessions },
            { id: 'slots', label: 'Availability Slots', icon: Calendar, count: stats.openSlots },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      active ? 'bg-indigo-700/80 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ===================== TAB 1: OVERVIEW & TODAY ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Next Upcoming Meeting Highlight Banner */}
            {nextUpcoming && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-800 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Next Upcoming Session
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {nextUpcoming.timeStr}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      {nextUpcoming.title}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl">
                      {nextUpcoming.type === 'one_on_one'
                        ? `Candidate Phone: ${nextUpcoming.phone || 'N/A'} • Make sure you are prepared with course details & syllabus.`
                        : 'Group masterclass webinar with enrolled candidates.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {nextUpcoming.meetingLink ? (
                      <a
                        href={nextUpcoming.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition"
                      >
                        <Video className="w-4 h-4" />
                        Join Call Now
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          if (nextUpcoming.type === 'group') {
                            setMeetingModal({
                              open: true,
                              session: nextUpcoming.data,
                              meetingLink: nextUpcoming.data.meetingLink || '',
                              mode: nextUpcoming.data.mode || 'zoom',
                            });
                          } else {
                            showError('No meeting link set yet. You can share Google Meet link via WhatsApp/Email.');
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg transition"
                      >
                        <Plus className="w-4 h-4" />
                        Set Meeting Link
                      </button>
                    )}

                    {nextUpcoming.type === 'one_on_one' && nextUpcoming.data && (
                      <button
                        onClick={() => openWhatsApp(nextUpcoming.data)}
                        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-indigo-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Today's Schedule</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.todayTotal}</span>
                  <span className="text-[11px] text-slate-400">sessions today</span>
                </div>
                <div className="mt-2 text-[11px] text-indigo-400 flex items-center gap-1">
                  <span>Keep track of timely join</span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Paid Bookings</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalBookings}</span>
                  <span className="text-[11px] text-slate-400">candidates</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <span>All confirmed & paid</span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-violet-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Attended / Completed</span>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.attendedCount}</span>
                  <span className="text-[11px] text-slate-400">students</span>
                </div>
                <div className="mt-2 text-[11px] text-violet-400 flex items-center gap-1">
                  <span>Successfully counselled</span>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Admission Conversions</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{stats.convertedCount}</span>
                  <span className="text-xs font-bold text-amber-400">({stats.conversionRate}%)</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1">
                  <span>Enrolled into courses</span>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Today's Agenda + Quick Actions & Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Agenda List */}
              <div className="lg:col-span-2 bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Today's Agenda & Timeline
                    </h3>
                    <p className="text-xs text-slate-400">Sessions and appointments scheduled for today</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300">
                    {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {todayAgenda.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-700/60 rounded-xl bg-slate-800/30">
                    <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No appointments scheduled for today</p>
                    <p className="text-xs text-slate-500 mt-1">You have open slots available or no bookings today.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAgenda.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-400">{item.time}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {item.type}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-white mt-0.5">{item.title}</h4>
                            {item.booking && (
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>Phone: {item.booking.phone}</span>
                                {item.booking.city && <span>• {item.booking.city}</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {item.booking && (
                            <>
                              <button
                                onClick={() => openWhatsApp(item.booking)}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                title="WhatsApp Candidate"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => makeCall(item.booking.phone)}
                                className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition"
                                title="Call Candidate"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateBooking(
                                    item.booking._id,
                                    { attended: true },
                                    `Marked ${item.booking.name} as attended`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                              >
                                Attended
                              </button>
                            </>
                          )}
                          {item.session && item.session.meetingLink && (
                            <a
                              href={item.session.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Video className="w-3.5 h-3.5" /> Join
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Quick Slot Adder & Summary */}
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Add Quick Slot
                    </h3>
                    <p className="text-xs text-slate-400">Open an available 1-on-1 slot for students to book</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await createCounsellingSlot(slotForm);
                        showSuccess('New 1-on-1 slot opened successfully');
                        setSlotForm({
                          serviceId: data.services[0]?._id || '',
                          startAt: '',
                          endAt: '',
                        });
                        loadData();
                      } catch (err) {
                        showError(err.response?.data?.message || 'Failed to add slot');
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Counselling Service</label>
                      <select
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={slotForm.serviceId}
                        onChange={(e) => setSlotForm({ ...slotForm, serviceId: e.target.value })}
                      >
                        <option value="">Select Service...</option>
                        {data.services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.duration || '30 min'} - ₹{s.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time</label>
                      <input
                        required
                        type="datetime-local"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={slotForm.startAt}
                        onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
                    >
                      Publish Open Slot
                    </button>
                  </form>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Counsellor Guidelines
                  </div>
                  <p>• Connect with candidates at least 2 minutes prior to the scheduled slot time.</p>
                  <p>• Mark student as "Attended" once the session completes to update records.</p>
                  <p>• If student shows interest in a franchise course, use "Convert to Admission" to log the lead.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: 1-ON-1 APPOINTMENTS & CANDIDATES ===================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by candidate name, phone, email, booking code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Today' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'attended', label: 'Attended' },
                  { id: 'no_show', label: 'No-Show' },
                  { id: 'converted', label: 'Converted' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBookingStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      bookingStatusFilter === f.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings List Cards */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No candidates match your search</p>
                <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredBookings.map((b) => {
                  const scheduleTime = b.slotId?.startAt || b.sessionId?.date;

                  return (
                    <div
                      key={b._id}
                      className="bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                            {b.name ? b.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-base">{b.name}</h3>
                              <button
                                onClick={() => copyToClipboard(b.bookingCode, b._id)}
                                className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                                title="Click to copy booking code"
                              >
                                {copiedId === b._id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {b.bookingCode}
                              </button>
                            </div>
                            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                              <span>📞 {b.phone}</span>
                              {b.email && <span>✉️ {b.email}</span>}
                              {b.city && <span>📍 {b.city}</span>}
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                          {b.convertedToAdmission ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <GraduationCap className="w-3 h-3" />
                              Converted ({b.convertedCourse || 'Course'})
                            </span>
                          ) : b.attended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Attended
                            </span>
                          ) : b.status === 'no_show' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              No-Show
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <Clock className="w-3 h-3" />
                              Confirmed
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ₹{b.amount || 0} Paid
                          </span>
                        </div>
                      </div>

                      {/* Service & Time Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-400">Item / Service: </span>
                          <span className="font-semibold text-slate-200">
                            {b.itemTitle || b.serviceId?.name || b.sessionId?.title || '1-on-1 Guidance'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Scheduled Time: </span>
                          <span className="font-semibold text-indigo-300">
                            {scheduleTime
                              ? new Date(scheduleTime).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : 'Not scheduled'}
                          </span>
                        </div>
                        {b.message && (
                          <div className="sm:col-span-2 text-slate-300 mt-1">
                            <span className="text-slate-400 font-medium">Candidate Note/Query: </span>"{b.message}"
                          </div>
                        )}
                        {b.adminNote && (
                          <div className="sm:col-span-2 text-amber-300/90 mt-1 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                            <span className="font-semibold text-amber-400">Counsellor Remark: </span>
                            {b.adminNote}
                          </div>
                        )}
                      </div>

                      {/* Candidate Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openWhatsApp(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => makeCall(b.phone)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </button>

                          <button
                            type="button"
                            onClick={() => setNotesModal({ open: true, booking: b, note: b.adminNote || '' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {b.adminNote ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>

                        {/* Status Toggles & Conversions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {!b.attended && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBooking(b._id, { attended: true }, 'Marked as Attended')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                            >
                              Attended
                            </button>
                          )}

                          {b.status !== 'no_show' && !b.attended && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBooking(b._id, { status: 'no_show' }, 'Marked as No-Show')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
                            >
                              No-Show
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setConvertModal({
                                open: true,
                                booking: b,
                                course: b.convertedCourse || '',
                                note: b.adminNote || '',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Convert to Admission
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await resendCounsellingJoin(b._id);
                                showSuccess('Join details emailed to candidate');
                              } catch (e) {
                                showError(e.response?.data?.message || 'Failed to email details');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
                            title="Resend email confirmation & join instructions"
                          >
                            Resend Email
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: GROUP WEBINARS & MASTERCLASSES ===================== */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-400" />
                  Assigned Group Webinars & Sessions
                </h2>
                <p className="text-xs text-slate-400">
                  Manage meeting links, enrolled students, and session recordings
                </p>
              </div>
            </div>

            {data.sessions.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
                <Video className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No group sessions assigned</p>
                <p className="text-xs text-slate-500">Super Admin assigns group webinars to counsellors.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.sessions.map((s) => {
                  const attendees = data.bookings.filter(
                    (b) => String(b.sessionId?._id || b.sessionId) === String(s._id)
                  );
                  const registeredCount = s.bookedCount || attendees.length;
                  const seatCapacity = s.seats || 30;
                  const percentFilled = Math.min(100, Math.round((registeredCount / seatCapacity) * 100));

                  return (
                    <div
                      key={s._id}
                      className="bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {s.mode || 'Online'}
                            </span>
                            <h3 className="font-bold text-white text-base mt-1.5">{s.title}</h3>
                            {s.topic && <p className="text-xs text-slate-300 mt-0.5">{s.topic}</p>}
                          </div>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            {s.fee > 0 ? `₹${s.fee}` : 'FREE'}
                          </span>
                        </div>

                        {/* Date & Time Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="flex items-center gap-1 text-slate-200 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            {s.date ? new Date(s.date).toLocaleDateString([], { dateStyle: 'medium' }) : 'TBD'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-200 font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {s.startTime || '11:00'} - {s.endTime || '12:30'} ({s.duration || '90 min'})
                          </span>
                        </div>

                        {/* Registration Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Registrations</span>
                            <span className="font-semibold text-slate-200">
                              {registeredCount} / {seatCapacity} seats ({percentFilled}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${percentFilled}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Meeting Link Display */}
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Meeting Link:</span>
                            <button
                              onClick={() =>
                                setMeetingModal({
                                  open: true,
                                  session: s,
                                  meetingLink: s.meetingLink || '',
                                  mode: s.mode || 'zoom',
                                })
                              }
                              className="text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              {s.meetingLink ? 'Change Link' : 'Add Link'}
                            </button>
                          </div>
                          {s.meetingLink ? (
                            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                              <a
                                href={s.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-300 hover:underline truncate flex-1 font-mono text-[11px]"
                              >
                                {s.meetingLink}
                              </a>
                              <button
                                onClick={() => copyToClipboard(s.meetingLink, `meet-${s._id}`)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Copy meeting link"
                              >
                                {copiedId === `meet-${s._id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">No link added yet</p>
                          )}
                        </div>

                        {/* Recording URL & Broadcast */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <label className="block text-xs font-semibold text-slate-300">
                            Class Recording Broadcast (YouTube / Drive URL)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://youtu.be/... or Google Drive link"
                              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              value={recUrls[s._id] !== undefined ? recUrls[s._id] : s.recordingUrl || ''}
                              onChange={(e) => setRecUrls({ ...recUrls, [s._id]: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const url = recUrls[s._id] !== undefined ? recUrls[s._id] : s.recordingUrl;
                                if (!url) return showError('Please enter recording URL first');
                                try {
                                  await sendCounsellingRecording(s._id, { recordingUrl: url });
                                  showSuccess('Recording emailed to paid attendees!');
                                  loadData();
                                } catch (e) {
                                  showError(e.response?.data?.message || 'Failed to email recording');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition"
                            >
                              Email Recording
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setAttendeesModal({ open: true, session: s })}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          View Candidates ({registeredCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => exportWebinarAttendees(s)}
                          className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition"
                        >
                          <Download className="w-3 h-3" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: SLOT AVAILABILITY MANAGER ===================== */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Slot Availability Management
                </h2>
                <p className="text-xs text-slate-400">
                  Control your 1-on-1 counseling time slots available for students to book on the website
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Open ({stats.openSlots})
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Booked (
                  {data.slots.filter((s) => s.status === 'booked').length})
                </span>
              </div>
            </div>

            {/* Quick Add Form */}
            <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add New Available Slot
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await createCounsellingSlot(slotForm);
                    showSuccess('Slot added successfully');
                    setSlotForm({
                      serviceId: data.services[0]?._id || '',
                      startAt: '',
                      endAt: '',
                    });
                    loadData();
                  } catch (err) {
                    showError(err.response?.data?.message || 'Failed to add slot');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={slotForm.serviceId}
                    onChange={(e) => setSlotForm({ ...slotForm, serviceId: e.target.value })}
                  >
                    <option value="">Select Service...</option>
                    {data.services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} (₹{s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    value={slotForm.startAt}
                    onChange={(e) => setSlotForm({ ...slotForm, startAt: e.target.value })}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition"
                  >
                    Add Availability Slot
                  </button>
                </div>
              </form>
            </div>

            {/* Slots List */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Your Scheduled Slots</h3>

              {data.slots.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No slots created yet. Add a slot above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.slots.map((sl) => {
                    const isBooked = sl.status === 'booked';
                    const isHeld = sl.status === 'held';

                    return (
                      <div
                        key={sl._id}
                        className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isBooked ? 'bg-rose-400' : isHeld ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                              }`}
                            ></span>
                            <span className="text-xs font-semibold text-white">
                              {new Date(sl.startAt).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 pl-4">
                            {sl.serviceId?.name || '1-on-1 Guidance'} •{' '}
                            <span className="uppercase font-semibold text-[10px]">
                              {isBooked ? 'Booked' : isHeld ? 'Seat Held' : 'Open'}
                            </span>
                          </p>
                        </div>

                        {!isBooked && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Delete this available slot?')) {
                                try {
                                  await deleteCounsellingSlot(sl._id);
                                  showSuccess('Slot deleted');
                                  loadData();
                                } catch (e) {
                                  showError(e.response?.data?.message || 'Failed to delete slot');
                                }
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete open slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAL: COUNSELLOR NOTES & FEEDBACK ===================== */}
      <Modal
        isOpen={notesModal.open}
        onClose={() => setNotesModal({ open: false, booking: null, note: '' })}
        title={`Session Remarks: ${notesModal.booking?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Add notes regarding candidate career path, advice given, and recommended courses.
          </p>

          <textarea
            rows={5}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="E.g. Student interested in Full Stack Development & DCA. Suggested starting with DCA..."
            value={notesModal.note}
            onChange={(e) => setNotesModal({ ...notesModal, note: e.target.value })}
          ></textarea>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNotesModal({ open: false, booking: null, note: '' })}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleUpdateBooking(
                  notesModal.booking?._id,
                  { adminNote: notesModal.note },
                  'Notes saved successfully'
                );
                setNotesModal({ open: false, booking: null, note: '' });
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Save Notes
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: CONVERT TO ADMISSION ===================== */}
      <Modal
        isOpen={convertModal.open}
        onClose={() => setConvertModal({ open: false, booking: null, course: '', note: '' })}
        title={`Convert to Course Admission: ${convertModal.booking?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Record that this student has agreed to take admission into an institute course following counselling.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target / Enrolled Course</label>
            <input
              type="text"
              placeholder="E.g. ADCA, Web Development, Tally Prime..."
              value={convertModal.course}
              onChange={(e) => setConvertModal({ ...convertModal, course: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admission Note / Follow-up</label>
            <textarea
              rows={3}
              placeholder="Details on fee discount, partner center, or batch preference..."
              value={convertModal.note}
              onChange={(e) => setConvertModal({ ...convertModal, note: e.target.value })}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConvertModal({ open: false, booking: null, course: '', note: '' })}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleUpdateBooking(
                  convertModal.booking?._id,
                  {
                    convertedToAdmission: true,
                    convertedCourse: convertModal.course,
                    adminNote: convertModal.note || convertModal.booking?.adminNote,
                  },
                  'Successfully marked as Converted to Admission!'
                );
                setConvertModal({ open: false, booking: null, course: '', note: '' });
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              Confirm Conversion
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: SESSION MEETING LINK ===================== */}
      <Modal
        isOpen={meetingModal.open}
        onClose={() => setMeetingModal({ open: false, session: null, meetingLink: '', mode: 'zoom' })}
        title={`Set Meeting Link: ${meetingModal.session?.title || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Add Google Meet or Zoom link. Candidates will be able to join using this link.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Platform</label>
            <select
              value={meetingModal.mode}
              onChange={(e) => setMeetingModal({ ...meetingModal, mode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="zoom">Zoom</option>
              <option value="meet">Google Meet</option>
              <option value="hall">Institute Hall</option>
              <option value="center">Partner Center</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting URL</label>
            <input
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom URL"
              value={meetingModal.meetingLink}
              onChange={(e) => setMeetingModal({ ...meetingModal, meetingLink: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMeetingModal({ open: false, session: null, meetingLink: '', mode: 'zoom' })}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await updateCounsellingSessionMeetingLink(meetingModal.session?._id, {
                    meetingLink: meetingModal.meetingLink,
                    mode: meetingModal.mode,
                  });
                  showSuccess('Meeting link updated successfully');
                  setMeetingModal({ open: false, session: null, meetingLink: '', mode: 'zoom' });
                  loadData();
                } catch (e) {
                  showError(e.response?.data?.message || 'Failed to update meeting link');
                }
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Save Link
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: WEBINAR ATTENDEES LIST ===================== */}
      <Modal
        isOpen={attendeesModal.open}
        onClose={() => setAttendeesModal({ open: false, session: null })}
        title={`Enrolled Candidates: ${attendeesModal.session?.title || ''}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Paid and confirmed participants for this webinar</p>
            {attendeesModal.session && (
              <button
                type="button"
                onClick={() => exportWebinarAttendees(attendeesModal.session)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {attendeesModal.session &&
              data.bookings
                .filter((b) => String(b.sessionId?._id || b.sessionId) === String(attendeesModal.session?._id))
                .map((b) => (
                  <div
                    key={b._id}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <p className="font-bold text-white">{b.name}</p>
                      <p className="text-slate-400 text-[11px]">
                        📞 {b.phone} • {b.city || 'N/A'} • Ref: {b.bookingCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openWhatsApp(b)}
                        className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleUpdateBooking(b._id, { attended: !b.attended }, 'Attendance updated')}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          b.attended ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {b.attended ? 'Attended' : 'Mark Present'}
                      </button>
                    </div>
                  </div>
                ))}

            {attendeesModal.session &&
              data.bookings.filter(
                (b) => String(b.sessionId?._id || b.sessionId) === String(attendeesModal.session?._id)
              ).length === 0 && (
                <p className="text-center py-8 text-xs text-slate-500">No students registered yet.</p>
              )}
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL: PROFILE & SECURITY ===================== */}
      <Modal isOpen={profileModal} onClose={() => setProfileModal(false)} title="My Profile & Security Settings">
        <div className="space-y-6">
          {/* Profile Details Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3 pb-4 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Personal Details
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Read-only)</label>
              <input
                disabled
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={submittingProfile}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              {submittingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>

          {/* Password Change Form */}
          <form onSubmit={handleChangePassword} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Change Password
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
              <input
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              {submittingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
