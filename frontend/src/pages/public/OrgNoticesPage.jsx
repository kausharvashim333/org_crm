import { useState, useEffect, useRef } from 'react';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Calendar, Bell, Info, FileText, Search, X } from 'lucide-react';

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
    <div ref={ref} className={`${className} transition-all duration-700 ease-out`} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function OrgNoticesPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const isNoticeNew = (notice) => {
    if (notice.badge && notice.badge.toLowerCase() === 'new') return true;
    if (notice.date) {
      const noticeDate = new Date(notice.date);
      const now = new Date();
      const diffTime = Math.abs(now - noticeDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }
    return false;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-650 animate-spin"></div>
        </div>
        <p className="text-indigo-600 font-semibold tracking-wide">Loading Notices...</p>
      </div>
    </div>
  );

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const notices = hp?.notices?.items || [];

  // Group notices by category
  const groupedNotices = notices.reduce((acc, n) => {
    const cat = n.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(n);
    return acc;
  }, {});

  // Sort notices inside each category by date descending
  Object.keys(groupedNotices).forEach(cat => {
    groupedNotices[cat].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  });

  const categories = ['All', ...Object.keys(groupedNotices)];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <SEO title="Notices & Announcements - Training Institute" description="Stay updated with latest notices, announcements, and events" />
        <Navbar />

        {/* Hero Section */}
        <section className="py-20 px-6 relative overflow-hidden text-center bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-250 border border-white/10 backdrop-blur-md animate-pulse">
                <Bell className="w-4 h-4 text-indigo-300 animate-bounce" />
                <span>Stay Updated</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                {hp?.notices?.title || 'Notices & Announcements'}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-sm md:text-base text-slate-350 max-w-2xl mx-auto font-light leading-relaxed">
                Stay informed with the latest updates, event schedules, exam notifications, and general announcements across our entire education network.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Notices Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          {/* Category Tabs */}
          {categories.length > 1 ? (
            <Reveal delay={100}>
              <div className="flex justify-center gap-2 mb-12 overflow-x-auto pb-2 scrollbar-thin">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                      activeTab === cat
                        ? 'text-white shadow-lg shadow-indigo-650/10 scale-105'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    style={activeTab === cat ? { backgroundColor: themeColor } : {}}
                  >
                    {cat}
                    <span 
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        activeTab === cat 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cat === 'All' 
                        ? notices.length 
                        : groupedNotices[cat]?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </Reveal>
          ) : null}

          {/* Search Bar */}
          <Reveal delay={150}>
            <div className="max-w-lg mx-auto mb-10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search notices by title, description or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Notices Grid */}
          <div className="space-y-12">
            {(() => {
              // Filter notices by search query
              const q = searchQuery.trim().toLowerCase();
              const filteredGrouped = {};
              Object.entries(groupedNotices)
                .filter(([category]) => activeTab === 'All' || activeTab === category)
                .forEach(([category, items]) => {
                  const filtered = q
                    ? items.filter(n =>
                        (n.title || '').toLowerCase().includes(q) ||
                        (n.description || '').toLowerCase().includes(q) ||
                        (n.category || '').toLowerCase().includes(q)
                      )
                    : items;
                  if (filtered.length > 0) {
                    filteredGrouped[category] = filtered;
                  }
                });

              const totalFiltered = Object.values(filteredGrouped).reduce((sum, arr) => sum + arr.length, 0);

              if (notices.length === 0 || totalFiltered === 0) {
                return (
                  <Reveal>
                    <div className="text-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 p-8 max-w-md mx-auto">
                      <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="font-extrabold text-xl text-slate-800 mb-2">
                        {q ? 'No Matching Notices' : 'No Notices Found'}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-light">
                        {q
                          ? `No notices match "${searchQuery}". Try a different search term.`
                          : 'There are no current announcements or notices posted at the moment. Please check back later.'
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }

              return Object.entries(filteredGrouped)
                .map(([category, items]) => (
                  <div key={category} className="space-y-6">
                    {/* Category Title Header */}
                    <Reveal>
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                        <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{category}</h3>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-650">
                          {items.length} updates
                        </span>
                      </div>
                    </Reveal>

                    {/* Notice Cards in Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((n, i) => {
                        const isNew = isNoticeNew(n);
                        return (
                          <Reveal key={i} delay={i * 50}>
                            <div className="group relative bg-white/75 backdrop-blur-md hover:bg-white rounded-2xl border border-white/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <span 
                                    className="badge px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider"
                                    style={{ backgroundColor: `${themeColor}12`, color: themeColor }}
                                  >
                                    {n.badge || 'Update'}
                                  </span>
                                  {isNew && (
                                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-sm shadow-red-500/25">
                                      New
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors">
                                  {n.title}
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed font-light">
                                  {n.description}
                                </p>
                                {n.pdfUrl && (
                                  <div className="pt-2">
                                    <a 
                                      href={n.pdfUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                      style={{ color: themeColor }}
                                    >
                                      <FileText className="w-4 h-4" /> View PDF Attachment
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  {n.date ? new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-450">
                                  {category}
                                </span>
                              </div>
                            </div>
                          </Reveal>
                        );
                      })}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </section>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
