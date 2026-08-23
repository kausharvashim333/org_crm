import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage } from '../../api';
import {
  GraduationCap, Bell, X, Menu, Calendar, ChevronRight, Search
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

export default function PartnerNoticesPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderTopColor: '#2563eb' }}></div>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Loading Notices...</p>
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
  const notices = homepage.notices?.items || [];
  const filtered = notices.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
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
            {navLinks.map(l => <Link key={l.label} to={l.href} className="text-sm px-3 py-2 rounded-lg transition-colors font-medium hidden md:block text-slate-600 hover:text-slate-900 hover:bg-slate-50">{l.label}</Link>)}
            <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105 hidden sm:block" style={{ backgroundColor: themeColor }}>Login</Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(l => <Link key={l.label} to={l.href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium">{l.label}</Link>)}
              <Link to={`/institute/${slug}/login`} className="block px-3 py-2.5 rounded-lg text-sm text-white font-bold text-center mt-2" style={{ backgroundColor: themeColor }}>Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <section className="py-12 px-4" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
        <div className="max-w-6xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Notices & Announcements</h1>
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto">Stay updated with the latest news and circulars from our institute.</p>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
        </div>
      </section>

      {/* Notices List */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((n, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}25` }}>
                      <Bell className="w-6 h-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-slate-900 mb-1">{n.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                      {n.date && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">{search ? 'No notices found matching your search.' : 'No notices available yet.'}</p>
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
