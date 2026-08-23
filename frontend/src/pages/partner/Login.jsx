import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { login, getPartnerBySlug, getOrgHomepagePublic, getPublicPartners, forgotPassword, resetPassword, googleLogin } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Lock, Mail, ArrowLeft, Building2, KeyRound, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function PartnerLogin() {
  const { slug } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [orgName, setOrgName] = useState('Skill India');
  const [orgLogo, setOrgLogo] = useState(null);
  const [loginType, setLoginType] = useState('partner');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '826700849642-02q8vigu4m827qpfquefqkv36miv96l4.apps.googleusercontent.com';

    if (!window.google?.accounts?.oauth2) {
      showError('Google Sign-In is initializing. Please click again in a moment.');
      setGoogleLoading(false);
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (tokenResponse.error !== 'popup_closed') {
              showError('Google authentication was cancelled or failed.');
            }
            setGoogleLoading(false);
            return;
          }
          if (tokenResponse.access_token) {
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const userInfo = await userInfoRes.json();
              if (userInfo.email) {
                const res = await googleLogin({ email: userInfo.email, name: userInfo.name, role: loginType });
                authLogin(res.data);
                showSuccess(`Welcome back, ${res.data.user.name || userInfo.name || 'User'}!`);
                if (res.data.user.role === 'super_admin') navigate('/admin/dashboard');
                else navigate('/partner/dashboard');
              } else {
                showError('Could not retrieve email address from Google account.');
              }
            } catch (err) {
              showError(err.response?.data?.message || 'No registered faculty/partner account found for this Google email.');
            } finally {
              setGoogleLoading(false);
            }
          } else {
            setGoogleLoading(false);
          }
        },
        error_callback: (err) => {
          console.error('Google OAuth error_callback:', err);
          if (err.type === 'popup_closed') {
            // User closed popup
          } else if (err.type === 'popup_failed_to_open') {
            showError('Pop-up window was blocked by browser. Please enable pop-ups for this site.');
          } else {
            showError('Google Sign In was cancelled or failed.');
          }
          setGoogleLoading(false);
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Google Sign In Error:', err);
      showError('Google Sign In failed');
      setGoogleLoading(false);
    }
  };
  
  // Focus states for dynamic borders
  const [focusField, setFocusField] = useState('');

  // States for center selection dropdown
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState('');

  const [currentStat, setCurrentStat] = useState(0);

  const partnerStats = [
    { title: "Dynamic Academy Portal", desc: "Access standard courses, custom study materials, and notifications tailored for your center." },
    { title: "Seamless Academics", desc: "Manage teacher assignments, student batches, mark attendance, and publish exam schedules easily." },
    { title: "Leads & Fee Collection", desc: "Convert public website inquiries, collect student fees, and generate digital print receipts." }
  ];

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useToast();

  // Reset password modal states
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
      const res = await forgotPassword({ email: resetEmail, role: 'partner' });
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
      setPassword(newPassword);
      setEmail(resetEmail);
      setShowResetModal(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    // If slug is provided in url parameter, load specific center details
    if (slug) {
      getPartnerBySlug(slug)
        .then(res => setPartner(res.data.partner))
        .catch(() => {});
    } else {
      // If loaded from root /partner/login, load active institutes list for selection
      getPublicPartners()
        .then(res => {
          const activePartners = res.data.partners || [];
          setAllInstitutes(activePartners);
          if (activePartners.length > 0 && !slug) {
            setSelectedInstituteId(activePartners[0]._id);
            setPartner(activePartners[0]);
          }
        })
        .catch(() => {});
    }

    // Load main organization settings (logo & name)
    getOrgHomepagePublic()
      .then(res => {
        if (res.data.homepage?.settings?.orgName) setOrgName(res.data.homepage.settings.orgName);
        if (res.data.homepage?.settings?.logo) setOrgLogo(res.data.homepage.settings.logo);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % partnerStats.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleInstituteChange = (e) => {
    const instId = e.target.value;
    setSelectedInstituteId(instId);
    if (instId) {
      const selected = allInstitutes.find(inst => inst._id === instId);
      setPartner(selected);
    } else {
      setPartner(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password, role: loginType });
      authLogin(res.data);
      if (res.data.user.role === 'super_admin') navigate('/admin/dashboard');
      else navigate('/partner/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const themeColor = partner?.themeColor || '#2563eb';
  const currentLogo = partner?.logo || orgLogo;

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Panel: Branding & Authority Illustration */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden select-none">
        {/* Background Grid Pattern & Glowing Blur Blobs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ backgroundColor: themeColor }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-pulse" style={{ backgroundColor: themeColor, animationDelay: '2s' }}></div>

        {/* Branding Logo Block */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center backdrop-blur-md overflow-hidden">
            {orgLogo && typeof orgLogo === 'string' && orgLogo.trim() !== '' && orgLogo !== 'undefined' ? (
              <img src={orgLogo} alt="logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { if (!e.target.dataset.retried && orgLogo.startsWith('/uploads/')) { e.target.dataset.retried = 'true'; e.target.src = `/api${orgLogo}`; } else { e.target.style.display = 'none'; } }} />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="font-extrabold text-xl tracking-wider text-slate-100 uppercase truncate max-w-sm">
            {orgName}
          </span>
        </div>

        {/* Center Carousel */}
        <div className="z-10 max-w-lg my-auto pr-8">
          <h2 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-6">
            Grow your <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #60a5fa)` }}>Institute</span> online
          </h2>
          
          <div className="min-h-[120px] transition-all duration-500 transform translate-y-0">
            <h3 className="text-xl font-bold text-slate-200 mb-2 transition-all duration-300">{partnerStats[currentStat].title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{partnerStats[currentStat].desc}</p>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-2.5 mt-8">
            {partnerStats.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStat(i)}
                className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                style={currentStat === i ? { width: '32px', backgroundColor: themeColor } : { width: '8px', backgroundColor: '#334155' }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Metadata */}
        <p className="text-xs text-slate-500 z-10 font-semibold tracking-wide">
          Powered by {orgName} · Partner Portal
        </p>
      </div>

      {/* Right Panel: Focused Form Canvas */}
      <div className="w-full md:w-1/2 lg:w-2/5 min-h-screen bg-slate-50 flex items-center justify-center p-8 relative">
        {/* Mobile Logo & Organization Name (Hidden on Desktop) */}
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-slate-100 shadow-sm">
            {orgLogo && typeof orgLogo === 'string' && orgLogo.trim() !== '' && orgLogo !== 'undefined' ? <img src={orgLogo} alt="logo" className="w-full h-full object-cover" onError={(e) => { if (!e.target.dataset.retried && orgLogo.startsWith('/uploads/')) { e.target.dataset.retried = 'true'; e.target.src = `/api${orgLogo}`; } else { e.target.style.display = 'none'; } }} /> : <GraduationCap className="w-4 h-4 text-slate-700" />}
          </div>
          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide truncate max-w-[150px]">
            {orgName}
          </span>
        </div>

        {/* Back Link */}
        <Link to="/" className="absolute top-8 right-8 text-xs font-bold text-slate-400 hover:text-slate-750 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-8 w-full max-w-md transition-all duration-300 hover:shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Partner Center Login</h1>
            <p className="text-slate-450 text-xs font-bold mt-1.5 uppercase tracking-wider">
              Center Administration Login
            </p>
          </div>

          {/* Registered Partner Center Display Banner */}
          {partner && (
            <div className="mb-6 bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                {partner.logo && typeof partner.logo === 'string' && partner.logo.trim() !== '' && partner.logo !== 'undefined' ? (
                  <img src={partner.logo} alt="logo" className="w-full h-full object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                ) : (
                  <Building2 className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-full">
                    {partner.franchiseId || partner.code || 'REGISTERED CENTER'}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-white mt-1 truncate">
                  {partner.instituteName}
                </h3>
                {partner.city && (
                  <p className="text-xs text-slate-400 truncate">📍 {partner.city}, {partner.state}</p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Institute Dropdown Selection (if not linked via specific center route) */}
            {!slug && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Your Center / Institute *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    required
                    value={selectedInstituteId}
                    onChange={handleInstituteChange}
                    className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm bg-slate-50 text-slate-800"
                    style={focusField === 'institute' ? { borderColor: themeColor, boxShadow: `0 0 0 4px ${themeColor}15`, backgroundColor: 'white' } : {}}
                    onFocus={() => setFocusField('institute')}
                    onBlur={() => setFocusField('')}
                  >
                    <option value="">-- Choose Center --</option>
                    {allInstitutes.map(inst => (
                      <option key={inst._id} value={inst._id}>
                        {inst.instituteName} ({inst.city}, {inst.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm bg-slate-50 text-slate-850" 
                  placeholder="Enter email address" 
                  style={focusField === 'email' ? { borderColor: themeColor, boxShadow: `0 0 0 4px ${themeColor}15`, backgroundColor: 'white' } : {}}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField('')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Security Password</label>
                <button 
                  type="button" 
                  onClick={handleOpenResetModal}
                  className="text-xs font-bold transition-colors cursor-pointer hover:underline"
                  style={{ color: themeColor }}
                >
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
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none transition-all text-sm bg-slate-50 text-slate-850" 
                  placeholder="••••••••" 
                  style={focusField === 'password' ? { borderColor: themeColor, boxShadow: `0 0 0 4px ${themeColor}15`, backgroundColor: 'white' } : {}}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField('')}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || googleLoading} 
              className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] hover:shadow-lg active:scale-99" 
              style={{ backgroundColor: themeColor, boxShadow: `0 4px 12px ${themeColor}30` }}
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Verify & Log In'}
            </button>
          </form>

          {/* Google Sign In Divider & Button */}
          <div className="mt-4 flex flex-col items-center">
            <div className="relative flex py-2 items-center w-full">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Continue With</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 mt-1 bg-white border border-slate-250 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-full transition-all shadow-sm cursor-pointer hover:shadow hover:scale-[1.02] active:scale-95"
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-700"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Action / Inquiry Redirection */}
          <div className="mt-6 text-center pt-5 border-t border-slate-100">
            <Link 
              to={partner ? `/institute/${partner.slug}/contact` : "/contact"} 
              className="inline-block px-5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-650"
            >
              Admission Inquiry
            </Link>
          </div>
        </div>
      </div>

      {/* Password Reset Modal Overlay */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative overflow-hidden transition-all">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Partner Password Reset</h3>
                  <p className="text-xs text-slate-500 font-medium">Step {resetStep} of 2</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Enter Registered Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="mt-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered Partner Email address below. We will generate a secure 6-digit verification code to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      placeholder="partner@example.com"
                      className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={resetLoading}
                    className="w-2/3 py-3 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                    style={{ backgroundColor: themeColor }}
                  >
                    {resetLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Generate Reset Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verification Code & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handlePerformPasswordReset} className="mt-5 space-y-4">
                {generatedCodeMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {generatedCodeMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">6-Digit Verification Code</label>
                  <input 
                    type="text" 
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-sm font-mono tracking-wider bg-slate-50 text-slate-800 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-sm bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Back
                  </button>
                  <button 
                    type="submit"
                    disabled={resetLoading}
                    className="w-2/3 py-3 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                    style={{ backgroundColor: themeColor }}
                  >
                    {resetLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Update Password'}
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
