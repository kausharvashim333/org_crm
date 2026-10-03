import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic, getStoreCourses, getCourseCategories, enrollStudentLmsCourse } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap, BookOpen, Star, Clock, Users, Search, CheckCircle2, Award,
  Sparkles, Filter, PlayCircle, ShieldCheck, ArrowUpRight, Gift, CreditCard,
  Layers, Check, X, ArrowRight, Crown
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
  const [courseSegment, setCourseSegment] = useState('all'); // 'all' | 'free' | 'paid'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [cardTrackOverrides, setCardTrackOverrides] = useState({}); // { [courseId]: 'free' | 'paid' }
  
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

  // Both Free and Paid segments display all courses, but with different track descriptions & benefits!
  const filteredCourses = courses.filter(c => {
    const matchesCat = selectedCategory === 'All' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesSearch = !searchQuery.trim() || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.freeDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.paidDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  }).sort((a, b) => {
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
        
        {/* SEGMENT SWITCHER: Free vs Paid vs All */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Main Segment Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto p-1.5 bg-slate-100/80 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setCourseSegment('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                courseSegment === 'all'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>All Courses ({courses.length})</span>
            </button>

            <button
              onClick={() => setCourseSegment('free')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                courseSegment === 'free'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Free Courses / निःशुल्क ({courses.length})</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${courseSegment === 'free' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                100% Free
              </span>
            </button>

            <button
              onClick={() => setCourseSegment('paid')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                courseSegment === 'paid'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-amber-800 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Paid Courses / प्रीमियम सर्टिफाइड ({courses.length})</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${courseSegment === 'paid' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                👑 Pro Certified
              </span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-600 w-full md:w-auto justify-end">
            <span className="font-bold flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Active Filters Banner / Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 font-medium px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{filteredCourses.length}</span>
            <span>
              {courseSegment === 'free' ? 'courses (Free Learning Track)' : courseSegment === 'paid' ? 'courses (Premium Pro Certification Track)' : 'courses available in both Free & Paid versions'}
            </span>
            {selectedCategory !== 'All' && (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                {selectedCategory}
              </span>
            )}
          </div>

          {(selectedCategory !== 'All' || courseSegment !== 'all' || searchQuery) && (
            <button
              onClick={() => { setSelectedCategory('All'); setCourseSegment('all'); setSearchQuery(''); }}
              className="hover:underline text-xs font-bold text-indigo-600 cursor-pointer"
            >
              Reset all filters
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
              // Determine if this card is currently showing Free or Paid version
              const isViewFree = courseSegment === 'free'
                ? true
                : (courseSegment === 'paid'
                    ? false
                    : (cardTrackOverrides[c._id] ? cardTrackOverrides[c._id] === 'free' : false));

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

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Link
                          to={`/courses/${c._id}?track=${isViewFree ? 'free' : 'paid'}`}
                          className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition text-center flex items-center justify-center cursor-pointer"
                        >
                          Syllabus
                        </Link>
                        
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

      <Footer hp={hp} />
    </div>
  );
}
