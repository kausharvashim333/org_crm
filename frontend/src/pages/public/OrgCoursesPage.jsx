import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getOrgHomepagePublic, getStoreCourses, getCourseCategories, enrollStudentLmsCourse } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap, BookOpen, Star, Clock, Users, Search, CheckCircle2, Award,
  Sparkles, Filter, PlayCircle, ShieldCheck, ArrowUpRight, Gift, CreditCard,
  Layers, Check, X, ArrowRight, Crown, HelpCircle, ChevronDown, ChevronUp,
  MessageCircle, Info, Zap
} from 'lucide-react';

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function OrgCoursesPage() {
  const [hp, setHp] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync segment with URL query parameter, default to 'free' (निःशुल्क) courses
  const [searchParams, setSearchParams] = useSearchParams();
  const segmentParam = searchParams.get('segment') || searchParams.get('tab') || searchParams.get('track');
  const [courseSegment, setCourseSegment] = useState(
    segmentParam === 'paid' ? 'paid' : (segmentParam === 'all' ? 'all' : 'free')
  );

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [cardTrackOverrides, setCardTrackOverrides] = useState({}); // { [courseId]: 'free' | 'paid' }
  
  // Modals & Interactive States
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [previewSyllabusCourse, setPreviewSyllabusCourse] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Free enrollment modal state for logged-in students
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [enrollingLoading, setEnrollingLoading] = useState(false);
  const [enrolledSuccessCourse, setEnrolledSuccessCourse] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const isStudentLoggedIn = Boolean(localStorage.getItem('student_token'));

  useEffect(() => {
    Promise.all([
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
      getStoreCourses().catch(() => ({ data: { courses: [] } })),
      getCourseCategories().catch(() => ({ data: { categories: [] } })),
    ]).then(([hpRes, coursesRes, catRes]) => {
      setHp(hpRes.data?.homepage || {});
      setCourses(coursesRes.data?.courses || []);
      const cats = (catRes.data?.categories || []).map(c => c.name);
      setCategories(['All', ...cats]);
      setLoading(false);
    });
  }, []);

  const themeColor = hp?.settings?.themeColor || '#2563eb';

  const isCourseFree = (c) => {
    return Boolean(c.isFree) || (Number(c.salePrice || 0) === 0 && Number(c.fee || 0) === 0 && Number(c.studentFee || 0) === 0) || c.feeDisplayType === 'free';
  };

  const handleTabChange = (segment) => {
    setCourseSegment(segment);
    setSearchParams({ segment });
  };

  // Both Free and Paid segments display all courses, but with different track descriptions & benefits!
  const filteredCourses = courses.filter(c => {
    const matchesCat = selectedCategory === 'All' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesLevel = selectedLevel === 'All' || (c.level || '').toLowerCase() === selectedLevel.toLowerCase();
    
    const matchesSearch = !searchQuery.trim() || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.freeDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.paidDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesLevel && matchesSearch;
  }).sort((a, b) => {
    // If in 'all' view, free courses are prioritized first!
    if (courseSegment === 'all') {
      const aFree = isCourseFree(a) ? 1 : 0;
      const bFree = isCourseFree(b) ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
    }

    if (sortBy === 'popular') return (b.enrolledCount || 0) - (a.enrolledCount || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  const handleEnrollClick = (course, isPaidTrack = false) => {
    if (!isPaidTrack) {
      if (isStudentLoggedIn) {
        setEnrollingCourse(course);
      } else {
        navigate(`/checkout/${course._id}?track=free`);
      }
    } else {
      navigate(`/checkout/${course._id}?track=paid`);
    }
  };

  const handleConfirmFreeEnroll = async () => {
    if (!enrollingCourse) return;
    setEnrollingLoading(true);
    try {
      await enrollStudentLmsCourse({ courseId: enrollingCourse._id });
      showSuccess(`Successfully enrolled in ${enrollingCourse.name}!`);
      setEnrolledSuccessCourse(enrollingCourse);
      setEnrollingCourse(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to enroll into course');
    } finally {
      setEnrollingLoading(false);
    }
  };

  const whatsappPhone = (hp?.contact?.phone || '').replace(/\D/g, '');
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone.length === 10 ? '91' + whatsappPhone : whatsappPhone}?text=Hello%20Lili%20Organization,%20I%20want%20to%20know%20more%20about%20your%20Free%20and%20Certified%20Courses`
    : 'https://wa.me/?text=Hello%20Lili%20Organization,%20I%20want%20to%20know%20more%20about%20courses';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300 tracking-wide">Loading course catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <SEO 
        title="Courses & Certifications - Free & Professional Career Programs" 
        description="Explore free and industry-certified programs in computer education, technical skills, medical diagnostics, and vocational training with QR-verified digital certificates." 
      />
      <Navbar activePage="courses" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 px-4 text-white overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 50% 20%, ${themeColor}, transparent 65%)` }} />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${themeColor}40` }} />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-5 text-xs text-indigo-200 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold tracking-wide">ISO 9001:2015 Certified Curriculum & Digital LMS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white">
            Skill-Up with Industry <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Certifications</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Choose from <span className="text-emerald-400 font-bold">100% Free Skill Courses</span> or advance your career with <span className="text-indigo-300 font-bold">Verified Professional Certifications</span> with physical lab training and lifetime LMS access.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto group relative mb-8">
            <div className="absolute -inset-1 rounded-2xl opacity-40 blur transition-opacity group-focus-within:opacity-80" style={{ background: `linear-gradient(135deg, ${themeColor}, #6366f1)` }} />
            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden h-14 px-3 border border-white/20">
              <div className="flex items-center justify-center w-10 h-full shrink-0 text-slate-400">
                <Search className="w-5 h-5 text-indigo-600" />
              </div>
              <input
                type="text"
                placeholder="Search courses by name or skill — Python, ADCA, Tally, Web, Paramedical..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium px-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg shrink-0 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Value Props Row */}
          <div className="flex items-center justify-center gap-5 sm:gap-8 flex-wrap text-xs font-medium text-slate-300">
            <span className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-400" /> QR-Verified Certificates</span>
            <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-indigo-400" /> Self-Paced Video Lectures</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-400" /> 100% Practical Assessments</span>
            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-sky-400" /> Offline Lab Practicals</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-10 px-4 max-w-7xl mx-auto w-full flex-1">
        
        {/* SEGMENT SWITCHER: Free (Default 1st) vs Paid (2nd) vs All (3rd) - NO SCROLL NEEDED */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-sm mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Main Segment Tabs: Responsive 3-Column Grid (Zero Scroll) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 w-full lg:max-w-xl">
            {/* 1. Free Courses Tab (Default) */}
            <button
              type="button"
              onClick={() => handleTabChange('free')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                courseSegment === 'free'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 shrink-0" />
                <span className="text-xs">Free Track</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                courseSegment === 'free' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                100% Free
              </span>
            </button>

            {/* 2. Paid / Pro Certification Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('paid')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                courseSegment === 'paid'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white shadow-md shadow-amber-500/30 font-black'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 shrink-0 fill-current" />
                <span className="text-xs">Pro Track</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                courseSegment === 'paid' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                👑 Certified
              </span>
            </button>

            {/* 3. All Courses Tab */}
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                courseSegment === 'all'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 shrink-0 text-indigo-600" />
                <span className="text-xs">All Courses</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                courseSegment === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {courses.length}
              </span>
            </button>
          </div>

          {/* Quick Actions: Compare Tracks & Sort (Fits without pushing or overflowing) */}
          <div className="flex items-center gap-2.5 shrink-0 text-xs text-slate-600 justify-between lg:justify-end">
            <button
              type="button"
              onClick={() => setShowComparisonModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-indigo-200/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compare Free vs Pro</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-bold flex items-center gap-1 text-slate-500">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* DYNAMIC TRACK BANNER */}
        {courseSegment === 'free' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border border-emerald-500/30 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                    100% Free Education Track
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ₹0 Tuition Fee • Lifetime LMS Portal Access
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  सभी विद्यार्थियों के लिए बिना किसी एडमिशन चार्ज के डिजिटल शिक्षा। वीडियो क्लासेज, असाइनमेंट्स और स्टूडेंट पोर्टल। यदि आपको सरकारी/कॉर्पोरेट नौकरियों के लिए मान्यता प्राप्त हार्डकॉपी सर्टिफिकेट व ऑफलाइन लैब प्रैक्टिकल चाहिए, तो आप प्रो ट्रैक भी चुन सकते हैं।
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowComparisonModal(true)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Info className="w-3.5 h-3.5 text-emerald-300" />
              <span>Free vs Pro तुलना</span>
            </button>
          </div>
        )}

        {courseSegment === 'paid' && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white border border-amber-500/40 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                <Crown className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950">
                    👑 Premium Pro Certification Track
                  </span>
                  <span className="text-xs text-amber-200 font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> ISO 9001:2015 QR-Verified Hardcopy • Offline Computer Lab Hands-On
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  करियर और नौकरी के लिए पूर्ण मान्यता प्राप्त सर्टिफिकेशन। Lili के अधिकृत पार्टनर सेंटर्स पर हैंड्स-ऑन कंप्यूटर लैब प्रैक्टिकल, 1-on-1 फैकल्टी डाउट सेशन्स और प्लेसमेंट गाइडेंस।
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowComparisonModal(true)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Pro Track Benefits</span>
            </button>
          </div>
        )}

        {courseSegment === 'all' && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-900/40 text-slate-200 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Lili Organization के प्रत्येक कोर्स में दो ट्रैक्स उपलब्ध हैं: <strong>100% Free Foundation Track</strong> और <strong>👑 Premium Pro Certified Track</strong>।</span>
            </div>
            <button
              onClick={() => setShowComparisonModal(true)}
              className="text-xs text-indigo-300 hover:text-white font-bold underline shrink-0 cursor-pointer"
            >
              दोनों ट्रैक्स की तुलना देखें
            </button>
          </div>
        )}

        {/* Category Pills & Level Filters (No Horizontal Scroll - Neatly Wrapped) */}
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 space-y-3">
          {/* Category Filter Pills (Wrapped cleanly) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Level Filter Pills (Wrapped cleanly) */}
          <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 mr-1">
              Skill Level:
            </span>
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {lvl === 'All' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Banner / Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 font-medium px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">{filteredCourses.length}</span>
            <span>
              {courseSegment === 'free' ? 'courses (100% Free Learning Track)' : courseSegment === 'paid' ? 'courses (Premium Pro Certification Track)' : 'courses available in Free & Pro versions'}
            </span>
            {selectedCategory !== 'All' && (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                Category: {selectedCategory}
              </span>
            )}
            {selectedLevel !== 'All' && (
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                Level: {selectedLevel}
              </span>
            )}
          </div>

          {(selectedCategory !== 'All' || selectedLevel !== 'All' || courseSegment !== 'free' || searchQuery) && (
            <button
              type="button"
              onClick={() => { setSelectedCategory('All'); setSelectedLevel('All'); handleTabChange('free'); setSearchQuery(''); }}
              className="hover:underline text-xs font-bold text-indigo-600 cursor-pointer"
            >
              Reset to Default (Free)
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-4">
            <BookOpen className="w-14 h-14 mx-auto text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800">No courses match your criteria</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              We could not find any courses matching your search or category filter.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setCourseSegment('all'); setSearchQuery(''); }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              View All Courses
            </button>
          </div>
        ) : (
          /* Redesigned Course Cards Grid: Same courses in Free vs Paid with distinct descriptions & Premium Icon */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c, i) => {
              const isViewFree = courseSegment === 'free'
                ? true
                : (courseSegment === 'paid'
                    ? false
                    : (cardTrackOverrides[c._id] ? cardTrackOverrides[c._id] === 'free' : isCourseFree(c)));

              const currentDescription = isViewFree
                ? (c.freeDescription || c.description || 'Learn core concepts and practical lessons for free with lifetime LMS student portal access.')
                : (c.paidDescription || c.description || 'Advance your career with ISO 9001:2015 recognized certification, offline computer lab access, and placement assistance.');

              return (
                <Reveal key={c._id || i} delay={i * 40}>
                  <div className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col h-full overflow-hidden relative ${
                    !isViewFree
                      ? 'border-amber-300/60 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 ring-1 ring-amber-400/20'
                      : 'border-slate-200/80 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10'
                  }`}>
                    
                    {/* Top Header Card Banner */}
                    <div className={`p-6 pb-5 relative overflow-hidden text-white ${
                      isViewFree
                        ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900'
                        : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-amber-950/70'
                    }`}>
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_70%_30%,white,transparent_65%)]" />
                      
                      {/* Top Badges Row: Category + Premium or Free Badge */}
                      <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                          {c.category || 'Certification'}
                        </span>

                        {/* Free vs Paid Distinct Badge WITH PREMIUM CROWN ICON */}
                        {isViewFree ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white flex items-center gap-1 shadow-sm shadow-emerald-500/30">
                            <Gift className="w-3.5 h-3.5" /> 100% Free Track
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 flex items-center gap-1.5 shadow-md shadow-amber-500/30 border border-amber-300">
                            <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" />
                            <span>PREMIUM PRO</span>
                          </span>
                        )}
                      </div>

                      {/* Code & Title */}
                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold tracking-wider opacity-75">
                            {c.code || 'CERT'}
                          </span>
                          {!isViewFree && (
                            <span className="px-1.5 py-0.2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-bold rounded">
                              PRO CERTIFIED
                            </span>
                          )}
                        </div>
                        <h4 className="text-white font-black text-lg line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">
                          {c.name}
                        </h4>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Track Switcher if in 'All' Tab */}
                      {courseSegment === 'all' && (
                        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setCardTrackOverrides(prev => ({ ...prev, [c._id]: 'free' }))}
                            className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isViewFree ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Gift className="w-3 h-3" /> Free Track
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardTrackOverrides(prev => ({ ...prev, [c._id]: 'paid' }))}
                            className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              !isViewFree ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Crown className="w-3 h-3 fill-slate-950" /> Premium Pro
                          </button>
                        </div>
                      )}

                      {/* Rating & Learners Counter */}
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span>{c.rating || '4.9'}</span>
                          <span className="text-slate-400 font-normal">({c.ratingCount || 150}+)</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.enrolledCount || 300}+ students enrolled</span>
                        </div>
                      </div>

                      {/* Distinct Description (Free vs Paid) */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-slate-400">
                          {isViewFree ? (
                            <><Gift className="w-3 h-3 text-emerald-600" /> Free Course Overview</>
                          ) : (
                            <><Crown className="w-3 h-3 text-amber-500 fill-amber-500" /> Premium Curriculum Overview</>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {currentDescription}
                        </p>
                      </div>

                      {/* Track-Specific Highlights (What you get) */}
                      <div className={`space-y-1.5 p-3 rounded-2xl border ${
                        isViewFree
                          ? 'bg-emerald-50/50 border-emerald-100'
                          : 'bg-amber-50/40 border-amber-200/60'
                      }`}>
                        {(isViewFree ? [
                          'Lifetime LMS Student Portal Access',
                          'Recorded Video Lectures & Exercises',
                        ] : [
                          'ISO 9001:2015 QR-Verified Hardcopy Certificate',
                          'Offline Computer Lab Access at Partner Centers',
                        ]).map((h, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                            {isViewFree ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                            )}
                            <span className="line-clamp-1">{h}</span>
                          </div>
                        ))}
                      </div>

                      {/* Metadata Row: Duration, Chapters, Level */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.duration || '3 Months'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {c.chapters?.length || 10}+ Lessons
                        </span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {c.level || 'All Levels'}
                        </span>
                      </div>

                      {/* Program Nature Callout Box (NO AMOUNT SHOWN) */}
                      <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
                        isViewFree 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/70' 
                          : 'bg-gradient-to-r from-amber-50 to-indigo-50/60 text-slate-900 border border-amber-200/80'
                      }`}>
                        <div className="flex items-center gap-2">
                          {isViewFree ? (
                            <>
                              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-black text-emerald-800 block text-[11px] uppercase tracking-wide">100% Free Enrollment</span>
                                <span className="text-[10px] text-emerald-700">Open for all students</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                              <div>
                                <span className="font-black text-slate-900 block text-[11px] uppercase tracking-wide">Industry Certification</span>
                                <span className="text-[10px] text-slate-600">With Hardcopy & Lab Access</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isViewFree
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'bg-amber-200 text-amber-950 font-black flex items-center gap-1'
                        }`}>
                          {!isViewFree && <Crown className="w-3 h-3 fill-amber-950" />}
                          {isViewFree ? 'Free' : 'Pro'}
                        </span>
                      </div>

                      {/* Required Course Class Availability Note on Card */}
                      <div className={`p-2.5 rounded-2xl text-[11px] leading-snug flex items-start gap-2 border ${
                        isViewFree
                          ? 'bg-amber-50/95 border-amber-200/90 text-amber-950 shadow-xs'
                          : 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950 shadow-xs'
                      }`}>
                        <span className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shrink-0 mt-0.5 ${
                          isViewFree ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'
                        }`}>
                          नोट
                        </span>
                        <p className="font-semibold">
                          {isViewFree ? (
                            <>Free courses की क्लासेज तब ही चलाई जाएँगी जब किसी <strong className="text-amber-900 font-black">CSR या Govt. द्वारा फंडिंग</strong> उपलब्ध होगी।</>
                          ) : (
                            <>Training expert faculty द्वारा <strong className="text-emerald-900 font-black">हमेशा उपलब्ध रहती है</strong> (Immediate Start & Regular Practical Batches)।</>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewSyllabusCourse({ ...c, isViewFree })}
                          className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Syllabus</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleEnrollClick(c, !isViewFree)}
                          className={`py-3 px-3 text-white text-xs font-black rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                            isViewFree
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:opacity-95 shadow-amber-500/25 text-white'
                          }`}
                        >
                          {!isViewFree && <Crown className="w-3.5 h-3.5 fill-white" />}
                          <span>{isViewFree ? 'Free Enroll' : 'Get Certified'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* Free Enrollment Confirmation Modal for Logged-In Student */}
      {enrollingCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-center relative">
            <button
              onClick={() => setEnrollingCourse(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Free Course Enrollment
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Enroll in {enrollingCourse.name}?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                This course is free. It will be immediately activated in your Student LMS Profile with lifetime access to all video chapters and online tests.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1 text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Zero admission charge (₹0 Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Instant access in your LMS dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Official Free Enrollment Receipt issued in profile</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-slate-200/80 text-amber-900 text-[11px] font-semibold">
                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 font-black text-[9px] uppercase tracking-wider shrink-0 mt-0.5">
                  नोट
                </span>
                <span>Free courses की क्लासेज तब ही चलाई जाएँगी जब किसी CSR या Govt. द्वारा फंडिंग उपलब्ध होगी।</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEnrollingCourse(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFreeEnroll}
                disabled={enrollingLoading}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {enrollingLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Confirm Free Enrollment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal After Enrolling */}
      {enrolledSuccessCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">
                You are Enrolled! 🎉
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong className="text-slate-900">{enrolledSuccessCourse.name}</strong> is now added to your profile. You can start watching videos, take assessments, or enroll in more extra courses from your student dashboard!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                to={`/student/courses/${enrolledSuccessCourse._id}`}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Start Learning Now
              </Link>
              <Link
                to="/student/dashboard"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5"
              >
                <span>Go to Student Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Extra Courses Guidance Banner */}
      <section className="py-12 px-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white relative overflow-hidden mt-12">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-xl">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-indigo-300 border border-white/15 inline-block">
              Multi-Course Learning Benefit
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Already Enrolled? Add Extra Courses Inside Your Profile
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Once you enroll in any course, your Student LMS Profile allows you to explore and activate extra courses anytime with 1-click or seamless payment options.
            </p>
          </div>

          <Link
            to="/student/login"
            className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-2xl transition shadow-xl shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Open Student Profile</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </Link>
        </div>
      </section>

      {/* Academic Counselor / WhatsApp Assistance Section */}
      <section className="py-8 px-4 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="space-y-2 max-w-2xl relative z-10 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white inline-block">
              Free Career Guidance
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              कोर्स चुनने में मदद चाहिए? Lili Advisor से सीधे बात करें
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              अगर आप तय नहीं कर पा रहे हैं कि कौन सा कोर्स या ट्रैक (Free या Pro) आपके करियर के लिए सबसे सही रहेगा, तो हमारे अकादमिक काउंसलर से WhatsApp पर निःशुल्क परामर्श लें।
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs rounded-2xl shadow-xl transition shrink-0 flex items-center gap-2 cursor-pointer relative z-10"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp पर सलाह लें</span>
          </a>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section className="py-12 px-4 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-2">
            Frequently Asked Questions
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            कोर्सेस और एनरोलमेंट से जुड़े अक्सर पूछे जाने वाले सवाल
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Free और Pro Certification ट्रैक्स के बारे में आपके सभी सवालों के जवाब यहाँ हैं
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'क्या Free Courses में सच में कोई छुपा हुआ शुल्क (Hidden Fee) नहीं है?',
              a: 'हाँ, Lili Organization के Free Courses 100% निःशुल्क हैं। इसमें कोई एडमिशन चार्ज या छिपा हुआ मासिक शुल्क नहीं है। आपको सेल्फ-पेस्ड वीडियो लेक्चर्स, ऑनलाइन प्रैक्टिस टेस्ट और लाइफटाइम स्टूडेंट पोर्टल एक्सेस तुरंत मिलता है।'
            },
            {
              q: 'Free Course और Pro Certification Track में मुख्य अंतर क्या है?',
              a: 'Free Track में आपको पूरा ऑनलाइन करिकुलम, वीडियो क्लासेस और ऑनलाइन टेस्ट मिलते हैं। जबकि Pro Track में आपको ISO 9001:2015 मान्यता प्राप्त हार्डकॉपी सर्टिफिकेट (QR कोड सत्यापन के साथ), पार्टनर सेंटर्स पर ऑफलाइन कंप्यूटर लैब एक्सेस, और 1-on-1 फैकल्टी डाउट क्लीयरेंस व प्लेसमेंट असिस्टेंस मिलता है।'
            },
            {
              q: 'क्या मैं एक साथ एक से ज्यादा Free Courses में एनरोल कर सकता हूँ?',
              a: 'बिल्कुल! जब आप किसी भी एक कोर्स में एनरोल करते हैं, तो आपके Student LMS Profile डैशबोर्ड में "Extra Courses" का विकल्प खुल जाता है, जहाँ से आप अपनी पसंद के अन्य फ्री कोर्सेस को भी 1-क्लिक में शुरू कर सकते हैं।'
            },
            {
              q: 'Free Course पूरा करने के बाद क्या Pro Certificate में अपग्रेड कर सकते हैं?',
              a: 'हाँ, यदि आप पहले फ्री में सीखते हैं और बाद में सरकारी/कॉर्पोरेट नौकरियों के लिए मान्यता प्राप्त सर्टिफिकेट या ऑफलाइन लैब प्रैक्टिकल चाहते हैं, तो आप कभी भी अपने स्टूडेंट प्रोफाइल से प्रो सर्टिफिकेशन में अपग्रेड कर सकते हैं।'
            },
            {
              q: 'एडमिशन और कोर्स पेमेंट की रसीद (Receipt) कहाँ मिलेगी?',
              a: 'सफलतापूर्वक एनरोलमेंट होने के बाद आपको तुरंत आपके स्टूडेंट डैशबोर्ड में आधिकारिक "Admission & Course Receipt" मिल जाती है, जिसे आप कभी भी पीडीएफ में डाउनलोड या प्रिंट कर सकते हैं।'
            }
          ].map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-800 hover:text-indigo-600 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Track Comparison Modal (Free Track vs Pro Certification) */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowComparisonModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-2">
                Curriculum Track Comparison
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Free Track vs Pro Certification
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Choose the best path for your career goals. You can always start with Free and upgrade anytime.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold text-slate-700">Course Features</th>
                    <th className="py-3 px-4 font-black text-emerald-800 text-center bg-emerald-50/70 border-x border-slate-200 w-1/3">
                      <div className="flex items-center justify-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Free Track</span>
                      </div>
                      <span className="text-[10px] font-normal text-emerald-600 block mt-0.5">100% Free (₹0)</span>
                    </th>
                    <th className="py-3 px-4 font-black text-amber-900 text-center bg-amber-50/70 w-1/3">
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                        <span>Pro Certified Track</span>
                      </div>
                      <span className="text-[10px] font-normal text-amber-700 block mt-0.5">Career & Job Ready</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-3 px-4">Full Video Classes & Practical Lessons</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-emerald-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Lifetime Student LMS Portal Access</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-emerald-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Self-Paced Online Practice Assessments</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-emerald-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Enroll in Extra Free Courses from Profile</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-emerald-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <Check className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Official Enrollment & Fee Receipt</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-emerald-600 font-bold">
                      <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">₹0 Free Receipt</span>
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900">Tax Invoice Receipt</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">ISO 9001:2015 QR-Verified Hardcopy Certificate</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-slate-300">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <div className="flex items-center justify-center gap-1 text-amber-700">
                        <Crown className="w-3.5 h-3.5 fill-amber-700" />
                        <span>Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Hands-On Computer Lab Training at Partner Centers</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-slate-300">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <div className="flex items-center justify-center gap-1 text-amber-700">
                        <Crown className="w-3.5 h-3.5 fill-amber-700" />
                        <span>Offline Access</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">1-on-1 Faculty Mentorship & Doubt Resolution</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-slate-300">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <div className="flex items-center justify-center gap-1 text-amber-700">
                        <Crown className="w-3.5 h-3.5 fill-amber-700" />
                        <span>Included</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Placement Assistance & Mock Interviews</td>
                    <td className="py-3 px-4 text-center bg-emerald-50/30 border-x border-slate-200 text-slate-300">
                      <X className="w-4 h-4 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30 text-amber-600 font-bold">
                      <div className="flex items-center justify-center gap-1 text-amber-700">
                        <Crown className="w-3.5 h-3.5 fill-amber-700" />
                        <span>Included</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Bottom CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { handleTabChange('free'); setShowComparisonModal(false); }}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Gift className="w-4 h-4" />
                <span>Show Free Courses</span>
              </button>

              <button
                type="button"
                onClick={() => { handleTabChange('paid'); setShowComparisonModal(false); }}
                className="py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Crown className="w-4 h-4 fill-white" />
                <span>Show Pro Certified Courses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Syllabus Preview Modal */}
      {previewSyllabusCourse && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setPreviewSyllabusCourse(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {previewSyllabusCourse.category || 'Course'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {previewSyllabusCourse.code}
                </span>
                {previewSyllabusCourse.isViewFree ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Free Track
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-amber-700" /> Pro Certified
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900 leading-snug">
                {previewSyllabusCourse.name}
              </h3>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Duration: {previewSyllabusCourse.duration || '3 Months'}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {previewSyllabusCourse.chapters?.length || 10}+ Lessons</span>
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Level: {previewSyllabusCourse.level || 'All Levels'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Curriculum Overview</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {previewSyllabusCourse.isViewFree
                    ? (previewSyllabusCourse.freeDescription || previewSyllabusCourse.description)
                    : (previewSyllabusCourse.paidDescription || previewSyllabusCourse.description)}
                </p>
              </div>

              {/* Official Availability Note */}
              <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                previewSyllabusCourse.isViewFree
                  ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-xs'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-xs'
              }`}>
                <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5 ${
                  previewSyllabusCourse.isViewFree ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'
                }`}>
                  नोट
                </span>
                <p className="font-semibold leading-relaxed">
                  {previewSyllabusCourse.isViewFree ? (
                    <>Free courses की क्लासेज तब ही चलाई जाएँगी जब किसी <strong className="text-amber-900 font-black">CSR या Govt. द्वारा फंडिंग</strong> उपलब्ध होगी।</>
                  ) : (
                    <>Training expert faculty द्वारा <strong className="text-emerald-900 font-black">हमेशा उपलब्ध रहती है</strong> (Immediate Start & Regular Practical Batches)।</>
                  )}
                </p>
              </div>

              {/* Chapters / Topics Outline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Modules & Syllabus Topics ({previewSyllabusCourse.chapters?.length || 4}+ Modules)
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {previewSyllabusCourse.chapters && previewSyllabusCourse.chapters.length > 0 ? (
                    previewSyllabusCourse.chapters.map((ch, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{ch.title || `Chapter ${idx + 1}`}</span>
                        </div>
                        {ch.duration && <span className="text-[11px] text-slate-400">{ch.duration}</span>}
                      </div>
                    ))
                  ) : (
                    ['Core Fundamentals & Theoretical Concepts', 'Hands-on Exercises & Real-World Lab Practicals', 'Specialized Industry Tools & Case Studies', 'Final Skill Evaluation & Certification Assessment'].map((mod, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-700">{mod}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Link
                  to={`/courses/${previewSyllabusCourse._id}?track=${previewSyllabusCourse.isViewFree ? 'free' : 'paid'}`}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5"
                >
                  <span>Full Course Details Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const isPaid = !previewSyllabusCourse.isViewFree;
                    setPreviewSyllabusCourse(null);
                    handleEnrollClick(previewSyllabusCourse, isPaid);
                  }}
                  className={`py-3 px-4 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                    previewSyllabusCourse.isViewFree
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:opacity-95 shadow-amber-500/30'
                  }`}
                >
                  {!previewSyllabusCourse.isViewFree && <Crown className="w-3.5 h-3.5 fill-white" />}
                  <span>{previewSyllabusCourse.isViewFree ? 'Enroll in Free Track' : 'Get Pro Certified'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer hp={hp} />
    </div>
  );
}
