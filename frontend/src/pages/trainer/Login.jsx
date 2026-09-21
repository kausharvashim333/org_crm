import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getOrgHomepagePublic, forgotPassword, resetPassword } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowLeft,
  Sparkles,
  KeyRound,
  X,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Users,
  Video,
  BookOpen,
  Calendar,
} from 'lucide-react';

export default function TrainerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [orgSettings, setOrgSettings] = useState(null);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Calendar,
      title: 'Course-wise Batches',
      desc: 'Stay on top of your live running batches and upcoming scheduled training sessions.',
    },
    {
      icon: Users,
      title: 'Enrolled Student Roster',
      desc: 'Access complete student details, contact information, and attendance in real time.',
    },
    {
      icon: Video,
      title: 'Classroom & Live Links',
      desc: 'Publish and launch Google Meet or Zoom class links directly for enrolled students.',
    },
    {
      icon: BookOpen,
      title: 'Curriculum & Syllabus',
      desc: 'Track completed modules and update course milestones with one-click progress checkmarks.',
    },
  ];

  useEffect(() => {
    getOrgHomepagePublic()
      .then((res) => setOrgSettings(res.data.homepage?.settings))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [features.length]);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleOpenResetModal = () => {
    setResetEmail(email || '');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetStep(1);
    setShowResetModal(true);
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showError('Please enter your registered trainer email');
      return;
    }
    setResetLoading(true);
    try {
      const res = await forgotPassword({ email: resetEmail, role: 'trainer' });
      showSuccess(res.data.message || `Verification code sent to ${resetEmail}`);
      setResetCode('');
      setResetStep(2);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to request reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePerformPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetCode) {
      showError('Please enter the verification code');
      return;
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    setResetLoading(true);
    try {
      const res = await resetPassword({ token: resetCode, newPassword });
      showSuccess(res.data?.message || 'Password reset successfully!');
      setEmail(resetEmail);
      setPassword(newPassword);
      setShowResetModal(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please provide both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: email.trim().toLowerCase(), password });
      if (res.data.success) {
        const userRole = res.data.user?.role;
        if (!['trainer', 'super_admin'].includes(userRole)) {
          showError('Access Denied: This portal is exclusively for Course Trainers');
          setLoading(false);
          return;
        }

        authLogin(res.data);
        showSuccess(`Welcome back, ${res.data.user?.name || 'Trainer'}!`);
        navigate('/trainer/dashboard');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = features[currentFeature].icon;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Col: Features Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Website
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold text-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Trainer Portal
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    LMS
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {orgSettings?.orgName || 'Skill Development Institute'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Empowering faculty and trainers with unified course-wise batch allotment, student rosters, and live class management.
            </p>
          </div>

          {/* Dynamic Feature Slider */}
          <div className="my-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {features[currentFeature].title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[44px]">
              {features[currentFeature].desc}
            </p>
            <div className="flex gap-1.5 mt-4">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentFeature(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentFeature === i ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Badge */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure Faculty Cloud
            </span>
            <span>v2.4 Active</span>
          </div>
        </div>

        {/* Right Col: Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-slate-900/60">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Faculty & Master Trainers
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered credentials to view your assigned batches
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Trainer Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@organization.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    Access Trainer Portal
                  </>
                )}
              </button>
            </form>

            {/* Support / Direct Help */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Need trainer login access?</span>
              <span className="text-slate-300 font-medium">Contact Head Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Trainer Password</h3>
                <p className="text-xs text-slate-400">Step {resetStep} of 2</p>
              </div>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered trainer email to receive a password reset code.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="trainer@organization.com"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePerformPasswordReset} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Code dispatched! Please check your email or enter OTP below.</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
