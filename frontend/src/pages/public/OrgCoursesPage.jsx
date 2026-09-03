import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic, getStoreCourses, getCourseCategories } from '../../api';
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
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const navigate = useNavigate();

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
    <div className="bg-white min-h-screen flex flex-col font-sans">
      <SEO title="Courses - Training Institute" description="Explore our certified courses in paramedical, computer training, skill development, and stock market training" />
      <Navbar activePage="courses" />

      {/* Compact Premium Hero */}
      <section className="relative pt-14 pb-12 px-4 text-white overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${themeColor}, transparent)` }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${themeColor}40` }} />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-5 text-xs text-indigo-200">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-medium">ISO 9001:2015 Certified Programs</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Industry-Ready <span style={{ color: themeColor }}>Certifications</span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto mb-7 leading-relaxed">
            Hands-on practical training, live projects, QR-verified digital certificates, and lifetime access to study materials.
          </p>

          {/* Compact Search Bar */}
          <div className="max-w-lg mx-auto group relative">
            <div className="absolute -inset-px rounded-xl opacity-0 blur transition-opacity group-focus-within:opacity-30" style={{ background: `linear-gradient(135deg, ${themeColor}, #6366f1)` }} />
            <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden h-12">
              <div className="flex items-center justify-center w-11 h-full shrink-0 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search courses — Python, Tally, Web, React..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 mr-1 text-xs text-slate-400 hover:text-slate-700 font-medium shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Trust Highlights - Single Row */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-400" /> QR Certificate</span>
            <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5 text-indigo-400" /> Lifetime LMS</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> 100% Practical</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-sky-400" /> Hybrid Option</span>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="py-10 px-4 max-w-7xl mx-auto w-full flex-1">
        {/* Category Pills and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  selectedCategory === cat
                    ? 'text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={selectedCategory === cat ? { backgroundColor: themeColor } : {}}
              >
                {cat === 'All' ? 'All Courses' : cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-600">
            <span className="font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-5 font-medium">
          <span>{filteredCourses.length} courses found</span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="hover:underline text-xs font-semibold"
              style={{ color: themeColor }}
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No courses found</h3>
            <p className="text-sm text-slate-500 mb-5">Try adjusting your search or filter.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-5 py-2 text-white rounded-lg font-medium text-xs hover:brightness-110 transition-all"
              style={{ backgroundColor: themeColor }}
            >
              View All Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c, i) => {
              const original = c.originalPrice || c.fee || 0;
              const sale = c.salePrice || c.fee || 0;
              const discountPercent = original > sale ? Math.round(((original - sale) / original) * 100) : 0;

              return (
                <Reveal key={c._id || i} delay={i * 50}>
                  <div className="group bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
                    {/* Card Header */}
                    <div className="relative p-5 pb-4 bg-slate-900 overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,white,transparent_60%)]" />
                      <div className="relative z-10 flex items-start justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                          {c.category || 'Certification'}
                        </span>
                        {c.badge && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            c.badge === 'Bestseller'
                              ? 'bg-amber-400 text-amber-950'
                              : c.badge === 'Hot & New'
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}>
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-mono font-semibold tracking-wider mb-1" style={{ color: `${themeColor}99` }}>
                          {c.code || 'CERT'}
                        </div>
                        <h4 className="text-white font-bold text-base line-clamp-2 group-hover:text-slate-200 transition-colors">
                          {c.name}
                        </h4>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Stats Row */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3 pb-3 border-b border-slate-100">
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {c.rating || '4.9'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3 h-3" /> {c.enrolledCount || 250}+ enrolled
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {c.description || 'Master professional skills with hands-on projects and ISO recognized certification.'}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1 mb-4">
                        {(c.highlights && c.highlights.length > 0 ? c.highlights.slice(0, 2) : [
                          'QR-Verified Digital Certificate',
                          'Lifetime LMS Access',
                        ]).map((h, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{h}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meta Bar */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4 mt-auto">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {c.duration || '3 Months'}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" /> {c.chapters?.length || 10}+ Lessons
                        </span>
                        <span className="font-semibold text-emerald-600 ml-auto">
                          {c.level || 'All Levels'}
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-end justify-between mb-4 pt-3 border-t border-slate-100">
                        <div className="flex flex-col gap-0.5">
                          {c.feeDisplayType === 'monthly' && c.monthlyFee ? (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-900">₹{c.monthlyFee.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] font-bold text-slate-500">/month</span>
                              </div>
                            </>
                          ) : c.feeDisplayType === 'both' && c.monthlyFee ? (
                            <>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-slate-900">₹{c.monthlyFee.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] font-bold text-slate-500">/month</span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700">or ₹{sale.toLocaleString('en-IN')} full</span>
                              {original > sale && (
                                <span className="text-[10px] text-slate-400 line-through">₹{original.toLocaleString('en-IN')}</span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-slate-900">
                                ₹{sale.toLocaleString('en-IN')}
                              </span>
                              {original > sale && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{original.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {discountPercent > 0 && c.feeDisplayType !== 'monthly' && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Fee Note */}
                      {c.feeNote && (
                        <p className="text-[10px] text-slate-500 font-medium mb-3 italic leading-tight">{c.feeNote}</p>
                      )}

                      {/* CTA Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/courses/${c._id}`}
                          className="text-center py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Syllabus
                        </Link>
                        <Link
                          to={`/checkout/${c._id}`}
                          className="text-center py-2 px-2 text-white text-xs font-bold rounded-lg transition-all hover:brightness-110 flex items-center justify-center gap-1 group/btn"
                          style={{ backgroundColor: themeColor }}
                        >
                          Enroll <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* Partner Lab Hybrid Banner */}
      <section className="py-12 px-4 bg-slate-950 text-white relative overflow-hidden mt-8">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse 60% 80% at 20% 50%, ${themeColor}, transparent)` }} />
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-lg text-left">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 inline-block" style={{ backgroundColor: `${themeColor}30`, color: themeColor, border: `1px solid ${themeColor}40` }}>
              Hybrid Learning
            </span>
            <h2 className="text-2xl font-extrabold mb-2">
              Want Physical Lab Practice?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Enroll online and access your nearest partner training center for practical lab sessions and exam guidance.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/franchises"
                className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all text-xs flex items-center gap-1.5"
              >
                Find Center <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/apply-partner"
                className="px-5 py-2.5 border border-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-900 transition-all text-xs"
              >
                Become a Partner
              </Link>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-xl max-w-xs w-full text-left">
            <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> All Courses Include
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Govt Recognized Certificate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                24/7 LMS Portal Access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                PDF Study Notes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                GST Invoice & ID Card
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer homepageData={hp} />
    </div>
  );
}
