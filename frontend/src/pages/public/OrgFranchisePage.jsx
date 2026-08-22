import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
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

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  );

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India';
  const stats = hp?.stats || {};
  const franchise = hp?.franchise || { benefits: [], steps: [], plans: [] };
  const plans = (franchise.plans || []).filter(p => p.isActive !== false);

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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-white/90">
                <Handshake className="w-4 h-4" style={{ color: themeColor }} /> {orgName} Partner Network
              </span>
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
                <a
                  href="#partnership-plans"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                >
                  View Plans <Sparkles className="w-4 h-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Stats Section - Floating Glass Card */}
        {stats.items?.length > 0 && (
          <section className="px-4 max-w-6xl mx-auto -mt-12 relative z-20">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-300/30">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {franchise.benefits.map((b, i) => {
                  const Icon = iconMap[b.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 80}>
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

        {/* Dynamic Partnership Plans Section - Premium Redesign */}
        {plans.length > 0 && (
          <section className="py-24 px-4 bg-slate-900 relative overflow-hidden" id="partnership-plans">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)] opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ backgroundColor: themeColor, filter: 'blur(120px)' }}></div>
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <div className="text-center mb-16">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-black uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: themeColor }} /> Institutional Partner Models
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Choose Your Partnership Plan
                  </h2>
                  <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Transparent, one-time investment packages with zero monthly royalty, complete course curriculum, and student management CRM.
                  </p>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan, idx) => {
                  const isPopular = plan.popular;
                  const discountPercent = plan.originalFee && plan.originalFee > plan.fee
                    ? Math.round(((plan.originalFee - plan.fee) / plan.originalFee) * 100)
                    : null;

                  return (
                    <Reveal key={idx} delay={idx * 100} className="h-full">
                      <div
                        className={`h-full flex flex-col rounded-3xl transition-all duration-300 relative overflow-hidden ${
                          isPopular
                            ? 'bg-white text-slate-900 shadow-2xl ring-2 ring-white/50 scale-[1.03] z-10'
                            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {isPopular && (
                          <div className="text-center text-xs font-black uppercase tracking-widest py-2 flex items-center justify-center gap-1.5 text-white" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}dd)` }}>
                            <Crown className="w-3.5 h-3.5 text-yellow-300" /> {plan.badge || 'Most Recommended'}
                          </div>
                        )}

                        <div className="p-7 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className={`text-xl font-black ${isPopular ? 'text-slate-900' : 'text-white'}`}>
                              {plan.name}
                            </h3>
                            {!isPopular && plan.badge && (
                              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-black uppercase tracking-wider">
                                {plan.badge}
                              </span>
                            )}
                          </div>

                          {plan.tagline && (
                            <p className={`text-xs font-medium leading-relaxed mb-5 ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>
                              {plan.tagline}
                            </p>
                          )}

                          <div className={`p-5 rounded-2xl mb-5 space-y-2 ${isPopular ? 'bg-slate-50 border border-slate-100' : 'bg-white/5 border border-white/10'}`}>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-3xl sm:text-4xl font-black ${isPopular ? 'text-slate-900' : 'text-white'}`}>
                                ₹{plan.fee?.toLocaleString('en-IN')}
                              </span>
                              {plan.originalFee > plan.fee && (
                                <span className={`text-sm font-semibold line-through ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                                  ₹{plan.originalFee?.toLocaleString('en-IN')}
                                </span>
                              )}
                              {discountPercent && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] font-semibold ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>
                              One-time Setup & Affiliation Fee
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                            <div className={`p-3 rounded-xl border ${isPopular ? 'bg-indigo-50/70 border-indigo-100/80' : 'bg-white/5 border-white/10'}`}>
                              <span className={`text-[10px] font-bold block uppercase ${isPopular ? 'text-indigo-900/70' : 'text-slate-400'}`}>Royalty</span>
                              <strong className={`font-black text-xs ${isPopular ? 'text-indigo-950' : 'text-white'}`}>{plan.royaltyPercentage || 'Zero Royalty'}</strong>
                            </div>
                            <div className={`p-3 rounded-xl border ${isPopular ? 'bg-slate-100/70 border-slate-200/80' : 'bg-white/5 border-white/10'}`}>
                              <span className={`text-[10px] font-bold block uppercase ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>Cert. Cost</span>
                              <strong className={`font-black text-xs ${isPopular ? 'text-slate-900' : 'text-white'}`}>{plan.certificateShare || '₹150 / Student'}</strong>
                            </div>
                          </div>

                          <div className="space-y-2.5 flex-1 mb-6">
                            <p className={`text-xs font-bold uppercase tracking-wider border-b pb-2 ${isPopular ? 'text-slate-900 border-slate-100' : 'text-white/80 border-white/10'}`}>
                              What's Included:
                            </p>
                            <ul className="space-y-2">
                              {(plan.features || []).map((feature, fi) => (
                                <li key={fi} className={`flex items-start gap-2.5 text-xs font-medium leading-snug ${isPopular ? 'text-slate-700' : 'text-slate-300'}`}>
                                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Link
                            to={plan.buttonLink ? `${plan.buttonLink}?plan=${encodeURIComponent(plan.name)}` : `/franchise/apply?plan=${encodeURIComponent(plan.name)}`}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
                              isPopular
                                ? 'text-white shadow-lg'
                                : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                            }`}
                            style={isPopular ? { backgroundColor: themeColor, boxShadow: `0 8px 30px ${themeColor}40` } : {}}
                          >
                            {plan.buttonText || 'Apply for this Plan'} <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              <Reveal delay={200}>
                <div className="mt-12 p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0" style={{ color: themeColor }}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Need Custom Institutional Setup or State Partnership?</h4>
                      <p className="text-xs text-slate-400">Contact our partner counseling experts directly for tailored agreements and territorial booking.</p>
                    </div>
                  </div>
                  <Link
                    to="/contact"
                    className="px-6 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold whitespace-nowrap transition-all"
                  >
                    Talk to Counselor
                  </Link>
                </div>
              </Reveal>
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
