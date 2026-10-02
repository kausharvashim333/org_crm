import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getOrgHomepagePublic, getPublicPartners } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  GraduationCap, ArrowRight, Building, BookOpen, Users, Award, Monitor,
  Target, Heart, TrendingUp, Check, Briefcase, Sparkles, Star, ShieldCheck,
  CheckCircle2, Zap, Crown, CheckCircle, Rocket, Users as Handshake,
  Wallet, FileBadge, Headphones, Settings2, BarChart3
} from 'lucide-react';

const iconMap = {
  book: BookOpen, briefcase: Briefcase, users: Users, award: Award,
  monitor: Monitor, building: Building, wifi: Award, target: Target,
  heart: Heart, trending: TrendingUp, sparkles: Sparkles, zap: Zap,
  rocket: Rocket, handshake: Handshake, wallet: Wallet, fileBadge: FileBadge,
  headphones: Headphones, settings: Settings2, chart: BarChart3,
};

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

function SectionHeading({ title, subtitle, themeColor, light = false }) {
  return (
    <div className="text-center mb-12">
      <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${light ? 'text-white' : ''}`} style={light ? {} : { color: themeColor }}>{title}</h2>
      <div className="w-20 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: themeColor }} />
      {subtitle && <p className={`text-base ${light ? 'text-white/80' : 'text-gray-500'} max-w-2xl mx-auto`}>{subtitle}</p>}
    </div>
  );
}

export default function OrgFranchisePage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
    getPublicPartners().then(res => setPartners(res.data?.partners || [])).catch(() => {});
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  );

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India';
  const orgLogo = hp?.settings?.logo;
  const stats = hp?.stats || {};
  const franchise = hp?.franchise || { benefits: [], steps: [] };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <SEO title="Partner with Us - Start Your Training Center" description="Join our partner network and start your own training institute with established brand, curriculum, and ongoing support" />
        <Navbar activePage="franchise" />

        {/* Hero Section - Modern Redesign */}
        <section className="relative text-white overflow-hidden min-h-[60vh] flex items-center justify-center bg-slate-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[120px] opacity-25" style={{ backgroundColor: themeColor }}></div>
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-screen filter blur-[120px] opacity-15"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5 opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 opacity-30"></div>

          <div className="max-w-5xl mx-auto text-center relative z-10 px-4 py-24 space-y-8">
            <Reveal>
              <div className="flex items-center justify-center gap-3 mb-2">
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg" onError={(e) => { const img = e.target; if (!img.dataset.retried && orgLogo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = orgLogo.substring(orgLogo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                )}
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-white/90">
                  <Handshake className="w-4 h-4" style={{ color: themeColor }} /> {orgName} Partner Network
                </span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
                {franchise.title || 'Partner With Us'}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg md:text-xl font-medium text-white/80 max-w-3xl mx-auto leading-relaxed">
                {franchise.subtitle || 'Join our growing network of partner centers and build a successful education business.'}
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <Link
                  to="/franchise/apply"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-2xl transition-all hover:scale-105"
                  style={{ backgroundColor: themeColor, boxShadow: `0 10px 40px ${themeColor}40` }}
                >
                  Start Application <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white/90 bg-white/10 border border-white/20 backdrop-blur-md text-sm">
                  <Check className="w-4 h-4" /> Free organization membership
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stats Section - Floating Glass Card */}
        {stats.items?.length > 0 && (
          <section className="px-4 max-w-6xl mx-auto -mt-12 relative z-20">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
              <div className="flex flex-wrap justify-center gap-8">
                {stats.items.map((s, i) => {
                  const Icon = iconMap[s.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 80} className="flex-1 min-w-[120px] max-w-[180px]">
                      <div className="text-center group flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: `${themeColor}12`, border: `1px solid ${themeColor}20` }}>
                          <Icon className="w-6 h-6" style={{ color: themeColor }} />
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 mb-0.5 tabular-nums">{s.value}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Benefits Section - Modern Cards */}
        {franchise.benefits?.length > 0 && (
          <section className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading title="Why Partner With Us?" subtitle="Discover the advantages of joining our partner network" themeColor={themeColor} /></Reveal>
              <div className="flex flex-wrap justify-center gap-6">
                {franchise.benefits.map((b, i) => {
                  const Icon = iconMap[b.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 80} className="w-full max-w-[300px]">
                      <div className="group bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/30 transition-all duration-300 hover:-translate-y-1 h-full relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundColor: themeColor }} />
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0" style={{ backgroundColor: `${themeColor}12`, border: `1px solid ${themeColor}20` }}>
                            <Icon className="w-7 h-7" style={{ color: themeColor }} />
                          </div>
                          <h3 className="font-bold text-lg text-slate-800">{b.title}</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{b.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Steps/Roadmap Section - Timeline Redesign */}
        {franchise.steps?.length > 0 && (
          <section className="py-24 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading title="How to Get Started" subtitle="Follow these simple steps to become our partner" themeColor={themeColor} /></Reveal>
              <Reveal delay={100}>
                <div className="relative">
                  <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5" style={{ background: `linear-gradient(90deg, ${themeColor}40, ${themeColor}10)` }} />
                  <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                    {franchise.steps.map((s, i) => (
                      <div key={i} className="flex-1 text-center relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-xl transition-transform hover:scale-110" style={{ backgroundColor: themeColor, boxShadow: `0 8px 24px ${themeColor}30` }}>{s.step}</div>
                        <h4 className="font-bold text-base mb-2 text-slate-800">{s.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed max-w-[200px] mx-auto">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* Support Checklist Section - Modern Grid */}
        <section className="py-24 px-4 bg-slate-50 border-t border-slate-200/60">
          <div className="max-w-5xl mx-auto">
            <Reveal><SectionHeading title="What Support You Get" themeColor={themeColor} /></Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: 'building', text: 'Established brand recognition & credentials' },
                { icon: 'book', text: 'Comprehensive academic curriculum & training support' },
                { icon: 'sparkles', text: 'Marketing materials & promotional templates' },
                { icon: 'fileBadge', text: 'Standardized student manuals and notes database' },
                { icon: 'monitor', text: 'All-in-one smart CRM platform for students & batches' },
                { icon: 'award', text: 'Instant online certificate generation & verification' },
                { icon: 'wallet', text: 'Transparent, profitable, royalty-based revenue system' },
                { icon: 'headphones', text: 'Dedicated customer support & onboarding specialists' },
              ].map((item, i) => {
                const Icon = iconMap[item.icon] || Check;
                return (
                  <Reveal key={i} delay={i * 50}>
                    <div className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-200/60 hover:shadow-lg hover:border-slate-300 transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${themeColor}12`, border: `1px solid ${themeColor}20` }}>
                        <Icon className="w-5 h-5" style={{ color: themeColor }} />
                      </div>
                      <span className="text-sm text-slate-700 font-semibold">{item.text}</span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Partner Centers Section */}
        {partners.length > 0 && (
          <section className="py-20 px-4 bg-white border-t border-slate-200/60">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading title="Our Partner Centers" subtitle={`Join ${partners.length}+ established partner centers across India`} themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {partners.slice(0, 10).map((p, i) => (
                  <Reveal key={p._id} delay={i * 50}>
                    <Link
                      to={`/institute/${p.slug}`}
                      className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
                    >
                      {p.logo ? (
                        <img src={p.logo} alt={p.instituteName} className="w-16 h-16 rounded-xl object-cover border border-slate-200" onError={(e) => { const img = e.target; if (!img.dataset.retried && p.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = p.logo.substring(p.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                      ) : (
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.themeColor || themeColor}15`, border: `1px solid ${p.themeColor || themeColor}20` }}>
                          <Building className="w-8 h-8" style={{ color: p.themeColor || themeColor }} />
                        </div>
                      )}
                      <div className="text-center">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{p.instituteName}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.city}, {p.state}</p>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
              {partners.length > 10 && (
                <div className="text-center mt-8">
                  <Link to="/franchises" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:bg-slate-50" style={{ borderColor: themeColor, color: themeColor }}>
                    View All Centers <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Bottom CTA Banner - Premium Redesign */}
        <section className="py-24 text-white relative overflow-hidden" style={{ backgroundColor: themeColor }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white opacity-5 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white opacity-5 blur-[80px]" />
          <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">{hp?.cta?.title || 'Ready to Start?'}</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">{hp?.cta?.description || 'Take the first step towards building your education business.'}</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  to="/franchise/apply"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-white rounded-2xl font-black text-slate-900 shadow-2xl transition-all hover:scale-105"
                  style={{ color: themeColor }}
                >
                  Apply Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-2xl font-bold transition-all backdrop-blur-md text-white">
                  Contact Us
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* Shared Footer component */}
      <Footer homepageData={hp} />
    </div>
  );
}
