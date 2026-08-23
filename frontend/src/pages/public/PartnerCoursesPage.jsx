import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses } from '../../api';
import {
  GraduationCap, BookOpen, Clock, Search, Star, ArrowRight, Menu, X,
  Sparkles, ChevronRight, Tag
} from 'lucide-react';

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`${className} transition-all duration-700 ease-out`} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function PartnerCoursesPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
      getPublicCourses({ partnerId: res.data.partner._id }).then(r => setCourses(r.data.courses)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderTopColor: '#2563eb' }}></div>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Loading Courses...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="p-8 bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-lg">
        <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Institute Not Found</h2>
        <Link to="/franchises" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">Browse All Centers</Link>
      </div>
    </div>
  );

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage.settings?.themeColor || '#2563eb';
  const fixUrl = (url) => { if (!url) return ''; if (url.startsWith('/uploads/')) return `/api${url}`; return url; };
  const activeCourses = courses.filter(c => c.isActive && c.approvalStatus === 'approved');
  const categories = ['All', ...Array.from(new Set(activeCourses.map(c => c.category).filter(Boolean)))];
  const filtered = activeCourses.filter(c => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (search) { const q = search.toLowerCase(); return c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q); }
    return true;
  });

  const navLinks = [
    { label: 'Home', href: `/institute/${slug}` },
    { label: 'Courses', href: `/institute/${slug}/courses` },
    { label: 'About', href: `/institute/${slug}/about` },
    { label: 'Faculty', href: `/institute/${slug}/faculty` },
    { label: 'Gallery', href: `/institute/${slug}/gallery` },
    { label: 'Contact', href: `/institute/${slug}/contact` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/institute/${slug}`} className="flex items-center gap-2.5">
            {partner.logo ? <img src={fixUrl(partner.logo)} alt="logo" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
            <span className="font-bold text-base text-slate-900 truncate max-w-[200px]">{partner.instituteName}</span>
          </Link>
          <div className="flex items-center gap-1">
            {navLinks.map(l => <Link key={l.label} to={l.href} className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium hidden md:block ${l.label === 'Courses' ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`} style={l.label === 'Courses' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(l => <Link key={l.label} to={l.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${l.label === 'Courses' ? 'text-white' : 'text-slate-700 hover:bg-slate-50'}`} style={l.label === 'Courses' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <section className="py-12 px-4" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
        <div className="max-w-6xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Our Courses</h1>
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto">Explore our industry-aligned courses designed to build practical skills and boost your career.</p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-6 px-4 bg-white border-b border-slate-100 sticky top-[57px] z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} style={selectedCategory === cat ? { backgroundColor: themeColor } : {}}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c, i) => (
                <Reveal key={c._id} delay={i * 60}>
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group hover:-translate-y-1 duration-300 flex flex-col h-full">
                    <div className="h-36 relative overflow-hidden" style={{ background: c.image ? `url(${fixUrl(c.image)}) center/cover` : `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }}>
                      {!c.image && <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-12 h-12 text-white/40" /></div>}
                      {c.category && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-700">{c.category}</span>}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-900 text-base mb-1.5">{c.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-1">{c.description || 'Comprehensive training program with practical assignments.'}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> {c.duration || 'Flexible'}
                        </div>
                        <span className="font-black text-base" style={{ color: themeColor }}>₹{c.studentFee || c.fee || 0}</span>
                      </div>
                      <Link to={`/institute/${slug}/admission`} className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all hover:scale-105" style={{ backgroundColor: themeColor }}>
                        Enroll Now <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No courses found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
          <p className="text-xs opacity-50 mt-2">Powered by {data.orgName || 'Skill India'}</p>
        </div>
      </footer>
    </div>
  );
}
