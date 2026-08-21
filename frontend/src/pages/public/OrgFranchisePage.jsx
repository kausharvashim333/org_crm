import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  GraduationCap, ArrowRight, Building, BookOpen, Users, Award, Monitor,
  Target, Heart, TrendingUp, Check, Briefcase, Sparkles, Star, ShieldCheck,
  CheckCircle2, Zap, Crown, CheckCircle
} from 'lucide-react';

const iconMap = {
  book: BookOpen, briefcase: Briefcase, users: Users, award: Award,
  monitor: Monitor, building: Building, wifi: Award, target: Target,
  heart: Heart, trending: TrendingUp,
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
        <SEO title="Franchise Partnership - Start Your Training Center" description="Join our franchise network and start your own training institute with established brand, curriculum, and ongoing support" />
        <Navbar activePage="franchise" />

        {/* Hero Section */}
        <section className="relative py-20 px-4 text-white overflow-hidden min-h-[55vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          {/* Decorative Pattern & Ambient Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-screen filter blur-[100px] opacity-20" style={{ backgroundColor: themeColor }}></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
            <Reveal>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-slate-900" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(255, 255, 255, 0.5)' }}>
                {franchise.title || 'Partner With Us'}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-lg md:text-xl font-semibold text-slate-800 max-w-3xl mx-auto leading-relaxed" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.9), 0 0 15px rgba(255, 255, 255, 0.7)' }}>
                {franchise.subtitle || 'Join our growing network of partner centers and build a successful education business.'}
              </p>
            </Reveal>
            <Reveal delay={400}>
              <Link
                to="/franchise/apply"
                className="group inline-flex items-center gap-2 px-8 py-4 border rounded-xl font-semibold hover:shadow-2xl transition-all hover:scale-105 animate-bounce backdrop-blur-md mirror-shine"
                style={{ backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40`, color: themeColor }}
              >
                Start Application Form <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Stats Section */}
        {stats.items?.length > 0 && (
          <section className="py-16 px-4 max-w-6xl mx-auto -mt-10 relative z-10">
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-xl">
              <div className="flex flex-wrap justify-center gap-6">
                {stats.items.map((s, i) => {
                  const Icon = iconMap[s.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 100} className="w-full max-w-[160px]">
                      <div className="text-center group flex flex-col items-center p-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 border border-slate-100">
                          <Icon className="w-5 h-5" style={{ color: themeColor }} />
                        </div>
                        <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 bg-gradient-to-r from-slate-900 to-indigo-650 bg-clip-text text-transparent">{s.value}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        {franchise.benefits?.length > 0 && (
          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading title="Why Partner With Us?" subtitle="Discover the advantages of joining our partner network" themeColor={themeColor} /></Reveal>
              <div className="flex flex-wrap justify-center gap-6">
                {franchise.benefits.map((b, i) => {
                  const Icon = iconMap[b.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 100} className="w-full max-w-[280px]">
                      <div className="group bg-white rounded-2xl p-7 border border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: themeColor }} />
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110" style={{ backgroundColor: `${themeColor}12` }}>
                          <Icon className="w-7 h-7" style={{ color: themeColor }} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-slate-800 text-center">{b.title}</h3>
                        <p className="text-sm text-slate-550 leading-relaxed text-center">{b.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Partnership & Franchise Plans Section */}
        {plans.length > 0 && (
          <section className="py-20 px-4 bg-gradient-to-b from-slate-100 via-white to-slate-50 border-y border-slate-200/70" id="partnership-plans">
            <div className="max-w-7xl mx-auto">
              <Reveal>
                <div className="text-center mb-14">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Institutional Franchise Models
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                    Choose Your Partnership Plan
                  </h2>
                  <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Transparent, one-time investment packages with zero monthly royalty, complete course curriculum, and student management CRM.
                  </p>
                </div>
              </Reveal>

              <div className="flex flex-wrap justify-center gap-8 items-stretch">
                {plans.map((plan, idx) => {
                  const isPopular = plan.popular;
                  const discountPercent = plan.originalFee && plan.originalFee > plan.fee
                    ? Math.round(((plan.originalFee - plan.fee) / plan.originalFee) * 100)
                    : null;

                  return (
                    <Reveal key={idx} delay={idx * 120} className="h-full w-full max-w-[380px]">
                      <div
                        className={`h-full flex flex-col justify-between rounded-3xl bg-white transition-all duration-300 relative overflow-hidden border ${
                          isPopular
                            ? 'border-indigo-500 shadow-2xl shadow-indigo-600/15 ring-2 ring-indigo-500/30 scale-105 z-10'
                            : 'border-slate-200/80 shadow-lg hover:shadow-xl hover:-translate-y-1'
                        }`}
                      >
                        {/* Top Accent Strip */}
                        {isPopular && (
                          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white text-center text-xs font-black uppercase tracking-widest py-1.5 flex items-center justify-center gap-1 shadow-xs">
                            <Crown className="w-3.5 h-3.5 text-yellow-300" /> {plan.badge || 'Most Recommended'}
                          </div>
                        )}

                        <div className="p-7 sm:p-8 flex-1 flex flex-col">
                          {/* Plan Badge & Header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className="text-xl font-black text-slate-900">
                              {plan.name}
                            </h3>
                            {!isPopular && plan.badge && (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                {plan.badge}
                              </span>
                            )}
                          </div>

                          {plan.tagline && (
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                              {plan.tagline}
                            </p>
                          )}

                          {/* Pricing Display */}
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                                ₹{plan.fee?.toLocaleString('en-IN')}
                              </span>
                              {plan.originalFee > plan.fee && (
                                <span className="text-sm font-semibold text-slate-400 line-through">
                                  ₹{plan.originalFee?.toLocaleString('en-IN')}
                                </span>
                              )}
                              {discountPercent && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              One-time Setup & Affiliation Fee (+ No Hidden Charges)
                            </p>
                          </div>

                          {/* Commercial Highlights Pill Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100/80">
                              <span className="text-[10px] text-indigo-900/70 font-bold block uppercase">Royalty Term</span>
                              <strong className="text-indigo-950 font-black text-xs">{plan.royaltyPercentage || 'Zero Royalty'}</strong>
                            </div>
                            <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] text-slate-500 font-bold block uppercase">Cert. Cost</span>
                              <strong className="text-slate-900 font-black text-xs">{plan.certificateShare || '₹150 / Student'}</strong>
                            </div>
                          </div>

                          {/* Deliverables Checklist */}
                          <div className="space-y-3 flex-1 mb-8">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                              What's Included:
                            </p>
                            <ul className="space-y-2.5">
                              {(plan.features || []).map((feature, fi) => (
                                <li key={fi} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-snug">
                                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* CTA Button */}
                          <Link
                            to={`/franchise/apply?plan=${encodeURIComponent(plan.name)}`}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] ${
                              isPopular
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {plan.buttonText || 'Apply for this Plan'} <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Assistance Callout */}
              <div className="mt-14 p-6 rounded-2xl bg-white border border-slate-200/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Need Custom Institutional Setup or State Partnership?</h4>
                    <p className="text-xs text-slate-500">Contact our franchise counseling experts directly for tailored agreements and territorial booking.</p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold whitespace-nowrap"
                >
                  Talk to Counselor
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Steps/Roadmap Section */}
        {franchise.steps?.length > 0 && (
          <section className="py-20 px-4 max-w-6xl mx-auto">
            <Reveal><SectionHeading title="How to Get Started" subtitle="Follow these simple steps to become our partner" themeColor={themeColor} /></Reveal>
            <Reveal delay={100}>
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/50 shadow-sm">
                <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                  {franchise.steps.map((s, i) => (
                    <div key={i} className="flex-1 text-center relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-indigo-650/15" style={{ backgroundColor: themeColor }}>{s.step}</div>
                      <h4 className="font-bold text-base mb-2 text-slate-800">{s.title}</h4>
                      <p className="text-sm text-slate-550 leading-relaxed">{s.description}</p>
                      {i < franchise.steps.length - 1 && <div className="hidden md:block absolute top-8 left-[55%] w-[80%] h-0.5" style={{ backgroundColor: `${themeColor}20` }} />}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* Support Checklist Section */}
        <section className="py-20 px-4 bg-white border-t border-slate-250/20">
          <div className="max-w-4xl mx-auto">
            <Reveal><SectionHeading title="What Support You Get" themeColor={themeColor} /></Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Established brand recognition & credentials',
                'Comprehensive academic curriculum & training support',
                'Sleek Marketing materials & promotional pamphlets templates',
                'Standardized student manuals and offline notes database',
                'All-in-one smart CRM platform access for students & batches',
                'Instant online certificate generation & instant verification',
                'Transparent, profitable, and royalty-based revenue system',
                'Dedicated customer support and system onboarding specialists',
              ].map((item, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                      <Check className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <span className="text-sm text-slate-700 font-semibold">{item}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-20 text-white relative overflow-hidden" style={{ backgroundColor: themeColor }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
          <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{hp?.cta?.title || 'Ready to Start?'}</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{hp?.cta?.description || 'Take the first step towards building your education business.'}</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  to="/franchise/apply"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 mirror-shine"
                >
                  Apply Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all backdrop-blur-md text-white mirror-shine">
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
