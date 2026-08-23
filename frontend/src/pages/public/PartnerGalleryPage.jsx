import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage } from '../../api';
import {
  GraduationCap, X, Menu, Image as ImageIcon, ChevronLeft, ChevronRight
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

export default function PartnerGalleryPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

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
        <p className="text-slate-600 font-semibold text-sm">Loading Gallery...</p>
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
  const photos = homepage.gallery?.photos || [];

  const navLinks = [
    { label: 'Home', href: `/institute/${slug}` },
    { label: 'Courses', href: `/institute/${slug}/courses` },
    { label: 'About', href: `/institute/${slug}/about` },
    { label: 'Faculty', href: `/institute/${slug}/faculty` },
    { label: 'Gallery', href: `/institute/${slug}/gallery` },
    { label: 'Contact', href: `/institute/${slug}/contact` },
  ];

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex(prev => (prev - 1 + photos.length) % photos.length);
  const nextPhoto = () => setLightboxIndex(prev => (prev + 1) % photos.length);

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
            {navLinks.map(l => <Link key={l.label} to={l.href} className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium hidden md:block ${l.label === 'Gallery' ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`} style={l.label === 'Gallery' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(l => <Link key={l.label} to={l.href} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${l.label === 'Gallery' ? 'text-white' : 'text-slate-700 hover:bg-slate-50'}`} style={l.label === 'Gallery' ? { backgroundColor: themeColor } : {}}>{l.label}</Link>)}
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <section className="py-12 px-4" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
        <div className="max-w-6xl mx-auto text-center text-white">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Gallery</h1>
          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto">Glimpses of our campus, events, and student activities.</p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((p, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square" onClick={() => openLightbox(i)}>
                    <img src={fixUrl(p.url)} alt={p.caption || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      {p.caption && <p className="text-white text-xs font-medium">{p.caption}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No photos available yet.</p>
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

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all z-10" onClick={closeLightbox}><X className="w-6 h-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all z-10" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}><ChevronLeft className="w-6 h-6" /></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all z-10" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}><ChevronRight className="w-6 h-6" /></button>
          <img src={fixUrl(photos[lightboxIndex].url)} alt={photos[lightboxIndex].caption || ''} className="max-w-full max-h-[85vh] rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          {photos[lightboxIndex].caption && <p className="absolute bottom-6 left-0 right-0 text-center text-white text-sm font-medium">{photos[lightboxIndex].caption}</p>}
          <p className="absolute top-4 left-4 text-white/60 text-xs font-medium">{lightboxIndex + 1} / {photos.length}</p>
        </div>
      )}
    </div>
  );
}
