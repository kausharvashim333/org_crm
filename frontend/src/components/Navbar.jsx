import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getOrgHomepagePublic, getPublicPartners, submitCentralInquiry, submitPartnerInquiry } from '../api';
import {
  GraduationCap, Search, Menu, X, BookOpen, MapPin, ExternalLink,
  ArrowRight, MessageSquare, LogIn, Lock, ChevronDown, Sparkles,
  Flame, Phone, Mail, Building2, HelpCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Navbar({ activePage }) {
  const { showSuccess, showError } = useToast();
  const [hp, setHp] = useState(null);
  const [partners, setPartners] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    getOrgHomepagePublic().then(res => setHp(res.data?.homepage)).catch(() => {});
    getPublicPartners().then(res => setPartners(res.data?.partners || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenu(false);
    setLoginDropdownOpen(false);
  }, [location.pathname]);

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India';
  const logo = hp?.settings?.logo;

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Computer & IT Training',
    message: ''
  });

  const [partnerEnquiryOpen, setPartnerEnquiryOpen] = useState(false);
  const [partnerEnquiryForm, setPartnerEnquiryForm] = useState({
    instituteName: '',
    contactName: '',
    phone: '',
    email: '',
    location: '',
    spaceArea: '',
    message: ''
  });

  useEffect(() => {
    const handleOpen = (e) => {
      setEnquiryOpen(true);
      if (e?.detail?.service) {
        setEnquiryForm(prev => ({ ...prev, service: e.detail.service }));
      }
    };
    const handlePartnerOpen = () => {
      setPartnerEnquiryOpen(true);
    };
    window.addEventListener('open-enquiry', handleOpen);
    window.addEventListener('open-partner-enquiry', handlePartnerOpen);
    return () => {
      window.removeEventListener('open-enquiry', handleOpen);
      window.removeEventListener('open-partner-enquiry', handlePartnerOpen);
    };
  }, []);

  const handlePartnerEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await submitPartnerInquiry(partnerEnquiryForm);
      showSuccess('Thank you! Your partner enquiry has been recorded in our system.');
      setPartnerEnquiryOpen(false);
      setPartnerEnquiryForm({
        instituteName: '',
        contactName: '',
        phone: '',
        email: '',
        location: '',
        spaceArea: '',
        message: ''
      });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit partner enquiry.');
    }
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await submitCentralInquiry({
        name: enquiryForm.name,
        phone: enquiryForm.phone,
        email: enquiryForm.email,
        courseInterest: enquiryForm.service,
        message: enquiryForm.message
      });
      showSuccess(hp?.enquiryConfig?.successMessage || 'Thank you! Your enquiry has been submitted successfully.');
      setEnquiryOpen(false);
      setEnquiryForm({
        name: '',
        email: '',
        phone: '',
        service: 'Computer & IT Training',
        message: ''
      });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit enquiry.');
    }
  };

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setMobileMenu(false);
    
    if (location.pathname === '/' && link.to.startsWith('/#')) {
      const hash = link.to.replace('/#', '');
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(link.to);
    }
  };

  const navLinks = [
    { label: 'Courses', to: '/courses', key: 'courses', badge: 'New' },
    { label: 'Services', to: '/services', key: 'services' },
    { label: 'Partner with Us', to: '/franchise', key: 'franchise' },
    { label: 'Centers', to: '/franchises', key: 'franchises' },
    { label: 'Notices', to: '/notices', key: 'notices' },
    { label: 'About', to: '/about', key: 'about' },
  ];

  // Search Filter
  const allCourses = [];
  if (hp?.courses?.fieldTabs) {
    hp.courses.fieldTabs.forEach(tab => {
      if (tab.courses) {
        tab.courses.forEach(c => {
          allCourses.push({ ...c, fieldName: tab.fieldName });
        });
      }
    });
  }

  const filteredCourses = searchQuery.trim() === '' ? [] : allCourses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartners = searchQuery.trim() === '' ? [] : partners.filter(p => 
    p.status === 'active' && (
      p.instituteName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <header className="w-full sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Top Announcement Marquee (Optional) */}
      {hp?.announcement?.show && (
        <div 
          className="w-full text-center py-1.5 px-3 text-[11px] font-bold overflow-hidden select-none border-b border-black/10"
          style={{ 
            backgroundColor: hp.announcement.bgColor || '#3730a3', 
            color: hp.announcement.textColor || '#ffffff' 
          }}
        >
          <div className="max-w-7xl mx-auto overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-marquee">
              {hp.announcement.text}
            </span>
          </div>
        </div>
      )}

      {/* Main Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          {logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'undefined' ? (
            <img
              src={logo}
              alt="logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-100 shadow-xs"
              onError={(e) => {
                if (!e.target.dataset.retried && logo.startsWith('/uploads/')) {
                  e.target.dataset.retried = 'true';
                  e.target.src = `/api${logo}`;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md text-white font-bold" style={{ backgroundColor: themeColor }}>
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <span className="font-black text-base sm:text-lg lg:text-xl tracking-tight text-slate-900 truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[260px]">
            {orgName}
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((l) => {
            const isActive = activePage === l.key || location.pathname === l.to;
            return (
              <a
                key={l.key}
                href={l.to}
                onClick={(e) => handleNavClick(e, l)}
                className={`relative px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{l.label}</span>
                {l.badge && (
                  <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black uppercase rounded-full tracking-wider shadow-xs">
                    {l.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Actions (Search trigger, Login Dropdown, Mobile menu toggle) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Search courses or centers"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search...</span>
          </button>

          {/* Single Unified Login Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95"
              style={{ backgroundColor: themeColor }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Login</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {loginDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Select Login Portal
                </div>

                <Link
                  to="/student/login"
                  onClick={() => setLoginDropdownOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50/80 transition-colors text-slate-800 hover:text-indigo-600 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Student LMS</p>
                    <p className="text-[10px] text-slate-400">Watch Courses & Exam</p>
                  </div>
                </Link>

                <Link
                  to="/partner/login"
                  onClick={() => setLoginDropdownOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-800 hover:text-slate-900 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Franchise Partner</p>
                    <p className="text-[10px] text-slate-400">Manage Center & Students</p>
                  </div>
                </Link>

                <Link
                  to="/admin/login"
                  onClick={() => setLoginDropdownOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-800 hover:text-slate-900 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Super Admin</p>
                    <p className="text-[10px] text-slate-400">Headquarters Control</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle (lg:hidden) */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenu && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-5 space-y-3 shadow-xl max-h-[80vh] overflow-y-auto">
          
          {/* Mobile Nav Links */}
          <div className="space-y-1">
            {navLinks.map((l) => {
              const isActive = activePage === l.key || location.pathname === l.to;
              return (
                <a
                  key={l.key}
                  href={l.to}
                  onClick={(e) => handleNavClick(e, l)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black uppercase rounded-full">
                      {l.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Quick Enquiries Trigger */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMobileMenu(false); window.dispatchEvent(new Event('open-enquiry')); }}
              className="py-2.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold text-center"
            >
              Course Enquiry
            </button>
            <button
              onClick={() => { setMobileMenu(false); window.dispatchEvent(new Event('open-partner-enquiry')); }}
              className="py-2.5 px-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold text-center"
            >
              Partner Franchise
            </button>
          </div>

        </div>
      )}
      </header>

      {/* Centers Strip */}
      {hp?.centersStrip?.show && hp?.centersStrip?.centers?.length > 0 && (
        <div className="w-full bg-white border-b border-slate-200/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{hp.centersStrip.title || 'Our Centers'}</span>
              {hp.centersStrip.centers.map((center, i) => (
                <a
                  key={i}
                  href={center.link || '#'}
                  target={center.link ? '_blank' : undefined}
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all shrink-0 group"
                >
                  {center.logo ? (
                    <img src={center.logo} alt={center.name} className="w-5 h-5 rounded object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  )}
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 whitespace-nowrap">{center.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[75vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search courses, certificates, centers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 text-sm md:text-base text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Type keywords to search courses, syllabus, and franchise centers...</p>
                </div>
              ) : (
                <>
                  {/* Courses Results */}
                  {filteredCourses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Courses</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {filteredCourses.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => { navigate('/courses'); setSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-start gap-3 p-3 hover:bg-indigo-50/50 rounded-xl cursor-pointer border border-transparent hover:border-indigo-100 group transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100">
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{c.name}</p>
                              <p className="text-xs text-slate-400 truncate">{c.description || 'Learn professional skills'}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all self-center" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partners/Centers Results */}
                  {filteredPartners.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Partner Centers</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {filteredPartners.map((p, i) => (
                          <Link
                            key={i}
                            to={`/institute/${p.slug}`}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-start gap-3 p-3 hover:bg-emerald-50/50 rounded-xl cursor-pointer border border-transparent hover:border-emerald-100 group transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors truncate">{p.instituteName}</p>
                              <p className="text-xs text-slate-400 truncate">{p.city}, {p.state}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all self-center" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredCourses.length === 0 && filteredPartners.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      <p>No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-white text-center relative" style={{ backgroundColor: themeColor }}>
              <button 
                onClick={() => setEnquiryOpen(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-black">{hp?.enquiryConfig?.modalTitle || 'Admission & Program Enquiry'}</h3>
              <p className="text-xs opacity-90 mt-0.5">Fill out your details to get instant counseling</p>
            </div>

            <form onSubmit={handleEnquirySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Amit Kumar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. amit@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Program / Course *</label>
                <select
                  required
                  value={enquiryForm.service}
                  onChange={(e) => setEnquiryForm(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="Computer & IT Training">Computer & IT Training</option>
                  <option value="Full Stack Web Development">Full Stack Web Development</option>
                  <option value="Tally Prime with GST">Tally Prime with GST</option>
                  <option value="ADCA Pro (Diploma in Computer Applications)">ADCA Pro</option>
                  <option value="Python AI & Data Science">Python AI & Data Science</option>
                  <option value="Graphic Designing & Video Editing">Graphic Designing & Video Editing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Message / Questions</label>
                <textarea
                  rows="2"
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Ask about fees, timing, franchise centers..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEnquiryOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  style={{ backgroundColor: themeColor }}
                >
                  Submit Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Franchise Modal */}
      {partnerEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-white text-center relative" style={{ backgroundColor: themeColor }}>
              <button 
                onClick={() => setPartnerEnquiryOpen(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-black">Partner Center Enquiry</h3>
              <p className="text-xs opacity-90 mt-0.5">Submit your center details to partner with us</p>
            </div>

            <form onSubmit={handlePartnerEnquirySubmit} className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Center / Institute Name *</label>
                  <input
                    type="text"
                    required
                    value={partnerEnquiryForm.instituteName}
                    onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, instituteName: e.target.value }))}
                    placeholder="e.g. Apex Tech Institute"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={partnerEnquiryForm.contactName}
                    onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={partnerEnquiryForm.phone}
                    onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={partnerEnquiryForm.email}
                    onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. info@apex.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">City & State *</label>
                <input
                  type="text"
                  required
                  value={partnerEnquiryForm.location}
                  onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Remarks</label>
                <textarea
                  rows="2"
                  value={partnerEnquiryForm.message}
                  onChange={(e) => setPartnerEnquiryForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us about your center infrastructure..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPartnerEnquiryOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold rounded-xl shadow-md"
                  style={{ backgroundColor: themeColor }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Enquiry FAB Button Wrapper */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] flex items-center gap-3">
        {/* Callout Tooltip */}
        <div className="hidden sm:flex relative bg-slate-900/90 text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-800/80 backdrop-blur-md items-center gap-1.5 animate-callout-nudge select-none mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Enquiry here</span>
          {/* Right Arrow point */}
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900/90 border-r border-t border-slate-800/80 rotate-45" />
        </div>

        <button
          onClick={() => window.dispatchEvent(new Event('open-enquiry'))}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer mirror-shine border border-white/20 animate-enquiry-fab"
          style={{ backgroundColor: themeColor }}
          title="Make an Enquiry"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

    </>
  );
}
