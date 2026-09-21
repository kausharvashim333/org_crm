import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTrainerDashboard,
  getTrainerBatches,
  getTrainerBatch,
  updateTrainerBatchProgress,
  updateTrainerMeetingLink,
  getTrainerStudents,
  changePassword,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Users,
  Video,
  Calendar,
  Clock,
  BookOpen,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Key,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  AlertCircle,
  Copy,
  ChevronRight,
  Edit3,
  X,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function TrainerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBatches: 0,
    runningBatchesCount: 0,
    upcomingBatchesCount: 0,
    completedBatchesCount: 0,
    totalStudentsCount: 0,
    coursesCount: 0,
  });

  const [activeTab, setActiveTab] = useState('running'); // 'running' | 'upcoming' | 'completed' | 'all-students'
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [batchStudentsLoading, setBatchStudentsLoading] = useState(false);
  const [batchStudentSearch, setBatchStudentSearch] = useState('');

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [syllabusModules, setSyllabusModules] = useState([]);
  const [batchNotes, setBatchNotes] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ meetingLink: '', timing: '', schedule: '', notes: '' });
  const [savingLink, setSavingLink] = useState(false);

  // All Students Tab State
  const [allStudents, setAllStudents] = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [studentFilterBatch, setStudentFilterBatch] = useState('');

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initial Data Fetch
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, batchRes] = await Promise.all([
        getTrainerDashboard(),
        getTrainerBatches(),
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats || {});
      }
      if (batchRes.data.success) {
        setBatches(batchRes.data.batches || []);
      }
    } catch (err) {
      console.error('Failed to load trainer dashboard:', err);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch All Students when switching to 'all-students' tab
  useEffect(() => {
    if (activeTab === 'all-students' && allStudents.length === 0) {
      fetchAllStudents();
    }
  }, [activeTab]);

  const fetchAllStudents = async () => {
    try {
      setAllStudentsLoading(true);
      const res = await getTrainerStudents();
      if (res.data.success) {
        setAllStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setAllStudentsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/trainer/login');
  };

  // Filter batches based on active tab and search query
  const filteredBatches = useMemo(() => {
    let result = batches;

    if (activeTab === 'running') {
      result = batches.filter((b) => b.status === 'active');
    } else if (activeTab === 'upcoming') {
      result = batches.filter((b) => b.status === 'upcoming');
    } else if (activeTab === 'completed') {
      result = batches.filter((b) => b.status === 'completed' || b.status === 'cancelled');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.batchCode?.toLowerCase().includes(q) ||
          b.courseId?.name?.toLowerCase().includes(q) ||
          b.courseId?.code?.toLowerCase().includes(q) ||
          b.schedule?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [batches, activeTab, searchQuery]);

  // Open Enrolled Students Modal
  const handleOpenStudentsModal = async (batch) => {
    setSelectedBatch(batch);
    setShowStudentsModal(true);
    setBatchStudentSearch('');
    setBatchStudentsLoading(true);
    try {
      const res = await getTrainerBatch(batch._id);
      if (res.data.success) {
        setSelectedBatch(res.data.batch);
      }
    } catch (err) {
      showError('Could not fetch student details for this batch');
    } finally {
      setBatchStudentsLoading(false);
    }
  };

  // Open Syllabus Progress Modal
  const handleOpenProgressModal = (batch) => {
    setSelectedBatch(batch);
    setSyllabusModules(batch.syllabusProgress || []);
    setBatchNotes(batch.notes || '');
    setBatchStatus(batch.status || 'active');
    setShowProgressModal(true);
  };

  const handleToggleModule = (index) => {
    setSyllabusModules((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const isCompleted = !current.completed;
      updated[index] = {
        ...current,
        completed: isCompleted,
        completedDate: isCompleted ? new Date() : null,
      };
      return updated;
    });
  };

  const handleSaveProgress = async () => {
    if (!selectedBatch) return;
    setSavingProgress(true);
    try {
      const res = await updateTrainerBatchProgress(selectedBatch._id, {
        syllabusProgress: syllabusModules,
        status: batchStatus,
        notes: batchNotes,
      });
      if (res.data.success) {
        showSuccess('Batch progress and status updated!');
        setShowProgressModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setSavingProgress(false);
    }
  };

  // Open Meeting Link Modal
  const handleOpenLinkModal = (batch) => {
    setSelectedBatch(batch);
    setMeetingForm({
      meetingLink: batch.meetingLink || '',
      timing: batch.timing || '',
      schedule: batch.schedule || '',
      notes: batch.notes || '',
    });
    setShowLinkModal(true);
  };

  const handleSaveMeetingLink = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSavingLink(true);
    try {
      const res = await updateTrainerMeetingLink(selectedBatch._id, meetingForm);
      if (res.data.success) {
        showSuccess('Live class details updated successfully!');
        setShowLinkModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update meeting details');
    } finally {
      setSavingLink(false);
    }
  };

  // Change Password Form Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Export batch students to CSV
  const handleExportStudentsCSV = (batch) => {
    if (!batch || !batch.enrolledStudents || batch.enrolledStudents.length === 0) {
      showError('No students to export in this batch');
      return;
    }
    const headers = ['Roll/Student ID', 'Application No', 'Full Name', 'Phone', 'Email', 'City', 'State', 'Admission Date', 'Status'];
    const rows = batch.enrolledStudents.map((s) => [
      `"${s.studentIdNo || ''}"`,
      `"${s.applicationNo || ''}"`,
      `"${s.fullName || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.city || ''}"`,
      `"${s.state || ''}"`,
      `"${s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : ''}"`,
      `"${s.status || 'active'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${batch.name || 'Batch'}_Enrolled_Students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered batch students in modal
  const modalEnrolledStudents = useMemo(() => {
    if (!selectedBatch?.enrolledStudents) return [];
    if (!batchStudentSearch.trim()) return selectedBatch.enrolledStudents;
    const q = batchStudentSearch.toLowerCase().trim();
    return selectedBatch.enrolledStudents.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.studentIdNo?.toLowerCase().includes(q) ||
        s.applicationNo?.toLowerCase().includes(q)
    );
  }, [selectedBatch, batchStudentSearch]);

  // Filtered All Students Tab
  const filteredAllStudents = useMemo(() => {
    let list = allStudents;
    if (studentFilterBatch) {
      list = list.filter((s) => s.batches?.some((b) => b.batchId === studentFilterBatch));
    }
    if (searchQuery.trim() && activeTab === 'all-students') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.applicationNo?.toLowerCase().includes(q) ||
          s.studentIdNo?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allStudents, studentFilterBatch, searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header / Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  Trainer LMS Portal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Faculty Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Course Batches, Live Training & Student Roster Management
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user?.name || 'Trainer Faculty'}</span>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              title="Change Password"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Faculty Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Namaste, {user?.name?.split(' ')[0] || 'Trainer'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Here is the real-time status of your allotted courses, active classroom batches, upcoming schedules, and enrolled students.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Video className="w-5 h-5" />
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">Running Batches</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.runningBatchesCount}
            </h3>
            <p className="text-[11px] text-emerald-400/90 mt-1">Currently in progress</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Scheduled
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">Upcoming Batches</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.upcomingBatchesCount}
            </h3>
            <p className="text-[11px] text-indigo-300/80 mt-1">Starting soon</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                Total
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">Enrolled Students</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.totalStudentsCount}
            </h3>
            <p className="text-[11px] text-violet-300/80 mt-1">Under your training</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Active
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">Assigned Courses</p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.coursesCount}
            </h3>
            <p className="text-[11px] text-amber-300/80 mt-1">Unique curricula</p>
          </div>
        </div>

        {/* Tab Selection & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('running')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'running'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Running Batches ({stats.runningBatchesCount})
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Batches ({stats.upcomingBatchesCount})
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed ({stats.completedBatchesCount})
            </button>

            <button
              onClick={() => setActiveTab('all-students')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all-students'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              All Enrolled Students ({stats.totalStudentsCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'all-students' ? 'Search student name, roll...' : 'Search batch or course...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* TAB 1, 2, 3: BATCHES GRID VIEW */}
        {activeTab !== 'all-students' && (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-400">Loading your batches...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No {activeTab} batches found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : activeTab === 'running'
                    ? 'You have no running batches at this moment. Batches marked active by Admin will appear here.'
                    : activeTab === 'upcoming'
                    ? 'No upcoming scheduled batches found. Super Admin will allot batches for courses.'
                    : 'No completed batches in your history.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBatches.map((batch) => {
                  const completedModulesCount = (batch.syllabusProgress || []).filter((m) => m.completed).length;
                  const totalModulesCount = batch.syllabusProgress?.length || 0;
                  const progressPct = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;
                  const enrolledCount = batch.enrolledStudents?.length || 0;

                  return (
                    <div
                      key={batch._id}
                      className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl shadow-black/20 hover:shadow-indigo-500/5 transition-all group"
                    >
                      <div>
                        {/* Course & Status Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                            {batch.courseId?.name || 'Course Training'}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              batch.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                                : batch.status === 'upcoming'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {batch.status}
                          </span>
                        </div>

                        {/* Batch Name & Code */}
                        <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                          {batch.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {batch.batchCode || `BATCH-${batch._id.slice(-6).toUpperCase()}`}
                        </p>

                        {/* Schedule & Timing Info */}
                        <div className="space-y-2 mt-4 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{batch.timing || 'Timings to be announced'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>
                              {batch.schedule || 'Schedule'} &bull; Starts{' '}
                              {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'TBA'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className="font-semibold text-white">
                              {enrolledCount} / {batch.maxStudents || 30}
                            </span>
                            <span className="text-slate-400">Students Enrolled</span>
                          </div>
                        </div>

                        {/* Syllabus Progress Bar */}
                        {totalModulesCount > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                              <span className="text-slate-400">Curriculum Progress</span>
                              <span className="font-bold text-indigo-400">{progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {completedModulesCount} of {totalModulesCount} modules completed
                            </span>
                          </div>
                        )}

                        {/* Meeting Link Banner (if present) */}
                        {batch.meetingLink ? (
                          <div className="mt-4 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate text-xs text-emerald-400">
                              <Video className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{batch.meetingLink}</span>
                            </div>
                            <a
                              href={batch.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                            >
                              Join <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenLinkModal(batch)}
                            className="mt-4 w-full py-2 bg-slate-800/40 hover:bg-slate-800 border border-dashed border-slate-700/80 rounded-xl text-xs text-indigo-400 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            + Set Online Class Link
                          </button>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenStudentsModal(batch)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          View Enrolled Students ({enrolledCount})
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenProgressModal(batch)}
                            className="py-2 px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            Syllabus ({progressPct}%)
                          </button>

                          <button
                            onClick={() => handleOpenLinkModal(batch)}
                            className="py-2 px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                            Class Link
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

        {/* TAB 4: ALL ENROLLED STUDENTS ROSTER */}
        {activeTab === 'all-students' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Unified Student Roster</h3>
                  <p className="text-xs text-slate-400">
                    All students enrolled in your allotted course batches
                  </p>
                </div>
              </div>

              {/* Batch Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter by Batch:</span>
                <select
                  value={studentFilterBatch}
                  onChange={(e) => setStudentFilterBatch(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Batches ({batches.length})</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.courseId?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {allStudentsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-400">Loading enrolled students...</p>
              </div>
            ) : filteredAllStudents.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No enrolled students found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Once students enroll in your assigned batches, their complete contact and learning details will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-700/80">
                      <tr>
                        <th className="py-3.5 px-4">Student</th>
                        <th className="py-3.5 px-4">ID / Roll No</th>
                        <th className="py-3.5 px-4">Enrolled Batches</th>
                        <th className="py-3.5 px-4">Contact Info</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4">Admission Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredAllStudents.map((st) => (
                        <tr key={st._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                                {st.fullName?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-white">{st.fullName}</p>
                                <p className="text-[11px] text-slate-400">{st.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                            {st.studentIdNo || st.applicationNo || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {(st.batches || []).map((b, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium"
                                >
                                  {b.batchName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-200">{st.phone || 'N/A'}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {st.city ? `${st.city}${st.state ? `, ${st.state}` : ''}` : 'Online / Direct'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {st.enrollmentDate ? new Date(st.enrollmentDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {st.phone && (
                                <a
                                  href={`https://wa.me/${st.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="WhatsApp Student"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {st.phone && (
                                <a
                                  href={`tel:${st.phone}`}
                                  title="Call Student"
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {st.email && (
                                <a
                                  href={`mailto:${st.email}`}
                                  title="Email Student"
                                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL 1: BATCH ENROLLED STUDENTS ROSTER MODAL */}
      {/* ==================================================== */}
      {showStudentsModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedBatch.courseId?.name || 'Course'}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-400">{selectedBatch.timing || 'Schedule TBA'}</span>
                </div>
                <h2 className="text-xl font-black text-white">{selectedBatch.name} &bull; Enrolled Students</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {modalEnrolledStudents.length} of {selectedBatch.enrolledStudents?.length || 0} students enrolled in this batch
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportStudentsCSV(selectedBatch)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>

                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={batchStudentSearch}
                  onChange={(e) => setBatchStudentSearch(e.target.value)}
                  placeholder="Search students by name, email, phone, roll number..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Students List Table */}
            <div className="flex-1 overflow-y-auto pr-1">
              {batchStudentsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                  <p className="text-xs text-slate-400">Loading student profiles...</p>
                </div>
              ) : modalEnrolledStudents.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">No students match your search</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {batchStudentSearch
                      ? 'Try clearing the search query.'
                      : 'No students enrolled in this batch yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {modalEnrolledStudents.map((student, idx) => (
                    <div
                      key={student._id || idx}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm shrink-0">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{student.fullName}</h4>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {student.studentIdNo || student.applicationNo || 'ID'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                            <span>{student.email}</span>
                            <span>&bull;</span>
                            <span>{student.phone || 'No phone'}</span>
                            {student.city && (
                              <>
                                <span>&bull;</span>
                                <span>{student.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Action Contacts */}
                      <div className="flex items-center gap-2 shrink-0">
                        {student.phone && (
                          <a
                            href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1 border border-emerald-500/30 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
                        {student.phone && (
                          <a
                            href={`tel:${student.phone}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {student.email && (
                          <a
                            href={`mailto:${student.email}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                            title="Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Super Admin manages student admissions & batch allotments</span>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: SYLLABUS & PROGRESS TRACKER MODAL */}
      {/* ==================================================== */}
      {showProgressModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">Curriculum & Syllabus Progress</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Batch: <span className="font-semibold text-white">{selectedBatch.name}</span> &bull;{' '}
                  {selectedBatch.courseId?.name}
                </p>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* Batch Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Batch Status</label>
                <select
                  value={batchStatus}
                  onChange={(e) => setBatchStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="upcoming">Upcoming (Scheduled to start)</option>
                  <option value="active">Active / Running (Live Classes Ongoing)</option>
                  <option value="completed">Completed (Training Finished)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Modules Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Course Modules Checklist ({syllabusModules.filter((m) => m.completed).length} /{' '}
                    {syllabusModules.length} Completed)
                  </label>
                </div>

                {syllabusModules.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 text-center">
                    No curriculum modules mapped for this course. You can add batch notes below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {syllabusModules.map((moduleItem, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleModule(idx)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          moduleItem.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800/70 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {moduleItem.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                          )}
                          <span className={`text-xs font-semibold ${moduleItem.completed ? 'line-through text-slate-400' : ''}`}>
                            Module {idx + 1}: {moduleItem.module}
                          </span>
                        </div>
                        {moduleItem.completed && moduleItem.completedDate && (
                          <span className="text-[10px] text-emerald-400 shrink-0 font-medium">
                            {new Date(moduleItem.completedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Trainer Notes & Announcements
                </label>
                <textarea
                  rows={3}
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="e.g. Next session topic, homework links, project submission instructions..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingProgress}
                onClick={handleSaveProgress}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: MEETING LINK & CLASS SCHEDULE MODAL */}
      {/* ==================================================== */}
      {showLinkModal && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white">Live Classroom & Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedBatch.name}</p>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingLink} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Online Class Meeting URL (Zoom / Google Meet)
                </label>
                <div className="relative">
                  <Video className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={meetingForm.meetingLink}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/xyz-abc-def or Zoom link"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Class Timings</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={meetingForm.timing}
                    onChange={(e) => setMeetingForm({ ...meetingForm, timing: e.target.value })}
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Weekly Schedule Days</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={meetingForm.schedule}
                    onChange={(e) => setMeetingForm({ ...meetingForm, schedule: e.target.value })}
                    placeholder="e.g. Mon, Wed, Fri"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLink}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Class Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CHANGE TRAINER PASSWORD MODAL */}
      {/* ==================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Change Password</h2>
                  <p className="text-xs text-slate-400">Update your login password</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
