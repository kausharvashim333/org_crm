import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Sparkles, Heart, Laptop, Briefcase, TrendingUp, CheckCircle, Award, Search, ArrowRight, BookOpen, Clock, ShieldAlert, GraduationCap
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
    <div ref={ref} className={`${className} transition-all duration-700 ease-out`} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function OrgServicesPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India';

  // Explicit training services listing & topics
  const rawItems = hp?.services?.items || [];
  const servicesList = rawItems.map(item => {
    const getServiceIcon = (title) => {
      const t = title.toLowerCase();
      if (t.includes('paramedical')) return Heart;
      if (t.includes('yoga') || t.includes('health')) return Heart;
      if (t.includes('computer') || t.includes('software') || t.includes('it training')) return Laptop;
      if (t.includes('ug') || t.includes('pg') || t.includes('courses') || t.includes('degree')) return GraduationCap;
      if (t.includes('skills') || t.includes('development') || t.includes('vocational')) return Briefcase;
      if (t.includes('placement') || t.includes('job') || t.includes('recruitment')) return Briefcase;
      if (t.includes('stock') || t.includes('finance') || t.includes('trading')) return TrendingUp;
      return Award;
    };

    return {
      id: item._id || item.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: item.title,
      icon: getServiceIcon(item.title),
      duration: item.duration,
      desc: item.desc,
      topics: item.topics || [],
      careers: item.careers || [],
      tools: item.tools || []
    };
  });

  // Filtering services & highlights based on search query
  const filteredServices = servicesList.filter(service => {
    const matchesTitle = service.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesc = service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopics = service.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCareers = service.careers.some(career => career.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTitle || matchesDesc || matchesTopics || matchesCareers;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <Navbar activePage="services" />

        {/* Hero Section */}
        <section className="py-20 px-6 relative overflow-hidden text-center bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-250 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>Our Core Training Ecosystem</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Professional Services & Curriculums</h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-sm md:text-base text-slate-350 max-w-2xl mx-auto font-light leading-relaxed">
                Explore structured topics, training durations, career pathways, and practical lab environments across our four core education verticals.
              </p>
            </Reveal>

            {/* Dynamic Search Box */}
            <Reveal delay={300}>
              <div className="max-w-md mx-auto relative mt-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics (e.g. Tally, Nursing, Options)..."
                  className="w-full px-5 py-3.5 pl-11 bg-white/10 border border-white/20 rounded-full text-sm text-white focus:outline-none focus:bg-white focus:text-slate-900 focus:border-white transition-all shadow-lg"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4 pointer-events-none" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Services Listing Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          {filteredServices.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl space-y-4">
              <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-bold text-lg">No matching topics or training verticals found.</p>
              <button onClick={() => setSearchQuery('')} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: themeColor }}>Clear Search</button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <Reveal key={service.id} delay={idx * 100}>
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden group hover:border-slate-300 transition-colors">
                      {/* Header block */}
                      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                            <Icon className="w-7 h-7" style={{ color: themeColor }} />
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-800">{service.title}</h2>
                            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{service.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-100 rounded-2xl flex-shrink-0">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{service.duration}</span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Topics covered */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" /> Core Topics Covered
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {service.topics.map((topic, tIdx) => {
                              const isHighlighted = searchQuery.trim() !== '' && topic.toLowerCase().includes(searchQuery.toLowerCase());
                              return (
                                <div 
                                  key={tIdx} 
                                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-colors ${
                                    isHighlighted ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-650 hover:bg-slate-50'
                                  }`}
                                >
                                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-indigo-600' : 'text-emerald-500'}`} />
                                  <span>{topic}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Column 2: Career Paths & tools */}
                        <div className="space-y-6 bg-slate-50/40 p-6 rounded-2xl border border-slate-100">
                          {/* Careers */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-450">Career Pathways</h4>
                            <div className="flex flex-wrap gap-2">
                              {service.careers.map((career, cIdx) => (
                                <span key={cIdx} className="px-2.5 py-1 bg-white border border-slate-150 rounded-lg text-xs font-bold text-slate-600">{career}</span>
                              ))}
                            </div>
                          </div>

                          {/* Tools */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-450">Hands-on Tools / Systems</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {service.tools.map((tool, toolIdx) => (
                                <span key={toolIdx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-500">{tool}</span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('open-enquiry', { detail: { service: service.title } }));
                              }}
                              className="w-full py-3 bg-slate-900/10 border border-slate-900/20 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:bg-slate-900/20 shadow-sm mirror-shine cursor-pointer text-slate-800"
                            >
                              Inquire Admissions <ArrowRight className="w-4 h-4" />
                            </button>
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

        {/* Quality Certification Standard */}
        <section className="py-16 px-6 bg-white border-t border-slate-200/40 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <Award className="w-14 h-14 mx-auto" style={{ color: themeColor }} />
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">ISO 9001:2015 Training Standard</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Every course module contains systematic, industry-reviewed learning aids, lab practical handbooks, and standard online assessment configurations.
            </p>
            <div className="pt-4">
              <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 border rounded-xl font-bold transition-transform hover:scale-102 backdrop-blur-md shadow-md mirror-shine" style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40`, color: themeColor }}>
                Consult Advisor Desk <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
