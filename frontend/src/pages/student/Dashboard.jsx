import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentLmsDashboard, changePassword, updateStudentLmsProfile } from '../../api';
import { useToast } from '../../context/ToastContext';
import { 
  BookOpen, PlayCircle, Award, CheckCircle2, LogOut, GraduationCap, ArrowRight, User, 
  FileText, Calendar, CreditCard, Download, ExternalLink, ShieldCheck, MapPin, Phone, 
  Mail, KeyRound, Clock, Sparkles, Building2, Check, AlertCircle, Menu, X, ChevronRight,
  Edit3, Save, Lock, School, BookMarked, UserCheck, Shield
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Edit & Academic Details states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'male',
    category: 'General',
    bloodGroup: '',
    whatsappPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    qualification: '',
    guardianName: '',
    guardianPhone: '',
    tenthBoard: '',
    tenthPassingYear: '',
    tenthRollNo: '',
    tenthPercentage: '',
    twelfthBoard: '',
    twelfthStream: '',
    twelfthPassingYear: '',
    twelfthRollNo: '',
    twelfthPercentage: '',
    gradUniversity: '',
    gradCollege: '',
    gradPassingYear: '',
    gradPercentage: '',
  });

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const populateProfileForm = (data) => {
    const s = data?.student || {};
    const u = data?.user || {};
    setProfileForm({
      fullName: s.fullName || u.name || '',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
      gender: s.gender || 'male',
      category: s.category || 'General',
      bloodGroup: s.bloodGroup || '',
      whatsappPhone: s.whatsappPhone || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      qualification: s.qualification || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      tenthBoard: s.tenthDetails?.board || '',
      tenthPassingYear: s.tenthDetails?.passingYear || '',
      tenthRollNo: s.tenthDetails?.rollNo || '',
      tenthPercentage: s.tenthDetails?.percentage !== undefined ? s.tenthDetails.percentage : '',
      twelfthBoard: s.twelfthDetails?.board || '',
      twelfthStream: s.twelfthDetails?.stream || '',
      twelfthPassingYear: s.twelfthDetails?.passingYear || '',
      twelfthRollNo: s.twelfthDetails?.rollNo || '',
      twelfthPercentage: s.twelfthDetails?.percentage !== undefined ? s.twelfthDetails.percentage : '',
      gradUniversity: s.graduationDetails?.university || '',
      gradCollege: s.graduationDetails?.collegeName || '',
      gradPassingYear: s.graduationDetails?.passingYear || '',
      gradPercentage: s.graduationDetails?.percentage !== undefined ? s.graduationDetails.percentage : '',
    });
  };

  const loadDashboard = () => {
    setLoading(true);
    getStudentLmsDashboard()
      .then(res => {
        setDashboardData(res.data);
        populateProfileForm(res.data);
        setLoading(false);
      })
      .catch(err => {
        showError('Failed to load student portal details.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/student/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        fullName: profileForm.fullName,
        fatherName: profileForm.fatherName,
        motherName: profileForm.motherName,
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender,
        category: profileForm.category,
        bloodGroup: profileForm.bloodGroup,
        whatsappPhone: profileForm.whatsappPhone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        pincode: profileForm.pincode,
        qualification: profileForm.qualification,
        guardianName: profileForm.guardianName,
        guardianPhone: profileForm.guardianPhone,
        tenthDetails: {
          board: profileForm.tenthBoard,
          passingYear: profileForm.tenthPassingYear,
          rollNo: profileForm.tenthRollNo,
          percentage: profileForm.tenthPercentage ? Number(profileForm.tenthPercentage) : undefined,
        },
        twelfthDetails: {
          board: profileForm.twelfthBoard,
          stream: profileForm.twelfthStream,
          passingYear: profileForm.twelfthPassingYear,
          rollNo: profileForm.twelfthRollNo,
          percentage: profileForm.twelfthPercentage ? Number(profileForm.twelfthPercentage) : undefined,
        },
        graduationDetails: {
          university: profileForm.gradUniversity,
          collegeName: profileForm.gradCollege,
          passingYear: profileForm.gradPassingYear,
          percentage: profileForm.gradPercentage ? Number(profileForm.gradPercentage) : undefined,
        },
      };

      const res = await updateStudentLmsProfile(payload);
      showSuccess('Profile and academic details updated successfully!');
      if (res.data?.student) {
        setDashboardData(prev => ({
          ...prev,
          student: res.data.student,
          user: {
            ...prev.user,
            name: res.data.student.fullName,
          },
        }));
      }
      setIsEditingProfile(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile details');
    } finally {
      setProfileSaving(false);
    }
  };

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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const user = dashboardData?.user;
  const partner = dashboardData?.partner;
  const student = dashboardData?.student;
  const courses = dashboardData?.courses || [];
  const fees = dashboardData?.fees || [];
  const attendance = dashboardData?.attendance || [];
  const materials = dashboardData?.materials || [];
  const certificates = dashboardData?.certificates || [];

  const orgSettings = dashboardData?.orgSettings;
  const orgLogo = orgSettings?.logo || '/uploads/logo-1783236511925-286536357.jpeg';
  const orgName = orgSettings?.orgName || 'Lili Organization';

  const partnerLogo = partner?.logo || orgLogo;
  const partnerName = partner?.instituteName || orgName;
  const partnerCity = partner?.city ? `${partner.city}${partner.state ? `, ${partner.state}` : ''}` : 'Direct Online Learning';

  // Fee calculation summary
  const totalFeeAmount = fees.reduce((acc, f) => acc + (f.totalAmount || f.amount || 0), 0);
  const paidFeeAmount = fees.reduce((acc, f) => acc + (f.paidAmount || (f.status === 'paid' ? f.amount : 0)), 0);
  const pendingFeeAmount = Math.max(0, totalFeeAmount - paidFeeAmount);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Left Sidebar Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-slate-800 shadow-2xl shrink-0`}
      >
        {/* Top Header: Partner Institute Branding */}
        <div className="p-5 border-b border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                {partnerLogo ? (
                  <img src={partnerLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-xs sm:text-sm text-white truncate leading-tight">{partnerName}</h2>
                <p className="text-[10px] text-indigo-300 font-medium truncate mt-0.5">
                  {partnerCity ? `📍 ${partnerCity}` : 'Student Learning Portal'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student ID Card Badge */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-white truncate">{user?.name || 'Student Account'}</p>
              <p className="text-[10px] text-amber-300 font-bold truncate flex items-center gap-1">
                <span>🪪</span> ID: {user?.studentIdNo || 'STU-0001'}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Menu Options */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Student Portal Options
          </div>
          {[
            { id: 'courses', label: 'My Courses', icon: BookOpen, count: courses.length },
            { id: 'materials', label: 'Study Materials', icon: FileText, count: materials.length },
            { id: 'fees', label: 'Fee Receipts', icon: CreditCard, count: fees.length },
            { id: 'certificates', label: 'My Certificates', icon: Award, count: certificates.length },
            { id: 'profile', label: 'My Profile & Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Right Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-sm sm:text-base text-slate-900 capitalize">
                {activeTab === 'courses' && '📚 My Enrolled Courses'}
                {activeTab === 'materials' && '📁 Study Materials & eBook Notes'}
                {activeTab === 'fees' && '💳 Fee Receipts & Ledger'}
                {activeTab === 'certificates' && '🎓 My QR Verifiable Certificates'}
                {activeTab === 'profile' && '⚙️ My Profile & Security Settings'}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                {partner ? `${partnerName} · Student LMS` : 'Lili Organization - Direct Online Learning'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-slate-900">{user?.name}</p>
              <p className="text-[10px] text-indigo-600 font-bold">{user?.studentIdNo}</p>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Welcome & Overview Banner (Shown only on Courses tab) */}
          {activeTab === 'courses' && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-950/40">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Student LMS Portal
                      </span>
                      {partner?.instituteName && (
                        <span className="bg-white/10 text-slate-200 text-xs font-extrabold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" /> {partner.instituteName}
                        </span>
                      )}
                      {user?.studentIdNo && (
                        <span className="bg-amber-400/20 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-400/30">
                          🪪 ID: {user.studentIdNo}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Welcome back, {user?.name || 'Student'}! 👋
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Watch video lectures, download eBook notes, check fee receipts, and print your official QR-verified certificates.
                    </p>
                  </div>

                {/* Quick Stat Pill Cards */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Courses</p>
                    <p className="text-xl font-black text-white">{courses.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Study Notes</p>
                    <p className="text-xl font-black text-sky-400">{materials.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Paid Fees</p>
                    <p className="text-xl font-black text-indigo-300">₹{paidFeeAmount}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-center space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Certificates</p>
                    <p className="text-xl font-black text-emerald-400">{certificates.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Option 1: My Courses */}
          {activeTab === 'courses' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Enrolled Video Courses ({courses.length})
                </h3>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-400 font-medium">Loading video courses...</div>
              ) : courses.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-extrabold text-slate-800 text-base">No Enrolled Courses Found</h4>
                  <p className="text-xs text-slate-500">Contact your partner center administrator to get enrolled into video courses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-indigo-200"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                            {course.category || 'Standard Course'}
                          </span>
                          {course.isCompleted && (
                            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {course.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {course.description || 'Comprehensive video course with chapter lessons and bilingual assessments.'}
                          </p>
                        </div>

                        {/* Course Progress Bar */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-600">Course Watch Progress</span>
                            <span className="text-indigo-600">{course.progressPercent || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${course.progressPercent || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {(course.watchedChapters || []).length} of {(course.chapters || []).length} video chapters watched
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                        <Link
                          to={`/student/course/${course._id}`}
                          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                          <PlayCircle className="w-4 h-4" /> Continue Learning
                        </Link>

                        {course.certificateId && (
                          <Link
                            to={`/student/certificate/${course.certificateId}`}
                            className="py-2.5 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center justify-center gap-1 shrink-0"
                            title="View Official Certificate"
                          >
                            <Award className="w-4 h-4" /> Certificate
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Option 2: Study Materials */}
          {activeTab === 'materials' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Study Materials & eBook Notes ({materials.length})
                </h3>
              </div>

              {materials.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-extrabold text-slate-800 text-base">No Study Materials Uploaded Yet</h4>
                  <p className="text-xs text-slate-500">Your institute administrator will upload PDF course notes and eBook materials here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map((mat) => (
                    <div key={mat._id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {mat.category || 'PDF Notes'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {mat.fileSize ? `${Math.round(mat.fileSize / 1024)} KB` : 'PDF Document'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900 leading-snug">{mat.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{mat.description || 'Official course study notes and practice sheet.'}</p>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-100">
                        <a
                          href={mat.fileUrl || mat.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                          <Download className="w-4 h-4" /> Download / Open PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Option 3: Fee Receipts */}
          {activeTab === 'fees' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Course Fee</p>
                  <p className="text-2xl font-black text-slate-900">₹{totalFeeAmount}</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm space-y-1 bg-emerald-50/20">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Amount</p>
                  <p className="text-2xl font-black text-emerald-700">₹{paidFeeAmount}</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-1 bg-amber-50/20">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Balance</p>
                  <p className="text-2xl font-black text-amber-700">₹{pendingFeeAmount}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" /> Fee Payment Receipts ({fees.length})
                  </h3>
                </div>

                {fees.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-600">No Fee Payment Receipts Recorded Yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5">Receipt / Transaction ID</th>
                          <th className="px-6 py-3.5">Payment Date</th>
                          <th className="px-6 py-3.5">Payment Mode</th>
                          <th className="px-6 py-3.5">Amount Paid</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fees.map((fee) => (
                          <tr key={fee._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">
                              {fee.receiptNo || fee.transactionId || fee._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : new Date(fee.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-semibold uppercase">{fee.paymentMode || 'Cash / Online'}</td>
                            <td className="px-6 py-4 font-black text-slate-900 text-sm">₹{fee.paidAmount || fee.amount}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Option 4: My Certificates */}
          {activeTab === 'certificates' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" /> My QR Verifiable Certificates ({certificates.length})
                </h3>
              </div>

              {certificates.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
                  <Award className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-extrabold text-slate-800 text-base">No Certificates Issued Yet</h4>
                  <p className="text-xs text-slate-500">Complete your video courses and pass the online bilingual quiz assessment to earn official certificates.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <div key={cert._id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4 relative overflow-hidden flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Official Certificate
                          </span>
                          <span className="text-xs font-mono font-extrabold text-indigo-600">{cert.certificateNo}</span>
                        </div>
                        
                        <h4 className="font-extrabold text-lg text-slate-900 leading-tight">
                          {cert.courseId?.name || 'Certificate of Completion'}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold pt-1">
                          <span>Score: <strong>{cert.percentage}%</strong></span>
                          <span>Grade: <strong>{cert.grade || 'A+'}</strong></span>
                          <span>Issued: <strong>{new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <ShieldCheck className="w-4 h-4" /> QR Verifiable
                        </div>
                        <Link
                          to={`/student/certificate/${cert._id}`}
                          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View & Print Certificate
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

                     {/* Option 5: My Profile & Settings */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Profile Identity Card & Edit Action */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-indigo-100 shrink-0">
                        {user?.photo ? (
                          <img src={user.photo} alt="Student Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (user?.name || 'S').charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-xl text-slate-900">{student?.fullName || user?.name || 'Student Name'}</h3>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Active Student
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5">🪪 ID: {user?.studentIdNo || student?.studentIdNo || 'STU-LOCAL'}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Enrolled: {new Date(student?.enrollmentDate || user?.enrollmentDate || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingProfile && dashboardData) {
                          populateProfileForm(dashboardData);
                        }
                        setIsEditingProfile(!isEditingProfile);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm cursor-pointer ${
                        isEditingProfile 
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                      }`}
                    >
                      {isEditingProfile ? (
                        <>
                          <X className="w-4 h-4" /> Cancel Editing
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" /> Edit Profile & Academic Info
                        </>
                      )}
                    </button>
                  </div>

                  {/* EDIT MODE: Profile & Academic Details Form */}
                  {isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 animate-fadeIn">
                      
                      {/* Section 1: Personal Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <User className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">1. Personal Information</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Full Name *</label>
                            <input
                              type="text"
                              value={profileForm.fullName}
                              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                              required
                              placeholder="Enter student full name"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Father's Name</label>
                            <input
                              type="text"
                              value={profileForm.fatherName}
                              onChange={(e) => setProfileForm({ ...profileForm, fatherName: e.target.value })}
                              placeholder="Enter father's name"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Mother's Name</label>
                            <input
                              type="text"
                              value={profileForm.motherName}
                              onChange={(e) => setProfileForm({ ...profileForm, motherName: e.target.value })}
                              placeholder="Enter mother's name"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Date of Birth (DOB)</label>
                            <input
                              type="date"
                              value={profileForm.dateOfBirth}
                              onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Gender</label>
                            <select
                              value={profileForm.gender}
                              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Social Category</label>
                            <select
                              value={profileForm.category}
                              onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            >
                              <option value="General">General</option>
                              <option value="OBC">OBC</option>
                              <option value="SC">SC</option>
                              <option value="ST">ST</option>
                              <option value="EWS">EWS</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Blood Group</label>
                            <select
                              value={profileForm.bloodGroup}
                              onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Contact & Address Information */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Phone className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">2. Contact & Address Details</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Primary Mobile Number</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={user?.phone || student?.phone || ''}
                                disabled
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                              />
                              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                            </div>
                            <span className="text-[10px] text-slate-400">Primary phone locked for login security</span>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">WhatsApp Number</label>
                            <input
                              type="tel"
                              value={profileForm.whatsappPhone}
                              onChange={(e) => setProfileForm({ ...profileForm, whatsappPhone: e.target.value })}
                              placeholder="e.g. 9876543210"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Guardian / Parent Name</label>
                            <input
                              type="text"
                              value={profileForm.guardianName}
                              onChange={(e) => setProfileForm({ ...profileForm, guardianName: e.target.value })}
                              placeholder="Guardian full name"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Guardian Contact Phone</label>
                            <input
                              type="tel"
                              value={profileForm.guardianPhone}
                              onChange={(e) => setProfileForm({ ...profileForm, guardianPhone: e.target.value })}
                              placeholder="Guardian phone number"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-slate-600 mb-1.5">Residential Street Address</label>
                            <input
                              type="text"
                              value={profileForm.address}
                              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                              placeholder="Flat/House No, Building, Street, Area"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">City / Town</label>
                            <input
                              type="text"
                              value={profileForm.city}
                              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                              placeholder="e.g. Pune / Raipur"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">State</label>
                            <input
                              type="text"
                              value={profileForm.state}
                              onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                              placeholder="e.g. Maharashtra"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">Pincode</label>
                            <input
                              type="text"
                              value={profileForm.pincode}
                              onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                              placeholder="6-digit postal pincode"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Academic Background & Qualifications */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">3. Academic Qualifications</h4>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1.5">Highest Qualification</label>
                          <select
                            value={profileForm.qualification}
                            onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-900 font-semibold"
                          >
                            <option value="">Select Highest Qualification</option>
                            <option value="10th Pass">10th (Secondary)</option>
                            <option value="12th Pass">12th (Higher Secondary)</option>
                            <option value="Diploma">Diploma / ITI</option>
                            <option value="Graduate">Graduate (B.Tech / B.Sc / B.Com / BCA / BA)</option>
                            <option value="Post Graduate">Post Graduate (M.Tech / MBA / MCA / M.Sc)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* 10th Standard Details */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                          <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <School className="w-3.5 h-3.5 text-indigo-600" /> 10th / Secondary School Record
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-slate-500 mb-1">Board / Council</label>
                              <input
                                type="text"
                                value={profileForm.tenthBoard}
                                onChange={(e) => setProfileForm({ ...profileForm, tenthBoard: e.target.value })}
                                placeholder="e.g. CBSE / State Board"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Passing Year</label>
                              <input
                                type="text"
                                value={profileForm.tenthPassingYear}
                                onChange={(e) => setProfileForm({ ...profileForm, tenthPassingYear: e.target.value })}
                                placeholder="e.g. 2021"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Marks / %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={profileForm.tenthPercentage}
                                onChange={(e) => setProfileForm({ ...profileForm, tenthPercentage: e.target.value })}
                                placeholder="e.g. 84.5"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 12th Standard Details */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                          <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <BookMarked className="w-3.5 h-3.5 text-indigo-600" /> 12th / Higher Secondary Record
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Board</label>
                              <input
                                type="text"
                                value={profileForm.twelfthBoard}
                                onChange={(e) => setProfileForm({ ...profileForm, twelfthBoard: e.target.value })}
                                placeholder="e.g. CBSE"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Stream</label>
                              <input
                                type="text"
                                value={profileForm.twelfthStream}
                                onChange={(e) => setProfileForm({ ...profileForm, twelfthStream: e.target.value })}
                                placeholder="Science/Comm/Arts"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Year</label>
                              <input
                                type="text"
                                value={profileForm.twelfthPassingYear}
                                onChange={(e) => setProfileForm({ ...profileForm, twelfthPassingYear: e.target.value })}
                                placeholder="e.g. 2023"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Marks / %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={profileForm.twelfthPercentage}
                                onChange={(e) => setProfileForm({ ...profileForm, twelfthPercentage: e.target.value })}
                                placeholder="e.g. 78.2"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Higher / Graduation Details */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                          <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-indigo-600" /> Graduation / Degree Record (Optional)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-slate-500 mb-1">University / Institute</label>
                              <input
                                type="text"
                                value={profileForm.gradUniversity}
                                onChange={(e) => setProfileForm({ ...profileForm, gradUniversity: e.target.value })}
                                placeholder="e.g. Pune University"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">Passing Year</label>
                              <input
                                type="text"
                                value={profileForm.gradPassingYear}
                                onChange={(e) => setProfileForm({ ...profileForm, gradPassingYear: e.target.value })}
                                placeholder="e.g. 2025"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">CGPA / %</label>
                              <input
                                type="number"
                                step="0.01"
                                value={profileForm.gradPercentage}
                                onChange={(e) => setProfileForm({ ...profileForm, gradPercentage: e.target.value })}
                                placeholder="e.g. 8.2"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {profileSaving ? 'Saving Changes...' : 'Save Profile & Academic Info'}
                        </button>
                      </div>

                    </form>
                  ) : (
                    /* VIEW MODE: Structured Personal, Contact & Academic Overview */
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Section 1: Personal Details View */}
                      <div className="space-y-3">
                        <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" /> Personal Identity Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Father's Name</span>
                            <p className="font-extrabold text-slate-800">{student?.fatherName || 'Not specified'}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mother's Name</span>
                            <p className="font-extrabold text-slate-800">{student?.motherName || 'Not specified'}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</span>
                            <p className="font-extrabold text-slate-800">
                              {student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not specified'}
                            </p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Gender</span>
                            <p className="font-extrabold text-slate-800 capitalize">{student?.gender || 'Not specified'}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                            <p className="font-extrabold text-slate-800">{student?.category || 'General'}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
                            <p className="font-extrabold text-slate-800">{student?.bloodGroup || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Contact & Address View */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-indigo-600" /> Contact & Residence Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                            <p className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                              <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {user?.email || student?.email || 'Not provided'}
                            </p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Phone</span>
                            <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {user?.phone || student?.phone || 'Not provided'}
                            </p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Number</span>
                            <p className="font-extrabold text-slate-800">{student?.whatsappPhone || user?.phone || 'Not specified'}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5 sm:col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
                            <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> 
                              {student?.address ? `${student.address}, ${student.city || ''} ${student.state || ''} ${student.pincode || ''}` : 'On file with digital enrollment'}
                            </p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Guardian Info</span>
                            <p className="font-extrabold text-slate-800">
                              {student?.guardianName ? `${student.guardianName} (${student.guardianPhone || ''})` : 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Academic Qualifications View */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Academic Qualifications
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                            {student?.qualification || 'Enrolled Student'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* 10th Box */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                                <School className="w-3.5 h-3.5 text-indigo-600" /> 10th / Secondary
                              </span>
                              {student?.tenthDetails?.percentage && (
                                <span className="font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md text-[11px]">
                                  {student.tenthDetails.percentage}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-1">
                              <p>Board: <strong>{student?.tenthDetails?.board || 'Not specified'}</strong></p>
                              <p>Year: <strong>{student?.tenthDetails?.passingYear || 'N/A'}</strong></p>
                            </div>
                          </div>

                          {/* 12th Box */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                                <BookMarked className="w-3.5 h-3.5 text-indigo-600" /> 12th / Intermediate
                              </span>
                              {student?.twelfthDetails?.percentage && (
                                <span className="font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md text-[11px]">
                                  {student.twelfthDetails.percentage}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-1">
                              <p>Board / Stream: <strong>{student?.twelfthDetails?.board || 'Not specified'} {student?.twelfthDetails?.stream ? `(${student.twelfthDetails.stream})` : ''}</strong></p>
                              <p>Year: <strong>{student?.twelfthDetails?.passingYear || 'N/A'}</strong></p>
                            </div>
                          </div>
                        </div>

                        {student?.graduationDetails?.university && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-indigo-600" /> Graduation / Higher Degree
                            </span>
                            <p className="text-[11px] text-slate-600">
                              University: <strong>{student.graduationDetails.university}</strong> {student.graduationDetails.passingYear ? `(${student.graduationDetails.passingYear})` : ''} · Score: <strong>{student.graduationDetails.percentage || 'N/A'}%</strong>
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

                {/* Institute / Direct LMS Branding Box */}
                {partner ? (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        {partner.logo ? <img src={partner.logo} alt="Partner Logo" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-blue-400" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
                          {partner.franchiseId || 'PARTNER CENTER'}
                        </span>
                        <h4 className="font-extrabold text-lg text-white mt-1">{partner.instituteName}</h4>
                        <p className="text-xs text-slate-400">📍 {partner.address}, {partner.city}, {partner.state}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                        {orgLogo ? (
                          <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                        ) : (
                          <GraduationCap className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">
                          DIRECT ONLINE LMS
                        </span>
                        <h4 className="font-extrabold text-base text-white mt-1">{orgName}</h4>
                        <p className="text-xs text-slate-400">💻 Direct Online Learning & HQ Certification</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Password Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 h-fit">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Security & Password</h4>
                    <p className="text-[11px] text-slate-400">Update account security password</p>
                  </div>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
