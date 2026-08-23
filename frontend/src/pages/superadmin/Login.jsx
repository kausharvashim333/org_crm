import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getOrgHomepagePublic } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { showError } = useToast();
  const [orgSettings, setOrgSettings] = useState(null);
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { title: "Partner Center Management", desc: "Instantly create, configure, and monitor partner portals & branded center websites." },
    { title: "Financial Tracking", desc: "Automate royalty calculation, track incoming invoices, and view institute-wide revenues." },
    { title: "Standard Course Catalog", desc: "Manage a standardized course list and review custom course proposals from partner hubs." },
    { title: "Verifiable Certifications", desc: "Review, issue, and approve certificates with instant public code verification lookup." }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password, role: 'super_admin' });
      authLogin(res.data);
      navigate('/admin/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-inter">
      {/* Left Panel: Branding & Authority Illustration */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden select-none">
        {/* Background Grid Pattern & Glowing Blur Blobs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Branding Logo Block */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 bg-primary-600/25 border border-primary-500/40 rounded-xl flex items-center justify-center backdrop-blur-md overflow-hidden">
            {orgSettings?.logo && typeof orgSettings.logo === 'string' && orgSettings.logo.trim() !== '' && orgSettings.logo !== 'undefined' ? (
              <img src={orgSettings.logo} alt="logo" className="w-full h-full object-cover rounded-xl" onError={(e) => { const img = e.target; if (!img.dataset.retried && orgSettings.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = orgSettings.logo.substring(orgSettings.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
            ) : (
              <GraduationCap className="w-6 h-6 text-primary-400" />
            )}
          </div>
          <span className="font-extrabold text-xl tracking-wider text-slate-100 uppercase">{orgSettings?.orgName || 'Lili Organization'}</span>
        </div>

        {/* Center Carousel */}
        <div className="z-10 max-w-lg my-auto pr-8">
          <h2 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-6">
            Centralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-300">Management</span> Hub
          </h2>
          
          <div className="min-h-[120px] transition-all duration-500 transform translate-y-0">
            <h3 className="text-xl font-bold text-slate-200 mb-2 transition-all duration-300">{stats[currentStat].title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{stats[currentStat].desc}</p>
          </div>

          {/* Dots Indicator */}
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

        {/* Bottom Metadata */}
        <p className="text-xs text-slate-500 z-10 font-semibold tracking-wide">
          © {new Date().getFullYear()} {orgSettings?.orgName || 'Lili Organization'} CRM · Enterprise Portal
        </p>
      </div>

      {/* Right Panel: Focused Form Canvas */}
      <div className="w-full md:w-1/2 lg:w-2/5 min-h-screen bg-slate-50 flex items-center justify-center p-8 relative">
        {/* Mobile Logo & Organization Name (Hidden on Desktop) */}
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
            {orgSettings?.logo && typeof orgSettings.logo === 'string' && orgSettings.logo.trim() !== '' && orgSettings.logo !== 'undefined' ? (
              <img src={orgSettings.logo} alt="logo" className="w-full h-full object-cover rounded-lg" onError={(e) => { const img = e.target; if (!img.dataset.retried && orgSettings.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = orgSettings.logo.substring(orgSettings.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
            ) : (
              <GraduationCap className="w-4 h-4 text-white" />
            )}
          </div>
          <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">{orgSettings?.orgName || 'Lili Organization'}</span>
        </div>

        {/* Back Link */}
        <Link to="/" className="absolute top-8 right-8 text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-8 w-full max-w-md transition-all duration-300 hover:shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Super Admin Portal</h1>
            <p className="text-slate-450 text-xs font-bold mt-1.5 uppercase tracking-wider">Access Organization Dashboard</p>
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
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-850" 
                  placeholder="Enter administrator email" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-850" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full btn-primary py-3.5 rounded-xl text-white font-bold transition-all shadow-md shadow-primary-600/10 flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-lg active:scale-99 hover:shadow-primary-600/20 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Access Console'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
