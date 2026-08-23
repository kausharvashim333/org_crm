import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicStaff } from '../../api';
import {
  GraduationCap, Users, Mail, Phone, BookOpen, Menu, X,
  Sparkles, Award, Briefcase
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

export default function PartnerFacultyPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
      getPublicStaff({ partnerId: res.data.partner._id }).then(r => setStaff(r.data.staff)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderTopColor: '#2563eb' }}></div>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Loading Faculty...</p>
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
  const activeStaff = staff.filter(s => s.status === 'active');

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
            {navLinks.map(l => <Link key={l.label} to={l.href} className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium hidden md:block ${l.label === 'Faculty' ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`} style={l.label === 'Faculty' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(l => <Link key={l.label} to={l.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${l.label === 'Faculty' ? 'text-white' : 'text-slate-700 hover:bg-slate-50'}`} style={l.label === 'Faculty' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <section className="py-12 px-4" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
        <div className="max-w-6xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Our Faculty</h1>
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto">Learn from experienced educators committed to your success.</p>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {activeStaff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStaff.map((s, i) => (
                <Reveal key={s._id} delay={i * 80}>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-xl hover:border-slate-300 transition-all group hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-lg flex-shrink-0 bg-slate-100">
                        {s.photo ? <img src={fixUrl(s.photo)} alt={s.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Users className="w-8 h-8 text-slate-300" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-base truncate">{s.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{s.qualification || s.designation || 'Faculty Member'}</p>
                        {s.experience && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {s.experience} years experience</p>}
                      </div>
                    </div>
                    {s.subjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {s.subjects.map((sub, j) => (
                          <span key={j} className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${themeColor}0f`, color: themeColor }}>{sub}</span>
                        ))}
                      </div>
                    )}
                    {s.bio && <p className="text-xs text-slate-500 leading-relaxed mb-3">{s.bio}</p>}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {s.email && <a href={`mailto:${s.email}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: `${themeColor}15` }}><Mail className="w-4 h-4" style={{ color: themeColor }} /></a>}
                      {s.phone && <a href={`tel:${s.phone}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: `${themeColor}15` }}><Phone className="w-4 h-4" style={{ color: themeColor }} /></a>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Faculty details will be updated soon.</p>
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
