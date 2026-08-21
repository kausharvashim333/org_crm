import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  GraduationCap, BookOpen, Users, Award, Briefcase, Building,
  Target, Heart, TrendingUp, Monitor, ArrowRight, ShieldCheck, Sparkles
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

export default function OrgAboutPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  const about = hp?.about || {};
  const stats = hp?.stats || {};
  const certifications = hp?.certifications || {};

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <SEO title="About Us - Training Institute" description="Learn about our mission, vision, and commitment to quality education across India" />
        <Navbar />

        {/* Hero Banner Section */}
        <section className="py-20 px-6 relative overflow-hidden text-center bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-250 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>Established Education Networks</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{about.title || 'About Our Mission'}</h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-sm md:text-base text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
                {about.description || 'Dedicated to providing high-quality skill benchmarks, standard curricula, and national vocational certifications.'}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {about.mission && (
              <Reveal delay={100}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-md relative overflow-hidden group hover:border-slate-300 transition-colors h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: themeColor }} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${themeColor}12` }}>
                    <Target className="w-7 h-7" style={{ color: themeColor }} />
                  </div>
                  <h3 className="font-extrabold text-2xl mb-3 text-slate-800">Our Mission</h3>
                  <p className="text-slate-500 leading-relaxed text-sm md:text-base font-light">{about.mission}</p>
                </div>
              </Reveal>
            )}
            {about.vision && (
              <Reveal delay={200}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-md relative overflow-hidden group hover:border-slate-300 transition-colors h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: themeColor }} />
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${themeColor}12` }}>
                    <Heart className="w-7 h-7" style={{ color: themeColor }} />
                  </div>
                  <h3 className="font-extrabold text-2xl mb-3 text-slate-800">Our Vision</h3>
                  <p className="text-slate-500 leading-relaxed text-sm md:text-base font-light">{about.vision}</p>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* Why Choose Us Features */}
        {(about.features?.length > 0) && (
          <section className="py-16 px-6 bg-white border-t border-b border-slate-200/30">
            <div className="max-w-6xl mx-auto">
              <Reveal>
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Why Choose Our Ecosystem</h2>
                  <p className="text-sm text-slate-500 mt-2">National standards and student-centric support resources</p>
                </div>
              </Reveal>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {about.features.map((f, i) => {
                  const Icon = iconMap[f.icon] || BookOpen;
                  return (
                    <Reveal key={i} delay={i * 100} className="h-full">
                      <div className="h-full flex flex-col items-center justify-start text-center group p-6 bg-slate-50/50 hover:bg-slate-50/20 hover:border-slate-300 rounded-2xl transition-all border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${themeColor}12` }}>
                          <Icon className="w-6 h-6" style={{ color: themeColor }} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 mb-2 leading-snug group-hover:text-slate-950">{f.title}</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{f.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Impact Stats Section */}
        {(stats.items?.length > 0) && (
          <section className="py-20 px-6 bg-slate-50 border-t border-b border-slate-200/40">
            <div className="max-w-5xl mx-auto">
              <Reveal>
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{stats.title || 'Our Impact in Numbers'}</h2>
                  <p className="text-sm text-slate-500 mt-2">Connecting training expertise with direct student achievements</p>
                </div>
              </Reveal>
              
              <div className="grid grid-cols-6 gap-1 md:gap-4 lg:gap-6">
                {stats.items.map((s, i) => {
                  const Icon = iconMap[s.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 100} className="h-full">
                      <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-5 hover:border-slate-350 hover:shadow-md transition-all text-center h-full flex flex-col justify-between shadow-sm group">
                        <div className="w-7 h-7 md:w-11 md:h-11 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${themeColor}12` }}>
                          <Icon className="w-3.5 h-3.5 md:w-5.5 md:h-5.5" style={{ color: themeColor }} />
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-sm md:text-xl lg:text-2xl font-black text-slate-800 mb-0.5 leading-none">{s.value}</p>
                          <p className="text-[5.5px] sm:text-[7.5px] md:text-[9px] lg:text-[10px] font-semibold text-slate-450 uppercase tracking-wider">{s.label}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Certifications & Affiliations */}
        {(certifications.items?.length > 0) && (
          <section className="py-20 px-6 max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{certifications.title || 'Certifications & Affiliations'}</h2>
                <p className="text-sm text-slate-500 mt-2">{certifications.subtitle || 'Recognized by national standards agencies and boards'}</p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {certifications.items.map((c, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className="bg-white rounded-3xl p-6 text-center border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow flex flex-col items-center justify-between h-full">
                    {c.logo ? <img src={c.logo} alt={c.name} className="w-16 h-16 object-contain mb-4 bg-white" /> : <Award className="w-12 h-12 mb-4" style={{ color: themeColor }} />}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">{c.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Interactive CTA */}
        <section className="py-16 text-white relative overflow-hidden" style={{ backgroundColor: themeColor }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
          <div className="max-w-4xl mx-auto text-center px-6 relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Want to Explore Our Services?</h2>
            <p className="text-base md:text-lg opacity-90 max-w-xl mx-auto leading-relaxed">
              Browse detailed subject modules or submit an admission inquiry to our advisors.
            </p>
            <div className="flex gap-4 justify-center flex-wrap pt-2">
              <Link to="/services" className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 mirror-shine">
                Explore Services <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <button onClick={() => window.dispatchEvent(new Event('open-partner-enquiry'))} className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 mirror-shine">
                Send Enquiry <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
