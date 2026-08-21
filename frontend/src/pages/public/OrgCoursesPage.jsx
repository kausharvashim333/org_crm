import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic, getStoreCourses } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  GraduationCap, BookOpen, Calendar, ArrowRight, Star, Clock, Users,
  Search, CheckCircle2, Award, Sparkles, Filter, PlayCircle, ShieldCheck,
  TrendingUp, Tag, ArrowUpRight
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
      getStoreCourses().catch(() => ({ data: { courses: [] } }))
    ]).then(([hpRes, coursesRes]) => {
      setHp(hpRes.data?.homepage || {});
      setCourses(coursesRes.data?.courses || []);
      setLoading(false);
    });
  }, []);

  const themeColor = hp?.settings?.themeColor || '#2563eb';

  const categories = ['All', 'Programming', 'Accounting', 'Diploma', 'Design', 'Basic'];

  // Filter & sort logic
  const filteredCourses = courses.filter(c => {
    const matchesCat = selectedCategory === 'All' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'popular') return (b.enrolledCount || 0) - (a.enrolledCount || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'price-low') return (a.salePrice || a.fee || 0) - (b.salePrice || b.fee || 0);
    if (sortBy === 'price-high') return (b.salePrice || b.fee || 0) - (a.salePrice || a.fee || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Loading certified course store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <SEO title="Courses - Training Institute" description="Explore our certified courses in paramedical, computer training, skill development, and stock market training" />
      <Navbar activePage="courses" />

      {/* Hero Banner with Modern Gradient */}
      <section className="relative pt-16 pb-20 px-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-blue-500/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6 text-sm text-indigo-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-medium">Govt. Recognized & ISO 9001:2015 Certified Programs</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Upgrade Your Career with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Industry-Ready Certifications
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Hands-on practical training, live projects, QR-verified digital certificates, and lifetime access to study materials.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 px-4 py-2 text-white">
              <Search className="w-5 h-5 text-indigo-300 shrink-0" />
              <input
                type="text"
                placeholder="Search by course name, skills (e.g. Python, Tally, Web, React)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm md:text-base focus:outline-none"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1 text-xs text-slate-300 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Career Counseling CTA */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300">
            <span>Confused about which course to choose?</span>
            <button
              onClick={() => window.dispatchEvent(new Event('open-enquiry'))}
              className="px-3.5 py-1.5 bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 rounded-full text-white font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>💬 Free Career Counseling</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Verifiable Certificate</div>
                <div className="text-xs text-slate-400">With Unique QR Code</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Video LMS Access</div>
                <div className="text-xs text-slate-400">Lifetime Study Portal</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">100% Practical</div>
                <div className="text-xs text-slate-400">Hands-on Exercises</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Hybrid Option</div>
                <div className="text-xs text-slate-400">Franchise Lab Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full flex-1">
        {/* Category Pills and Sort Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'All' ? '🔥 All Courses' : cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-sm text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Filter className="w-4 h-4" /> Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated ⭐</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-6 font-medium">
          <span>Showing {filteredCourses.length} certified courses</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-indigo-600 hover:underline text-xs"
            >
              Reset category filter
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No courses found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your search query or filter category.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              View All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((c, i) => {
              const original = c.originalPrice || c.fee || 0;
              const sale = c.salePrice || c.fee || 0;
              const discountPercent = original > sale ? Math.round(((original - sale) / original) * 100) : 0;
              const isBestseller = c.badge === 'Bestseller' || c.badge === 'Hot & New' || c.enrolledCount > 1000;

              return (
                <Reveal key={c._id || i} delay={i * 60}>
                  <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden relative">
                    {/* Top Banner Image / Gradient */}
                    <div className="h-44 relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-5 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,white,transparent_70%)]" />
                      
                      {/* Top Badges */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
                          {c.category || 'Certification'}
                        </span>
                        {c.badge && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            c.badge === 'Bestseller'
                              ? 'bg-amber-400 text-amber-950'
                              : c.badge === 'Hot & New'
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}>
                            ★ {c.badge}
                          </span>
                        )}
                      </div>

                      {/* Course Code / Meta */}
                      <div className="relative z-10">
                        <div className="text-indigo-200 text-xs font-mono font-semibold tracking-wider mb-1">
                          CODE: {c.code || 'CERT'}
                        </div>
                        <h4 className="text-white font-bold text-lg line-clamp-2 group-hover:text-indigo-200 transition-colors">
                          {c.name}
                        </h4>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Rating & Enrolled Stats */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>{c.rating || '4.9'}</span>
                            <span className="text-slate-400 font-normal">({c.ratingCount || 150}+ reviews)</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{c.enrolledCount || 250}+ students</span>
                          </div>
                        </div>

                        {/* Short Description */}
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {c.description || 'Master professional skills with hands-on projects and ISO recognized certification.'}
                        </p>

                        {/* Highlights checklist */}
                        <div className="space-y-1.5 mb-5">
                          {(c.highlights && c.highlights.length > 0 ? c.highlights.slice(0, 2) : [
                            'Govt & ISO QR-Verified Digital Certificate',
                            'Lifetime LMS Access & Source Material',
                          ]).map((h, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Meta + Pricing + CTA */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.duration || '3 Months'}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" /> {c.chapters?.length || 10}+ Lessons
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {c.level || 'All Levels'}
                          </span>
                        </div>

                        {/* Pricing Bar */}
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <div className="text-xs text-slate-400 font-medium">Full Course Fee</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-900">
                                ₹{sale.toLocaleString('en-IN')}
                              </span>
                              {original > sale && (
                                <span className="text-sm text-slate-400 line-through">
                                  ₹{original.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                          {discountPercent > 0 && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            to={`/courses/${c._id}`}
                            className="w-full text-center py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs md:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            Explore Syllabus
                          </Link>
                          <Link
                            to={`/checkout/${c._id}`}
                            className="w-full text-center py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1 group/btn"
                          >
                            Enroll Now <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* Franchise Lab Hybrid Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden mt-12">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-left">
            <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider mb-4 inline-block">
              Hybrid Learning Advantage
            </span>
            <h2 className="text-3xl font-extrabold mb-3">
              Want Physical Computer Lab Practice?
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Enroll online and choose your nearest franchise partner training center for practical doubts, lab access, and physical examination guidance!
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                to="/franchises"
                className="px-6 py-3 bg-white text-indigo-950 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm flex items-center gap-2 shadow-lg"
              >
                Find Nearest Center <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/apply-partner"
                className="px-6 py-3 bg-indigo-800/60 border border-indigo-400/30 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-all text-sm"
              >
                Become a Franchise Partner
              </Link>
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 p-6 rounded-2xl backdrop-blur-md max-w-sm w-full text-left">
            <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> All Courses Include:
            </h4>
            <ul className="space-y-3 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Govt Recognized Digital Certificate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                24/7 LMS Portal & Video Player
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Downloadable PDF Study Notes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Instant GST Invoice & ID Card
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer homepageData={hp} />
    </div>
  );
}
