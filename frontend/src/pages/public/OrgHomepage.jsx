import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import {
  GraduationCap, BookOpen, Users, Award, Briefcase, ArrowRight, Building,
  Phone, Mail, MapPin, Star, Target, Heart, TrendingUp, Monitor, Check,
  Calendar, ChevronRight, Facebook, Instagram, Youtube, MessageCircle,
  Sparkles, Zap, Shield, Rocket, FileText, Bell, Search, ExternalLink,
  Clock, ShieldCheck, CheckCircle2, Layers, Compass, HelpCircle, UserCheck,
  CheckCircle, ArrowUpRight, ChevronDown, Image as ImageIcon
} from 'lucide-react';
import Counter from '../../components/ui/Counter';
import TiltCard from '../../components/ui/TiltCard';
import TypingText from '../../components/ui/TypingText';
import TestimonialSlider from '../../components/ui/TestimonialSlider';
import Lightbox from '../../components/ui/Lightbox';
import { SkeletonCard } from '../../components/ui/Skeleton';

const iconMap = {
  book: BookOpen, briefcase: Briefcase, users: Users, award: Award,
  monitor: Monitor, building: Building, wifi: Award, target: Target,
  heart: Heart, trending: TrendingUp, shield: Shield, rocket: Rocket,
  compass: Compass, check: CheckCircle2, sparkles: Sparkles, zap: Zap,
};

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
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({ badge = 'Explore', title, subtitle, themeColor }) {
  return (
    <div className="text-center mb-12 sm:mb-14 relative max-w-3xl mx-auto px-4">
      {badge && (
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 shadow-sm border transition-all hover:scale-105"
          style={{
            backgroundColor: `${themeColor}0f`,
            borderColor: `${themeColor}30`,
            color: themeColor
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight text-shimmer">
        {title}
      </h2>
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <div className="h-1 w-1.5 rounded-full" style={{ backgroundColor: `${themeColor}40` }} />
        <div className="h-1 w-8 rounded-full line-draw" style={{ backgroundColor: themeColor }} />
        <div className="h-1 w-1.5 rounded-full" style={{ backgroundColor: `${themeColor}40` }} />
      </div>
      {subtitle && (
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function WaveDivider({ color = '#ffffff', flip = false }) {
  return (
    <div className="wave-divider" style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0,30 C200,60 400,0 600,20 C800,40 1000,10 1200,30 L1200,60 L0,60 Z" fill={color} />
      </svg>
    </div>
  );
}

function TrustMarquee({ themeColor }) {
  const partners = ['NSDC', 'Skill India', 'ISO 9001', 'Govt of India', 'Make in India', 'Digital India', 'PMKVY', 'NIELIT'];
  return (
    <section className="py-8 liquid-surface border-b border-white/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Trusted &amp; Accredited By</p>
      </div>
      <div className="relative">
        <div className="flex marquee-track gap-12 items-center whitespace-nowrap">
          {[...partners, ...partners].map((p, i) => (
            <span key={i} className="text-lg sm:text-xl font-black text-slate-400 hover:text-slate-600 transition-colors cursor-default tracking-tight shrink-0">
              {p}
            </span>
          ))}
        </div>
        {/* Edge fades */}
        <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white/60 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white/60 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

function WhyChooseUs({ themeColor }) {
  const features = [
    { icon: ShieldCheck, title: 'Govt Certified Courses', desc: 'Industry-recognized certifications aligned with national skill standards.' },
    { icon: Briefcase, title: '100% Placement Support', desc: 'Dedicated placement cell with tie-ups across 200+ companies.' },
    { icon: Users, title: 'Expert Faculty', desc: 'Learn from certified trainers with 10+ years of industry experience.' },
    { icon: Monitor, title: 'Modern Lab Facilities', desc: 'State-of-the-art computer labs and paramedical training equipment.' },
  ];
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30 border-b border-slate-200/60 relative overflow-hidden">
      <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-400/8 rounded-full liquid-orb" />
      <div className="max-w-7xl mx-auto relative z-10">
        <Reveal>
          <SectionHeading
            badge="Why Choose Us"
            title="Excellence in Vocational Education"
            subtitle="We deliver quality education that transforms careers and builds skilled professionals."
            themeColor={themeColor}
          />
        </Reveal>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block why-line" />
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={i} delay={i * 100} className="relative z-10">
                <div className="group flex flex-col items-center text-center p-6 liquid-glass liquid-refraction rounded-2xl transition-all card-lift liquid-shimmer relative overflow-hidden">
                  {/* Number badge */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm mb-4 number-pulse shrink-0" style={{ backgroundColor: themeColor }}>
                    {i + 1}
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ color: themeColor, backgroundColor: `${themeColor}12` }}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQAccordion({ themeColor }) {
  const [openIdx, setOpenIdx] = useState(null);
  const faqs = [
    { q: 'What courses do you offer?', a: 'We offer diploma and certificate courses in Computer Applications, Paramedical Sciences, Accounting & Tally, Graphic Design, and Stock Market training.' },
    { q: 'Are the courses government certified?', a: 'Yes, all our courses are aligned with NSDC and Skill India standards. Certificates are verifiable online through our portal.' },
    { q: 'Do you provide placement assistance?', a: 'Absolutely! We have a dedicated placement cell with tie-ups across 200+ companies for internships and full-time placements.' },
    { q: 'How can I apply for admission?', a: 'You can apply online through our admission portal or visit any of our affiliated training centers for offline registration.' },
    { q: 'Can I verify my certificate online?', a: 'Yes, use our online certificate verification tool on the homepage. Enter your certificate code to instantly verify authenticity.' },
    { q: 'Do you offer franchise opportunities?', a: 'Yes, we partner with training institutes across India. Visit our franchise page or contact our coordinator for details.' },
  ];
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white border-b border-slate-200/60 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="max-w-3xl mx-auto relative z-10">
        <Reveal>
          <SectionHeading
            badge="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about our courses, certifications, and admissions."
            themeColor={themeColor}
          />
        </Reveal>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 50}>
              <div className={`rounded-2xl liquid-glass liquid-refraction transition-all overflow-hidden ${openIdx === i ? 'shadow-md' : 'hover:scale-[1.01]'}`}>
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left group"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors" style={{ backgroundColor: openIdx === i ? themeColor : `${themeColor}12`, color: openIdx === i ? '#fff' : themeColor }}>
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-300 ${openIdx === i ? 'rotate-180' : ''}`} style={{ color: themeColor }} />
                </button>
                <div className={`faq-answer ${openIdx === i ? 'open' : ''}`}>
                  <p className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed pl-12">{faq.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SideDotNav({ sections, themeColor }) {
  const [activeSection, setActiveSection] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
      const scrollPos = window.scrollY + window.innerHeight / 2;
      const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean);
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        if (sectionEls[i].offsetTop <= scrollPos) {
          setActiveSection(i);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3 items-end">
      {sections.map((s, i) => (
        <div key={i} className="flex items-center gap-2 group cursor-pointer" onClick={() => {
          const el = document.getElementById(s.id);
          if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
        }}>
          <span className={`text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === i ? 'text-slate-900' : 'text-slate-400'}`}>
            {s.label}
          </span>
          <div className={`side-dot ${activeSection === i ? 'active' : ''}`} style={activeSection === i ? { background: themeColor } : {}} />
        </div>
      ))}
    </div>
  );
}

function GallerySlider({ photos }) {
  const [current, setCurrent] = useState(0);
  const photosCount = photos.length;

  useEffect(() => {
    if (photosCount <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % photosCount);
    }, 3000);
    return () => clearInterval(timer);
  }, [photosCount]);

  if (photosCount === 0) return null;

  const fixUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `/api${url}`;
    return url;
  };

  return (
    <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
      {photos.map((photo, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={fixUrl(photo.url)}
            alt={photo.caption || `Gallery ${i + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {photo.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm font-semibold">{photo.caption}</p>
            </div>
          )}
        </div>
      ))}
      {photosCount > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgHomepage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCourseTab, setActiveCourseTab] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [noticeCategory, setNoticeCategory] = useState('All');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [heroSearch, setHeroSearch] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const noticeScrollRef = useRef(null);

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => { setHp(res.data.homepage); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scrollToHash = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 75;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  useEffect(() => {
    if (!loading) scrollToHash();
  }, [loading, location, scrollToHash]);

  // Slideshow timer
  useEffect(() => {
    const slides = hp?.hero?.sliderImages || [];
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [hp?.hero?.sliderImages]);

  // Auto-scroll notice board ticker
  useEffect(() => {
    const container = noticeScrollRef.current;
    if (!container) return;
    if (noticeSearch.trim() || noticeCategory !== 'All') return; // Pause ticker when user is searching
    if (container.scrollHeight <= container.clientHeight) return;

    let animationFrameId;
    let scrollSpeed = 0.35;

    const scroll = () => {
      if (!container) return;
      container.scrollTop += scrollSpeed;
      const halfScroll = container.scrollHeight / 2;
      if (container.scrollTop >= halfScroll) {
        container.scrollTop = 0;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    const handleMouseEnter = () => { scrollSpeed = 0; };
    const handleMouseLeave = () => { scrollSpeed = 0.35; };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [hp?.notices?.items, noticeCategory, noticeSearch]);

  const isNoticeNew = (notice) => {
    if (notice.badge && notice.badge.toLowerCase() === 'new') return true;
    if (notice.date) {
      const noticeDate = new Date(notice.date);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now - noticeDate) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return false;
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/courses?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (verifyCode.trim()) {
      navigate(`/verify-certificate?code=${encodeURIComponent(verifyCode.trim())}`);
    } else {
      navigate('/verify-certificate');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="skeleton h-8 w-32 rounded-full" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-5/6 rounded-lg" />
            <div className="flex gap-3 pt-2">
              <div className="skeleton h-12 w-40 rounded-xl" />
              <div className="skeleton h-12 w-40 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="skeleton h-[400px] w-full rounded-3xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );

  if (!hp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6 text-center">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-lg">
          <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Academic Portal Setup</h2>
          <p className="text-slate-500 text-sm mb-6">Connecting to database...</p>
          <Link to="/admin/login" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm">
            Super Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const orgName = hp?.settings?.orgName || 'Skill India Training Network';
  const hiddenSections = ['courses', 'franchise', 'notices', 'stats'];
  const layoutOrder = (hp?.layoutOrder || [
    'hero', 'trustMarquee', 'categories', 'verticals', 'whyChooseUs', 'services', 'verifyWidget', 'about', 'certifications', 'gallery', 'testimonials', 'faq', 'cta', 'contact'
  ]).filter(s => !hiddenSections.includes(s));

  const sideNavSections = [
    { id: 'hero', label: 'Home' },
    { id: 'verticals', label: 'Streams' },
    { id: 'whyChooseUs', label: 'Why Us' },
    { id: 'services', label: 'Services' },
    { id: 'verifyWidget', label: 'Verify' },
    { id: 'about', label: 'About' },
    { id: 'certifications', label: 'Awards' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'faq', label: 'FAQ' },
    { id: 'cta', label: 'Apply' },
    { id: 'contact', label: 'Contact' },
  ].filter(s => !hiddenSections.includes(s.id) || s.id === 'hero');

  // Notice categories extraction
  const rawNotices = hp?.notices?.items || [];
  const noticeCategories = ['All', ...Array.from(new Set(rawNotices.map(n => n.category || 'General')))];
  const filteredNotices = rawNotices.filter(n => {
    const matchesCat = noticeCategory === 'All' || (n.category || 'General') === noticeCategory;
    const matchesSearch = !noticeSearch.trim() || 
      n.title?.toLowerCase().includes(noticeSearch.toLowerCase()) || 
      n.description?.toLowerCase().includes(noticeSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderSection = (section) => {
    switch (section) {
      case 'trustMarquee':
        return <TrustMarquee key="trustMarquee" themeColor={themeColor} />;
      case 'whyChooseUs':
        return <WhyChooseUs key="whyChooseUs" themeColor={themeColor} />;
      case 'faq':
        return <FAQAccordion key="faq" themeColor={themeColor} />;
      case 'hero':
        if (!hp.isPublished) return null;
        const heroSlides = hp.hero?.slides?.length > 0 ? hp.hero.slides : [
          { image: hp.hero?.bgImage, title: hp.hero?.heading || 'Building Skilled Careers', subtitle: hp.hero?.description || 'Government-aligned vocational curriculum' },
        ].filter(s => s.image);
        return (
          <section key="hero" id="hero" className="relative overflow-hidden pt-0 pb-16 lg:pt-0 lg:pb-12 bg-gradient-to-b from-indigo-50 via-blue-50/40 to-white text-slate-900 border-b border-slate-200/60 min-h-[86vh] flex items-center">
            {/* Liquid glass animated orbs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full liquid-orb pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-300/20 rounded-full liquid-orb pointer-events-none" style={{ animationDelay: '7s' }} />
            <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-purple-300/15 rounded-full liquid-orb pointer-events-none" style={{ animationDelay: '14s' }} />
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                
                {/* Left Hero Column (7 Cols on desktop) */}
                <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
                  
                  {/* Top Notification Badge with typing effect */}
                  <Reveal>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-indigo-700 font-bold liquid-float" style={{ fontSize: typeof hp.hero?.subheadingFontSize === 'number' ? `${hp.hero.subheadingFontSize}px` : undefined }}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{hp.hero?.subheading ? (
                        <TypingText texts={[
                          hp.hero?.subheading || 'Admissions Open 2026-27',
                          'Government-aligned Vocational Training',
                          'Certified Diploma Courses Available',
                          'Join 500+ Skilled Graduates'
                        ]} speed={50} />
                      ) : 'Admissions Open 2026-27 • Certified Vocational Training'}</span>
                    </div>
                  </Reveal>

                  {/* Main Hero Headline with word-by-word reveal */}
                  <Reveal delay={100}>
                    <div className="space-y-1">
                      <h1 className="font-black tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl perspective-[800px]" style={{ color: hp.hero?.headingColor || '#0f172a', fontSize: ['number'].includes(typeof hp.hero?.headingFontSize) ? `${hp.hero.headingFontSize}px` : undefined, lineHeight: hp.hero?.headingLineHeight || 1.65 }}>
                        {(() => {
                          const title = hp.hero?.heading || 'Building Skilled Careers in IT, Paramedical & Finance';
                          const words = title.split(' ');
                          if (words.length > 2) {
                            const lastWords = words.splice(-2).join(' ');
                            return (
                              <>
                                {words.map((w, i) => (
                                  <span key={i} className="word-reveal" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>{w} </span>
                                ))}
                                <span className="word-reveal" style={{ animationDelay: `${0.1 + words.length * 0.08}s`, color: themeColor }}>
                                  {' '}{lastWords}
                                </span>
                              </>
                            );
                          }
                          return title;
                        })()}
                      </h1>
                      {hp?.settings?.shortName && (
                        <p className="font-bold text-slate-400 tracking-wide text-lg sm:text-xl lg:text-2xl word-reveal" style={{ fontSize: typeof hp.hero?.headingFontSize === 'number' ? `${Math.round(hp.hero.headingFontSize * 0.4)}px` : undefined, animationDelay: '0.8s' }}>
                          {hp.settings.shortName}
                        </p>
                      )}
                    </div>
                  </Reveal>

                  {/* Hero Description */}
                  <Reveal delay={300}>
                    <p className="text-slate-600 max-w-2xl leading-relaxed font-normal text-sm sm:text-base" style={{ fontSize: typeof hp.hero?.descriptionFontSize === 'number' ? `${hp.hero.descriptionFontSize}px` : undefined }}>
                      {hp.hero?.description || 'Government-aligned vocational curriculum, hands-on practical lab modules, standardized student certificates, and dedicated career guidance.'}
                    </p>
                  </Reveal>

                  {/* Auto-sliding Trending Courses with glow */}
                  <Reveal delay={350} className="w-full max-w-md">
                    <div className="flex items-center gap-1.5 text-[11px] overflow-hidden whitespace-nowrap">
                      <span className="font-semibold text-slate-400 flex items-center gap-0.5 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" style={{ color: themeColor }} />
                        Trending
                      </span>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5 animate-marquee-chips">
                          {[...['ADCA Pro', 'Tally Prime GST', 'Web Dev', 'Python AI', 'DMLT'], ...['ADCA Pro', 'Tally Prime GST', 'Web Dev', 'Python AI', 'DMLT']].map((term, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setHeroSearch(term);
                                navigate(`/courses?search=${encodeURIComponent(term)}`);
                              }}
                              className="px-2.5 py-0.5 rounded-full bg-white/60 hover:bg-white border border-slate-200/60 hover:border-indigo-300 text-slate-500 hover:text-indigo-700 font-medium transition-all shrink-0 hover:shadow-sm"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Reveal>

                  {/* Action CTA Buttons with shimmer + arrow bounce */}
                  <Reveal delay={400}>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start w-full pt-1">
                      <Link
                        to="/courses"
                        className="btn-shimmer inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 group"
                        style={{ backgroundColor: themeColor }}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Explore Courses</span>
                        <ArrowRight className="w-4 h-4 arrow-bounce" />
                      </Link>

                      <Link
                        to="/franchise"
                        className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 shadow-xs transition-all hover:scale-105 hover:border-indigo-300"
                      >
                        <Building className="w-4 h-4 text-indigo-600" />
                        <span>Become a Partner</span>
                      </Link>

                      <Link
                        to="/admission"
                        className="btn-shimmer inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 group"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Apply for Admission</span>
                        <ArrowRight className="w-4 h-4 arrow-bounce" />
                      </Link>
                    </div>
                  </Reveal>

                  {/* Real Stats Strip from DB with animated counters + floating badges */}
                  {(hp.stats?.items || []).length > 0 && (
                    <Reveal delay={450}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80 w-full">
                        {(hp.stats?.items || []).slice(0, 4).map((s, i) => {
                          const Icon = iconMap[s.icon] || Building;
                          return (
                            <div className="flex flex-col items-center text-center p-2.5 rounded-xl liquid-glass liquid-glow transition-all" style={{ animationDelay: `${i * 0.5}s` }}>
                              <Icon className="w-4 h-4 mb-1" style={{ color: themeColor }} />
                              <p className="text-base font-black text-slate-900 leading-tight">
                                {(() => {
                                  const num = parseInt(String(s.value).replace(/[^0-9]/g, ''));
                                  const suffix = String(s.value).replace(/[0-9,]/g, '');
                                  return isNaN(num) ? s.value : <Counter end={num} suffix={suffix} />;
                                })()}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold">{s.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </Reveal>
                  )}

                </div>

                {/* Right Hero Column: Visual Showcase (5 Cols on desktop) */}
                <div className="lg:col-span-5 w-full">
                  <Reveal delay={200}>
                    <div className="relative">
                      {/* Main visual card */}
                      <div className="bg-white/60 border border-white/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-indigo-300/30 relative overflow-hidden liquid-glass liquid-refraction">
                        {/* Shimmer top bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" style={{ backgroundSize: '200% 100%', animation: 'border-glow 3s linear infinite' }} />
                        
                        {/* Widget Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">Live notifications & circulars</h3>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            Live Updates
                          </span>
                        </div>

                      {/* Category Filter Pills & Search */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                          {noticeCategories.slice(0, 5).map((cat, idx) => (
                            <button
                              key={idx}
                              onClick={() => setNoticeCategory(cat)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                noticeCategory === cat
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={noticeSearch}
                            onChange={(e) => setNoticeSearch(e.target.value)}
                            placeholder="Filter notices by keyword..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                          />
                          {noticeSearch && (
                            <button onClick={() => setNoticeSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notice Scrollable Body */}
                      <div
                        ref={noticeScrollRef}
                        className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {filteredNotices.length > 0 ? (
                          (noticeSearch.trim() || noticeCategory !== 'All' ? filteredNotices : [...filteredNotices, ...filteredNotices]).map((notice, i) => {
                            const isNew = isNoticeNew(notice);
                            return (
                              <div
                                key={i}
                                onClick={() => notice.pdfUrl && window.open(notice.pdfUrl, '_blank')}
                                className={`p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-200/70 hover:border-indigo-200 transition-all text-left ${
                                  notice.pdfUrl ? 'cursor-pointer group' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {notice.title}
                                  </h4>
                                  {isNew && (
                                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                                  {notice.description}
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/50">
                                  <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold uppercase tracking-wider border border-slate-200/60">
                                    {notice.category || 'General'}
                                  </span>
                                  {notice.pdfUrl ? (
                                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:underline">
                                      <FileText className="w-3 h-3" /> PDF Circular
                                    </span>
                                  ) : (
                                    notice.date && (
                                      <span>{new Date(notice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            No notices found.
                          </div>
                        )}
                      </div>

                      {/* Footer Link */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Headquarters Notice Board</span>
                        <Link to="/notices" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                          View All Notices <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                    </div>
                  </Reveal>
                </div>

              </div>
            </div>

            {/* Scroll-down indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-1 scroll-indicator">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scroll</span>
              <div className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center p-1">
                <div className="w-1 h-2 rounded-full bg-slate-400" />
              </div>
            </div>
          </section>
        );

      case 'categories':
        if (hp.categories?.show === false) return null;
        const cmsCats = hp.categories?.items;
        const defaultCats = [
          { label: 'Computer & Software', icon: 'monitor', link: '/courses', color: '#2563eb' },
          { label: 'Paramedical & Healthcare', icon: 'heart', link: '/courses', color: '#dc2626' },
          { label: 'Accounting & Tally GST', icon: 'trending', link: '/courses', color: '#059669' },
          { label: 'Graphic Design & Media', icon: 'sparkles', link: '/courses', color: '#7c3aed' },
          { label: 'Govt Skill Projects', icon: 'briefcase', link: '/courses', color: '#d97706' },
          { label: 'Verify Certificate', icon: 'award', link: '/verify-certificate', color: '#0891b2' },
        ];
        const catItems = (cmsCats && cmsCats.length > 0) ? cmsCats : defaultCats;
        if (!catItems.length) return null;
        return (
          <section key="categories" className="py-4 liquid-surface border-b border-white/40 shadow-xs relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {catItems.map((cat, i) => {
                  const Icon = iconMap[cat.icon] || Monitor;
                  return (
                    <Link
                      key={i}
                      to={cat.link || '/courses'}
                      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl liquid-glass liquid-refraction text-slate-800 transition-all hover:scale-105 shrink-0 text-xs sm:text-sm font-bold"
                      style={{ '--cat-color': cat.color || themeColor }}
                    >
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: cat.color || themeColor }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="group-hover:text-slate-900 transition-colors">{cat.label}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'verticals':
        if (hp.verticals?.show === false) return null;
        return (
          <section key="verticals" id="verticals" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/30 via-indigo-50/20 to-white border-b border-slate-200/60 relative overflow-hidden">
            {/* Liquid glass decorative orbs */}
            <div className="absolute top-10 right-10 w-40 h-40 bg-indigo-400/10 rounded-full liquid-orb" />
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-400/10 rounded-full liquid-orb" style={{ animationDelay: '10s' }} />
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Educational Streams"
                  title={hp.verticals?.title || 'Our Core Academic Verticals'}
                  subtitle={hp.verticals?.subtitle || 'Specialized training pathways designed for real-world vocational employment and business skills.'}
                  themeColor={themeColor}
                />
              </Reveal>

              <div className="flex flex-wrap justify-center gap-6">
                {(hp.verticals?.items || []).map((v, i) => {
                  const Icon = iconMap[v.icon] || BookOpen;
                  return (
                    <Reveal key={i} delay={i * 80} className="w-full max-w-[300px]">
                      <div className="group liquid-glass liquid-refraction rounded-2xl p-6 transition-all duration-300 h-full flex flex-col justify-between liquid-shimmer relative overflow-hidden">
                        {/* Top gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                        
                        <div>
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border group-hover:scale-110 transition-all duration-300" style={{ color: themeColor, backgroundColor: `${themeColor}12`, borderColor: `${themeColor}20` }}>
                            <Icon className="w-7 h-7" />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {v.coursesCount || 'Featured Stream'}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors" style={{ '--hover-color': themeColor }}>
                            {v.title}
                          </h3>

                          {v.shortDesc && (
                            <p className="text-xs font-bold mb-2.5" style={{ color: themeColor }}>
                              {v.shortDesc}
                            </p>
                          )}

                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                            {v.description}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            to={v.link || '/courses'}
                            className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
                            style={{ color: themeColor }}
                          >
                            Explore Courses <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Stream" />
                        </div>

                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'courses':
        if (hp.courses?.show === false) return null;
        const tabs = hp.courses?.fieldTabs || [];
        return (
          <section key="courses" id="courses" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30 border-b border-slate-200/60 relative overflow-hidden">
            {/* Liquid orbs */}
            <div className="absolute top-20 right-20 w-48 h-48 bg-blue-400/8 rounded-full liquid-orb" />
            <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-400/8 rounded-full liquid-orb" style={{ animationDelay: '8s' }} />
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Curriculum"
                  title={hp.courses?.title || 'Trending & Popular Courses'}
                  subtitle={hp.courses?.subtitle || 'Explore our standardized vocational syllabus and industry certification modules.'}
                  themeColor={themeColor}
                />
              </Reveal>

              {tabs.length > 0 && (
                <>
                  {/* Category Switch Tabs */}
                  <Reveal delay={100}>
                    <div className="flex justify-center gap-2 mb-10 flex-wrap">
                      {tabs.map((tab, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveCourseTab(i)}
                          className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                            activeCourseTab === i
                              ? 'text-white shadow-lg'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
                          }`}
                          style={activeCourseTab === i ? { backgroundColor: themeColor, boxShadow: `0 4px 14px ${themeColor}40` } : {}}
                        >
                          {tab.fieldName}
                        </button>
                      ))}
                    </div>
                  </Reveal>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(tabs[activeCourseTab]?.courses || []).map((c, i) => (
                      <Reveal key={i} delay={i * 60}>
                        <TiltCard className="group liquid-glass liquid-refraction rounded-2xl p-6 transition-all duration-300 h-full flex flex-col justify-between liquid-shimmer relative overflow-hidden">
                          {/* Top gradient accent */}
                          <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
                          
                          {/* Course Card Header */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 border border-blue-100/50 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                                <BookOpen className="w-6 h-6" />
                              </div>
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Certified
                              </span>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                              {c.name}
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                              {c.description || 'Comprehensive diploma course covering practical modules, lab exercises and assessment tests.'}
                            </p>
                          </div>

                          {/* Course Footer with Details & Actions */}
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" style={{ color: themeColor }} />
                                {c.duration || '6 Months'}
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                                {c.fee || 'Affordable Fee'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('open-enquiry', { detail: { service: c.name } }));
                                }}
                                className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-all"
                              >
                                Syllabus
                              </button>
                              <Link
                                to="/admission"
                                className="py-2 px-3 rounded-lg text-white text-xs font-bold text-center transition-all shadow-xs hover:shadow-md"
                                style={{ backgroundColor: themeColor }}
                              >
                                Enroll Now
                              </Link>
                            </div>
                          </div>

                        </TiltCard>
                      </Reveal>
                    ))}
                  </div>
                </>
              )}

              <Reveal delay={200}>
                <div className="mt-10 text-center">
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all hover:scale-105 group"
                  >
                    <span>Browse All Courses</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>
        );

      case 'stats':
        if (hp.stats?.show === false) return null;
        return (
          <section key="stats" id="stats" className="py-14 bg-gradient-to-r from-indigo-950 via-blue-950 to-indigo-950 border-b border-indigo-900/50 relative overflow-hidden">
            {/* Liquid glass orbs */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/15 rounded-full liquid-orb" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/15 rounded-full liquid-orb" style={{ animationDelay: '7s' }} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {(hp.stats?.items || []).map((s, i) => {
                  const Icon = iconMap[s.icon] || Building;
                  return (
                    <Reveal key={i} delay={i * 60}>
                      <div className="p-5 rounded-2xl liquid-glass-dark text-center stat-glow transition-all hover:scale-105" style={{ animationDelay: `${i * 0.4}s` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ color: themeColor, backgroundColor: `${themeColor}20` }}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-white mb-1">
                          {(() => {
                            const num = parseInt(String(s.value).replace(/[^0-9]/g, ''));
                            const suffix = String(s.value).replace(/[0-9,]/g, '');
                            return isNaN(num) ? s.value : <Counter end={num} suffix={suffix} />;
                          })()}
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {s.label}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'verifyWidget':
        if (hp.verifyWidget?.show === false) return null;
        return (
          <section key="verifyWidget" className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/30 to-white border-b border-slate-200/60 relative overflow-hidden">
            {/* Liquid glass bg orb */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/8 rounded-full liquid-orb" />
            <div className="max-w-4xl mx-auto relative z-10">
              <div className="liquid-glass liquid-border rounded-3xl p-6 sm:p-8 shadow-lg liquid-refraction relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${themeColor}, #7c3aed, ${themeColor})`, backgroundSize: '200% 100%', animation: 'border-flow 3s linear infinite' }} />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: themeColor, backgroundColor: `${themeColor}15` }}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md" style={{ color: themeColor, backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}30` }}>
                        {hp.verifyWidget?.badge || 'Online Verification'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug mb-1.5">
                      {hp.verifyWidget?.title || 'Verify Student Certificate'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {hp.verifyWidget?.subtitle || 'Check authenticity, institute name, grade, and passing year online directly from our database.'}
                    </p>
                  </div>

                  <div className="md:col-span-7">
                    <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder={hp.verifyWidget?.placeholder || 'Enter Certificate Code (e.g. CERT-00123)'}
                        className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all hover:scale-105 shrink-0 flex items-center justify-center gap-2"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Award className="w-4 h-4" />
                        {hp.verifyWidget?.buttonText || 'Verify Now'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'about':
        if (hp.about?.show === false) return null;
        return (
          <section key="about" id="about" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30 border-b border-slate-200/60 relative overflow-hidden">
            {/* Liquid glass decorative orb */}
            <div className="absolute top-20 right-10 w-40 h-40 bg-indigo-400/8 rounded-full liquid-orb" />
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Institutional Profile"
                  title={hp.about?.title || 'About Our Organization'}
                  subtitle={hp.about?.description}
                  themeColor={themeColor}
                />
              </Reveal>

              {/* Mission & Vision inline */}
              {(hp.about?.mission || hp.about?.vision) && (
                <Reveal delay={100}>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto mb-12">
                    {hp.about?.mission && (
                      <div className="flex-1 flex items-start gap-3 p-5 liquid-glass liquid-refraction rounded-2xl transition-all liquid-shimmer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }} />
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}12` }}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm mb-1">Our Mission</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{hp.about.mission}</p>
                        </div>
                      </div>
                    )}
                    {hp.about?.vision && (
                      <div className="flex-1 flex items-start gap-3 p-5 liquid-glass liquid-refraction rounded-2xl transition-all liquid-shimmer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#7c3aed' }} />
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ color: '#7c3aed', backgroundColor: '#7c3aed12' }}>
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm mb-1">Our Vision</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{hp.about.vision}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}

              {/* Key Features */}
              {(hp.about?.features || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(hp.about?.features || []).map((f, i) => {
                    const Icon = iconMap[f.icon] || BookOpen;
                    return (
                      <Reveal key={i} delay={i * 60} className="h-full">
                        <div className="h-full flex flex-col items-center justify-start text-center p-5 liquid-glass liquid-refraction rounded-2xl transition-all card-lift liquid-shimmer relative overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform hover:scale-110 hover:rotate-3" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{f.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}

            </div>
          </section>
        );

      case 'franchise':
        if (hp.franchise?.show === false) return null;
        return (
          <section key="franchise" id="franchise" className="py-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
            {/* Liquid glass animated orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full liquid-orb" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full liquid-orb" style={{ animationDelay: '5s' }} />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="max-w-5xl mx-auto relative z-10">
              <Reveal>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 border" style={{ backgroundColor: `${themeColor}25`, color: themeColor, borderColor: `${themeColor}40` }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Franchise Affiliation
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight">
                      {hp.franchise?.title || 'Partner With Us'}
                    </h2>
                    <p className="text-sm text-slate-300 max-w-xl leading-relaxed mb-4">
                      {hp.franchise?.subtitle || 'Join our growing network of training institutes across India'}
                    </p>
                    {/* Quick stats */}
                    <div className="flex gap-6 justify-center md:justify-start">
                      <div>
                        <p className="text-2xl font-black" style={{ color: themeColor }}>50+</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Partners</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-2xl font-black" style={{ color: themeColor }}>15+</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">States</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-2xl font-black" style={{ color: themeColor }}>5000+</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Students</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Link
                      to="/franchise"
                      className="btn-shimmer inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-105"
                      style={{ backgroundColor: themeColor }}
                    >
                      <span>{hp.franchise?.buttonText || 'Apply for Franchise'}</span>
                      <ArrowRight className="w-4 h-4 arrow-bounce" />
                    </Link>
                    <button
                      onClick={() => window.dispatchEvent(new Event('open-partner-enquiry'))}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
                    >
                      <Building className="w-4 h-4" />
                      <span>Talk to Coordinator</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        );

      case 'certifications':
        if (hp.certifications?.show === false || !hp.certifications?.items?.length) return null;
        return (
          <section key="certifications" id="certifications" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50/30 border-b border-slate-200/60 relative overflow-hidden">
            {/* Subtle gradient bg */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/8 rounded-full liquid-orb" />
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Recognition"
                  title={hp.certifications?.title || 'Certifications & Accreditations'}
                  subtitle={hp.certifications?.subtitle || 'Quality standards compliant with industry and government benchmarks.'}
                  themeColor={themeColor}
                />
              </Reveal>

              <div className="flex flex-wrap justify-center gap-5">
                {hp.certifications.items.map((c, i) => (
                  <Reveal key={i} delay={i * 60} className="w-full max-w-[260px]">
                    <div className="liquid-glass liquid-refraction rounded-2xl p-5 text-center transition-all card-lift liquid-shimmer relative overflow-hidden group">
                      {/* Hover gradient ring */}
                      <div className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${themeColor}30` }} />
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-14 h-14 object-contain mb-2.5 mx-auto transition-transform group-hover:scale-110" onError={(e) => { const img = e.target; if (!img.dataset.retried && c.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = c.logo.substring(c.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 mx-auto bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Award className="w-6 h-6" />
                        </div>
                      )}
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{c.name}</h4>
                      <p className="text-xs text-slate-500">{c.description}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        if (hp.testimonials?.show === false || !hp.testimonials?.items?.length) return null;
        return (
          <section key="testimonials" id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/30 via-indigo-50/20 to-white border-b border-slate-200/60 relative overflow-hidden">
            {/* Decorative quote marks */}
            <div className="absolute top-10 left-10 text-9xl font-black text-indigo-100/40 opacity-30 select-none pointer-events-none">"</div>
            <div className="absolute bottom-10 right-10 text-9xl font-black text-purple-100/40 opacity-30 select-none pointer-events-none">"</div>
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Feedback"
                  title={hp.testimonials?.title || 'Student & Partner Success Stories'}
                  subtitle={hp.testimonials?.subtitle || 'Real feedback from our training batches and affiliated centers across India.'}
                  themeColor={themeColor}
                />
              </Reveal>

              <Reveal delay={100}>
                <TestimonialSlider
                  testimonials={hp.testimonials.items.map(t => ({
                    name: t.name,
                    role: t.role ? (t.field ? `${t.role} • ${t.field}` : t.role) : '',
                    message: t.review,
                    rating: t.rating || 5,
                  }))}
                />
              </Reveal>
            </div>
          </section>
        );

      case 'cta':
        if (hp.cta?.show === false) return null;
        return (
          <section key="cta" id="cta" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5, #7c3aed)' }}>
            {/* Liquid glass floating shapes */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full liquid-orb" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full liquid-orb" style={{ animationDelay: '5s' }} />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full liquid-orb" style={{ animationDelay: '10s' }} />
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 mb-5">
                  <Rocket className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Admissions 2026-27</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                  {hp.cta?.title || 'Ready to Start Your Career Journey?'}
                </h2>
                <p className="text-sm sm:text-base opacity-90 mb-8 max-w-xl mx-auto leading-relaxed">
                  {hp.cta?.description || 'Get in touch with our counselors for syllabus details, admission fee schedules, and partner opportunities.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/admission"
                    className="btn-shimmer px-7 py-3.5 bg-white hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-105"
                    style={{ color: themeColor }}
                  >
                    Apply for Admission 2026-27
                  </Link>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-enquiry'))}
                    className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl font-bold text-xs sm:text-sm text-white transition-all hover:scale-105"
                  >
                    Instant Inquiry Form
                  </button>
                </div>
              </Reveal>
            </div>
          </section>
        );

      case 'contact':
        if (hp.contact?.show === false) return null;
        return (
          <section key="contact" id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/30 to-white border-t border-slate-200/60 relative overflow-hidden">
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-400/8 rounded-full liquid-orb" />
            <div className="max-w-7xl mx-auto relative z-10">
              <Reveal>
                <SectionHeading
                  badge="Connect"
                  title={hp.contact?.title || 'Contact Headquarters'}
                  subtitle={hp.contact?.subtitle || 'Reach out to our administrative team for admission, certificate, or partnership queries.'}
                  themeColor={themeColor}
                />
              </Reveal>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Contact Information Cards */}
                <Reveal className="lg:col-span-6 space-y-4">
                  <div className="liquid-glass rounded-2xl p-6 space-y-3 liquid-refraction">
                    {/* Phone numbers - all in one box */}
                    <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white/40 border border-white/50">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Call Support</p>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">{hp.contact?.phone || '+91 9999999999'}</p>
                        {(hp.contact?.additionalPhones || []).map((p, idx) => (
                          <p key={idx} className="text-xs sm:text-sm font-semibold text-slate-800">{p}</p>
                        ))}
                      </div>
                    </div>

                    {[
                      { icon: Mail, val: hp.contact?.email || 'contact@example.com', label: 'Email Department' },
                      { icon: MapPin, val: hp.contact?.address || 'Central Headquarters, India', label: 'Head Office Address' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl bg-white/40 border border-white/50">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 shrink-0">
                          <c.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{c.label}</p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{c.val}</p>
                        </div>
                      </div>
                    ))}

                    {/* Social links */}
                    {(hp.contact?.socialLinks?.facebook || hp.contact?.socialLinks?.instagram || hp.contact?.socialLinks?.youtube || hp.contact?.socialLinks?.whatsapp) && (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Follow Us</p>
                        <div className="flex gap-2">
                          {hp.contact.socialLinks.facebook && (
                            <a href={hp.contact.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-blue-600 bg-slate-100 transition-colors">
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                          {hp.contact.socialLinks.instagram && (
                            <a href={hp.contact.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-pink-600 bg-slate-100 transition-colors">
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {hp.contact.socialLinks.youtube && (
                            <a href={hp.contact.socialLinks.youtube} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-red-600 bg-slate-100 transition-colors">
                              <Youtube className="w-4 h-4" />
                            </a>
                          )}
                          {hp.contact.socialLinks.whatsapp && (
                            <a href={hp.contact.socialLinks.whatsapp} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-emerald-600 bg-slate-100 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Reveal>

                {/* Map or Direct Form Link */}
                <Reveal delay={100} className="lg:col-span-6">
                  {hp.contact?.mapEmbed ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs h-full min-h-[280px]">
                      {hp.contact.mapEmbed.includes('<iframe') ? (
                        <div className="h-full min-h-[280px] [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-none" dangerouslySetInnerHTML={{ __html: hp.contact.mapEmbed }} />
                      ) : (
                        <iframe
                          src={hp.contact.mapEmbed}
                          className="w-full h-full min-h-[280px] border-none"
                          title="Organization Location"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs h-full min-h-[280px] flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-indigo-50 text-indigo-600">
                        <Mail className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">Have a Question?</h3>
                      <p className="text-xs text-slate-500 mb-5 max-w-sm">Contact our academic coordinators directly for prompt assistance.</p>
                      <button
                        onClick={() => window.dispatchEvent(new Event('open-enquiry'))}
                        className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs hover:bg-indigo-700 transition-all"
                        style={{ backgroundColor: themeColor }}
                      >
                        Open Inquiry Form
                      </button>
                    </div>
                  )}
                </Reveal>

              </div>
            </div>
          </section>
        );

      case 'notices':
        if (hp.notices?.show === false || !hp.notices?.items?.length) return null;
        return (
          <section key="notices" id="notices" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-blue-50/20 to-indigo-50/30 border-b border-slate-200/60 relative overflow-hidden">
            <div className="max-w-5xl mx-auto">
              <Reveal>
                <SectionHeading
                  badge="Updates"
                  title={hp.notices?.title || 'Notices & Announcements'}
                  themeColor={themeColor}
                />
              </Reveal>
              <div className="space-y-3">
                {(hp.notices?.items || []).map((notice, i) => {
                  const isNew = isNoticeNew(notice);
                  return (
                    <Reveal key={i} delay={i * 50}>
                      <div
                        onClick={() => notice.pdfUrl && window.open(notice.pdfUrl, '_blank')}
                        className={`p-4 rounded-2xl liquid-glass liquid-refraction transition-all text-left liquid-shimmer relative overflow-hidden ${notice.pdfUrl ? 'cursor-pointer group' : ''}`}
                      >
                        {/* Left accent bar */}
                        <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: themeColor }} />
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{notice.title}</h4>
                          {isNew && <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">NEW</span>}
                        </div>
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed">{notice.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/50">
                          <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold uppercase tracking-wider border border-slate-200/60">{notice.category || 'General'}</span>
                          {notice.date && <span>{new Date(notice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        );

      default:
        if (section.startsWith('custom_')) {
          const cs = (hp.customSections || []).find(s => s.id === section);
          if (!cs || cs.show === false || !cs.cards?.length) return null;
          const bgClass = cs.bgStyle === 'dark' ? 'bg-slate-900 text-white' : cs.bgStyle === 'slate' ? 'bg-slate-50/70' : 'bg-white';
          const isDark = cs.bgStyle === 'dark';
          return (
            <section key={cs.id} id={cs.id} className={`py-16 sm:py-20 px-4 sm:px-6 lg:px-8 ${bgClass} border-b border-slate-200/60`}>
              <div className="max-w-7xl mx-auto">
                <Reveal>
                  <SectionHeading
                    badge={cs.badge || 'Info'}
                    title={cs.title}
                    subtitle={cs.subtitle}
                    themeColor={themeColor}
                  />
                </Reveal>
                <div className="flex flex-wrap justify-center gap-5">
                  {cs.cards.map((card, i) => {
                    const Icon = iconMap[card.icon] || BookOpen;
                    return (
                      <Reveal key={i} delay={i * 60} className="w-full max-w-[260px]">
                        <div className={`h-full flex flex-col items-center justify-start text-center p-5 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-xs hover:shadow-sm'}`}>
                          {card.image ? (
                            <img src={card.image} alt={card.title} className="w-14 h-14 object-contain mb-3 rounded-xl" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-indigo-50" style={{ color: themeColor }}>
                              <Icon className="w-5 h-5" />
                            </div>
                          )}
                          <h4 className={`font-bold text-xs sm:text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.title}</h4>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{card.description}</p>
                          {card.link && (
                            <a href={card.link} target="_blank" rel="noreferrer" className="mt-3 text-xs font-bold hover:underline" style={{ color: themeColor }}>
                              {card.linkText || 'Learn More'}
                            </a>
                          )}
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50/20 via-white to-indigo-50/20 text-slate-900 min-h-screen selection:bg-indigo-600 selection:text-white relative">
      <SEO
        title={hp?.settings?.browserTitle || `${orgName} - Training Institute Management`}
        description={hp?.about?.description || 'Empowering India through quality education and practical training across multiple fields'}
        image={hp?.settings?.logo}
        keywords="paramedical training, computer training, skill development, stock market training, franchise, certification, vocational courses, India"
      />
      <Navbar />
      <main>
        {layoutOrder.map(section => renderSection(section))}
      </main>
      <Footer homepageData={hp} />
      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
