import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getOrgHomepagePublic, forgotPassword, resetPassword } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Lock, Mail, ArrowLeft, Sparkles, KeyRound, X, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CounsellorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [orgSettings, setOrgSettings] = useState(null);
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { title: 'Assigned Sessions', desc: 'See upcoming group counselling batches assigned to you, with date, time, and venue or join details.' },
    { title: '1-on-1 Time Slots', desc: 'Publish open slots so students can book a paid private counselling call on a real calendar time.' },
    { title: 'Attendance & Conversion', desc: 'Mark attended or no-show, and flag students who converted to admission after counselling.' },
    { title: 'Email Follow-up', desc: 'Resend join details and session recordings to paid attendees on Gmail — no public meeting links.' },
  ];

  useEffect(() => {
    getOrgHomepagePublic().then(res => setOrgSettings(res.data.homepage?.settings)).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [generatedCodeMessage, setGeneratedCodeMessage] = useState('');

  const handleOpenResetModal = () => {
    setResetEmail(email || '');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setGeneratedCodeMessage('');
    setResetStep(1);
    setShowResetModal(true);
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      showError('Please enter your registered email address');
      return;
    }
    setResetLoading(true);
    try {
      const res = await forgotPassword({ email: resetEmail, role: 'counsellor' });
      showSuccess(res.data.message || `Verification code sent to ${resetEmail}`);
      setGeneratedCodeMessage(`Verification code sent to registered email: ${resetEmail}`);
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
    setLoading(true);
    try {
      const res = await login({ email, password, role: 'counsellor' });
      authLogin(res.data);
      showSuccess('Counsellor portal login successful');
      navigate('/counsellor/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const orgName = orgSettings?.orgName || 'Lili Organization';
  const logo = orgSettings?.logo;

  return (
    <div className="min-h-screen flex bg-white font-inter">
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 bg-primary-600/25 border border-primary-500/40 rounded-xl flex items-center justify-center backdrop-blur-md overflow-hidden">
            {logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'undefined' ? (
              <img src={logo} alt="logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { const img = e.target; if (!img.dataset.retried && logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = logo.substring(logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
            ) : (
              <GraduationCap className="w-6 h-6 text-primary-400" />
            )}
          </div>
          <span className="font-extrabold text-xl tracking-wider text-slate-100 uppercase">{orgName}</span>
        </div>

        <div className="z-10 max-w-lg my-auto pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Counsellor Portal
          </div>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-6">
            Guide students with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-300">clarity</span>
          </h2>
          <div className="min-h-[120px]">
            <h3 className="text-xl font-bold text-slate-200 mb-2">{stats[currentStat].title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{stats[currentStat].desc}</p>
          </div>
          <div className="flex gap-2.5 mt-8">
            {stats.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStat(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentStat === i ? 'w-8 bg-primary-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 z-10 font-semibold tracking-wide">
          © {new Date().getFullYear()} {orgName} · Counsellor Portal
        </p>
      </div>

      <div className="w-full md:w-1/2 lg:w-2/5 min-h-screen bg-slate-50 flex items-center justify-center p-8 relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
            {logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'undefined' ? (
              <img src={logo} alt="logo" className="w-full h-full object-cover rounded-lg" onError={(e) => { const img = e.target; if (!img.dataset.retried && logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = logo.substring(logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
            ) : (
              <GraduationCap className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">{orgName}</span>
        </div>

        <Link to="/" className="absolute top-8 right-8 text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-8 w-full max-w-md transition-all duration-300 hover:shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Counsellor Portal</h1>
            <p className="text-slate-450 text-xs font-bold mt-1.5 uppercase tracking-wider">Sessions, slots & attendance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
                  placeholder="counsellor@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <button type="button" onClick={handleOpenResetModal} className="text-xs font-bold text-primary-600 hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl text-white font-bold transition-all shadow-md shadow-primary-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-lg active:scale-99"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Access Portal'}
            </button>
          </form>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button type="button" onClick={() => setShowResetModal(false)} className="absolute right-3 top-3 text-slate-400"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-primary-600" />
              <h3 className="font-black text-slate-800">Reset password</h3>
            </div>
            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-3">
                <p className="text-xs text-slate-500">Enter the email used for your counsellor login.</p>
                <input required type="email" className="input-field" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email" />
                <button type="submit" disabled={resetLoading} className="btn-primary w-full text-sm">{resetLoading ? 'Sending...' : 'Send code'}</button>
              </form>
            ) : (
              <form onSubmit={handlePerformPasswordReset} className="space-y-3">
                {generatedCodeMessage && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {generatedCodeMessage}</p>
                )}
                <input required className="input-field" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="Verification code" />
                <input required type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                <input required type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setResetStep(1)} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Back</button>
                  <button type="submit" disabled={resetLoading} className="btn-primary flex-1 text-sm">{resetLoading ? 'Saving...' : 'Update password'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
