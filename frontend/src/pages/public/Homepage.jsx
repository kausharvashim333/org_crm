import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses, getPublicStaff, submitInquiry } from '../../api';
import {
  GraduationCap, Phone, Mail, MapPin, Star, Award, Wifi, BookOpen, Monitor, Users, Building,
  Bell, ArrowRight, Facebook, Instagram, Youtube, MessageCircle, MessageSquare, X,
  Sparkles, CheckCircle2, Clock, Menu, ChevronRight, ArrowUpRight, Zap, Shield, Rocket
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const iconMap = {
  monitor: Monitor, wifi: Wifi, book: BookOpen, award: Award, users: Users, building: Building,
  zap: Zap, shield: Shield, rocket: Rocket, sparkles: Sparkles, check: CheckCircle2,
};

const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube, whatsapp: MessageCircle };

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

function SectionHeading({ badge, title, subtitle, themeColor }) {
  return (
    <div className="text-center mb-12 max-w-3xl mx-auto px-4">
      {badge && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3 border" style={{ backgroundColor: `${themeColor}0f`, borderColor: `${themeColor}25`, color: themeColor }}>
          <Sparkles className="w-3.5 h-3.5" />{badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">{title}</h2>
      <div className="w-14 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: themeColor }} />
      {subtitle && <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

export default function PublicHomepage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showInquiry, setShowInquiry] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [inquiryData, setInquiryData] = useState({ name: '', phone: '', email: '', courseInterest: '', message: '' });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
      getPublicCourses({ partnerId: res.data.partner._id }).then(r => setCourses(r.data.courses)).catch(() => {});
      getPublicStaff({ partnerId: res.data.partner._id }).then(r => setStaff(r.data.staff)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleInquiry = async (e) => {
    e.preventDefault();
    try { await submitInquiry(data.partner._id, inquiryData); showSuccess('Inquiry submitted! We will contact you soon.'); setShowInquiry(false); setInquiryData({ name: '', phone: '', email: '', courseInterest: '', message: '' }); }
    catch (error) { showError('Failed to submit'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderTopColor: '#2563eb' }}></div>
        </div>
        <p className="text-slate-600 font-semibold text-sm">Loading Institute...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="p-8 bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-lg">
        <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Institute Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The institute you're looking for doesn't exist or is not active.</p>
        <Link to="/franchises" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">Browse All Centers</Link>
      </div>
    </div>
  );

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage.settings?.themeColor || '#2563eb';
  const fontClass = homepage.settings?.fontChoice === 'poppins' ? 'font-poppins' : homepage.settings?.fontChoice === 'roboto' ? 'font-roboto' : 'font-inter';
  const layoutOrder = homepage.layoutOrder || ['hero', 'about', 'courses', 'faculty', 'gallery', 'testimonials', 'facilities', 'notices', 'contact'];
  const fixUrl = (url) => { if (!url) return ''; if (url.startsWith('/uploads/')) return `/api${url}`; return url; };
  const activeCourses = courses.filter(c => c.isActive && c.approvalStatus === 'approved');
  const activeStaff = staff.filter(s => s.status === 'active');

  const navLinks = [
    { label: 'Home', to: `/institute/${slug}` },
    { label: 'Courses', to: `/institute/${slug}/courses` },
    { label: 'About', to: `/institute/${slug}/about` },
    { label: 'Faculty', to: `/institute/${slug}/faculty` },
    { label: 'Gallery', to: `/institute/${slug}/gallery` },
    { label: 'Notices', to: `/institute/${slug}/notices` },
    { label: 'Contact', to: `/institute/${slug}/contact` },
  ];

  const renderSection = (section) => {
    switch (section) {
      case 'hero':
        return (
          <section key="hero" id="top" className="relative min-h-[480px] sm:min-h-[560px] flex items-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0" style={{ background: homepage.hero?.bannerImage ? `linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.65)), url(${fixUrl(homepage.hero.bannerImage)}) center/cover` : `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Left Hero Column (7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-5">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                    Admissions Open {new Date().getFullYear()}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
                    {homepage.hero?.heading || partner.instituteName}
                  </h1>
                  <p className="text-lg sm:text-xl text-white/85 mb-8 leading-relaxed max-w-xl">
                    {homepage.hero?.subheading || partner.tagline || 'Quality Education & Skill Development Training'}
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <Link to={`/institute/${slug}/admission`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all shadow-2xl hover:scale-105">
                      <GraduationCap className="w-5 h-5" style={{ color: themeColor }} /> Apply for Admission <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link to={`/institute/${slug}/courses`} className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all">
                      <BookOpen className="w-5 h-5" /> View Courses
                    </Link>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
                    <div className="text-center">
                      <p className="text-2xl sm:text-3xl font-black text-white">{activeCourses.length}+</p>
                      <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Courses</p>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <p className="text-2xl sm:text-3xl font-black text-white">{activeStaff.length}+</p>
                      <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Faculty</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl sm:text-3xl font-black text-white">{partner.establishedYear || '2020'}</p>
                      <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Since</p>
                    </div>
                  </div>
                </div>

                {/* Right Hero Column: Notice Box (5 cols) */}
                <div className="lg:col-span-5 w-full">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/20 overflow-hidden">
                    {/* Widget Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}25` }}>
                          <Bell className="w-4 h-4" style={{ color: themeColor }} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">Notices & Announcements</h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        Live
                      </span>
                    </div>

                    {/* Notice Scrollable Body */}
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                      {(homepage.notices?.items || []).length > 0 ? (
                        (homepage.notices.items).slice(0, 6).map((n, i) => (
                          <div key={i} className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 transition-all text-left">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 line-clamp-2">{n.title}</h4>
                              {n.date && (() => {
                                const noticeDate = new Date(n.date);
                                const diffDays = Math.ceil(Math.abs(new Date() - noticeDate) / (1000 * 60 * 60 * 24));
                                return diffDays <= 7 ? <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">NEW</span> : null;
                              })()}
                            </div>
                            {n.message && <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">{n.message}</p>}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/50">
                              <span className="px-2 py-0.5 rounded bg-white font-semibold uppercase tracking-wider border border-slate-200/60" style={{ color: themeColor }}>
                                Notice
                              </span>
                              {n.date && <span>{new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-slate-400 text-xs">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                          No notices available right now.
                        </div>
                      )}
                    </div>

                    {/* Footer Link */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Institute Notice Board</span>
                      <Link to={`/institute/${slug}/notices`} className="text-xs font-bold inline-flex items-center gap-1" style={{ color: themeColor }}>
                        View All <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        );

      case 'about':
        if (homepage.about?.show === false) return null;
        return (
          <section key="about" id="about" className="py-16 sm:py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="About Us" title={homepage.about?.title || `About ${partner.instituteName}`} subtitle={homepage.about?.description || partner.description || 'Welcome to our institute. We provide quality computer education and skill development training.'} themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <Reveal delay={100}>
                  <div className="space-y-4">
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{homepage.about?.description || partner.description || 'Welcome to our institute. We provide quality computer education and skill development training with experienced faculty and modern infrastructure.'}</p>
                    {partner.centerType && <p className="text-sm text-slate-500"><strong className="text-slate-800">Center Type:</strong> {partner.centerType}</p>}
                    {partner.address && <p className="text-sm text-slate-500"><strong className="text-slate-800">Location:</strong> {partner.address}, {partner.city}, {partner.state}</p>}
                  </div>
                </Reveal>
                <Reveal delay={200}>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" style={{ color: themeColor }} /> Why Choose Us?</h3>
                    <div className="space-y-3">
                      {(homepage.about?.whyChooseUs || ['Experienced & certified faculty', 'Modern computer lab infrastructure', 'Industry-aligned curriculum', 'Placement assistance & career guidance']).map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: themeColor }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        );

      case 'courses':
        return (
          <section key="courses" id="courses" className="py-16 sm:py-20 px-4 bg-slate-50">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="Our Programs" title="Courses We Offer" subtitle="Explore our industry-aligned courses designed to build practical skills and boost your career." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCourses.slice(0, 6).map((c, i) => (
                  <Reveal key={c._id} delay={i * 80}>
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group hover:-translate-y-1 duration-300">
                      {/* Course image or gradient header */}
                      <div className="h-32 relative overflow-hidden" style={{ background: c.image ? `url(${fixUrl(c.image)}) center/cover` : `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }}>
                        {!c.image && <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-10 h-10 text-white/40" /></div>}
                        {c.category && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-700">{c.category}</span>}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-slate-700 transition-colors">{c.name}</h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{c.description || 'Comprehensive training program with practical assignments.'}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> {c.duration || 'Flexible'}
                          </div>
                          <span className="font-black text-base" style={{ color: themeColor }}>₹{c.studentFee || c.fee || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {activeCourses.length === 0 && <p className="text-center text-slate-400 py-8">No courses available yet.</p>}
              {activeCourses.length > 0 && (
                <div className="text-center mt-8">
                  <Link to={`/institute/${slug}/courses`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md" style={{ backgroundColor: themeColor }}>
                    View All Courses <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        );

      case 'faculty':
        if (homepage.faculty?.show === false) return null;
        return (
          <section key="faculty" id="faculty" className="py-16 sm:py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="Our Team" title={homepage.faculty?.title || 'Meet Our Faculty'} subtitle="Learn from experienced educators committed to your success." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {activeStaff.slice(0, 4).map((s, i) => (
                  <Reveal key={s._id} delay={i * 80}>
                    <div className="text-center group">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl mx-auto mb-4 bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all">
                        {s.photo ? <img src={fixUrl(s.photo)} alt={s.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Users className="w-10 h-10 text-slate-300" />}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{s.qualification || s.designation}</p>
                      {s.subjects?.length > 0 && <p className="text-[11px] text-slate-400 mt-1">{s.subjects.join(', ')}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
              {activeStaff.length === 0 && <p className="text-center text-slate-400 py-8">Faculty details coming soon.</p>}
              {activeStaff.length > 0 && (
                <div className="text-center mt-8">
                  <Link to={`/institute/${slug}/faculty`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md" style={{ backgroundColor: themeColor }}>
                    View All Faculty <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        );

      case 'gallery':
        if (homepage.gallery?.show === false || !homepage.gallery?.photos?.length) return null;
        return (
          <section key="gallery" id="gallery" className="py-16 sm:py-20 px-4 bg-slate-50">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="Campus Life" title={homepage.gallery?.title || 'Gallery'} subtitle="Glimpses of our campus, events, and student activities." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {homepage.gallery.photos.map((p, i) => (
                  <Reveal key={i} delay={i * 60}>
                    <div className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square" onClick={() => setLightboxPhoto(p)}>
                      <img src={fixUrl(p.url)} alt={p.caption || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        {p.caption && <p className="text-white text-xs font-medium">{p.caption}</p>}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {homepage.gallery.photos.length > 4 && (
                <div className="text-center mt-8">
                  <Link to={`/institute/${slug}/gallery`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md" style={{ backgroundColor: themeColor }}>
                    View Full Gallery <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        );

      case 'testimonials':
        if (homepage.testimonials?.show === false || !homepage.testimonials?.items?.length) return null;
        return (
          <section key="testimonials" className="py-16 sm:py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="Reviews" title={homepage.testimonials?.title || 'Student Testimonials'} subtitle="Hear what our students have to say about their learning experience." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {homepage.testimonials.items.map((t, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all">
                      <div className="flex mb-3">{Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />)}</div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{t.review}"</p>
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: themeColor }}>
                          {t.studentName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{t.studentName}</p>
                          {t.course && <p className="text-xs text-slate-500">{t.course}</p>}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );

      case 'facilities':
        if (homepage.facilities?.show === false || !homepage.facilities?.items?.length) return null;
        return (
          <section key="facilities" className="py-16 sm:py-20 px-4 bg-slate-50">
            <div className="max-w-6xl mx-auto">
              <Reveal><SectionHeading badge="Infrastructure" title={homepage.facilities?.title || 'Our Facilities'} subtitle="Modern infrastructure and amenities to support effective learning." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {homepage.facilities.items.map((f, i) => {
                  const Icon = iconMap[f.icon] || BookOpen;
                  return (
                    <Reveal key={i} delay={i * 60}>
                      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}25` }}>
                          <Icon style={{ color: themeColor }} className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{f.title}</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.description}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'notices':
        if (homepage.notices?.show === false || !homepage.notices?.items?.length) return null;
        return (
          <section key="notices" className="py-16 sm:py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <Reveal><SectionHeading badge="Updates" title={homepage.notices?.title || 'Notices & Announcements'} themeColor={themeColor} /></Reveal>
              <div className="space-y-3">
                {homepage.notices.items.map((n, i) => (
                  <Reveal key={i} delay={i * 50}>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-start gap-3 hover:border-slate-200 hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
                        <Bell className="w-5 h-5" style={{ color: themeColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{n.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                        {n.date && <p className="text-xs text-slate-400 mt-1.5">{new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {homepage.notices.items.length > 4 && (
                <div className="text-center mt-8">
                  <Link to={`/institute/${slug}/notices`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md" style={{ backgroundColor: themeColor }}>
                    View All Notices <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        );

      case 'contact':
        if (homepage.contact?.show === false) return null;
        return (
          <section key="contact" id="contact" className="py-16 sm:py-20 px-4 bg-slate-50">
            <div className="max-w-5xl mx-auto">
              <Reveal><SectionHeading badge="Get in Touch" title="Contact Us" subtitle="Have questions? Reach out to us or visit our campus." themeColor={themeColor} /></Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Reveal delay={100}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}><Phone className="w-5 h-5" style={{ color: themeColor }} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p><p className="text-sm font-semibold text-slate-800">{partner.phone}</p>{partner.alternatePhone && <p className="text-sm text-slate-500">{partner.alternatePhone}</p>}</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}><Mail className="w-5 h-5" style={{ color: themeColor }} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p><p className="text-sm font-semibold text-slate-800 break-all">{partner.email}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}><MapPin className="w-5 h-5" style={{ color: themeColor }} /></div>
                      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p><p className="text-sm font-semibold text-slate-800">{partner.address}</p><p className="text-sm text-slate-500">{partner.city}, {partner.state} {partner.pincode}</p></div>
                    </div>
                    {partner.mapsLink && (
                      <a href={partner.mapsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all hover:scale-105" style={{ backgroundColor: themeColor }}>
                        <MapPin className="w-3.5 h-3.5" /> View on Map <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {/* Social Links */}
                    {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).length > 0 && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).map(([key, val]) => {
                          const Icon = socialIcons[key];
                          return Icon ? <a key={key} href={val} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110" style={{ backgroundColor: themeColor }}><Icon className="w-4 h-4" /></a> : null;
                        })}
                      </div>
                    )}
                  </div>
                </Reveal>
                <Reveal delay={200}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${themeColor}15` }}><GraduationCap className="w-8 h-8" style={{ color: themeColor }} /></div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Admission Inquiry</h3>
                    <p className="text-sm text-slate-500 mb-5">Interested in joining? Send us your details and we'll get back to you.</p>
                    <button onClick={() => setShowInquiry(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-md" style={{ backgroundColor: themeColor }}>
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={fontClass} id="top">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/institute/${slug}`} className="flex items-center gap-2.5">
            {partner.logo ? <img src={fixUrl(partner.logo)} alt="logo" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
            <span className="font-bold text-base text-slate-900 truncate max-w-[200px]">{partner.instituteName}</span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map(l => <Link key={l.to} to={l.to} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">{l.label}</Link>)}
            <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105 hidden sm:block" style={{ backgroundColor: themeColor }}>Login</Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(l => <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium">{l.label}</Link>)}
              <Link to={`/institute/${slug}/login`} className="block px-3 py-2.5 rounded-lg text-sm text-white font-bold text-center mt-2" style={{ backgroundColor: themeColor }}>Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Sections */}
      {layoutOrder.map(section => renderSection(section))}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                {partner.logo ? <img src={fixUrl(partner.logo)} alt="logo" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
                <span className="font-bold text-base">{partner.instituteName}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{partner.tagline || 'Quality education & skill development training.'}</p>
              {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).length > 0 && (
                <div className="flex gap-2 mt-4">
                  {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).map(([key, val]) => {
                    const Icon = socialIcons[key];
                    return Icon ? <a key={key} href={val} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"><Icon className="w-4 h-4" /></a> : null;
                  })}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-slate-200">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map(l => <Link key={l.to} to={l.to} className="block text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>)}
                <Link to={`/institute/${slug}/admission`} className="block text-sm text-slate-400 hover:text-white transition-colors">Admission</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3 text-slate-200">Contact</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {partner.phone}</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {partner.email}</p>
                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {partner.address}, {partner.city}, {partner.state}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
            <p className="text-xs text-slate-600 mt-1">Powered by {data.orgName || 'Skill India'}</p>
          </div>
        </div>
      </footer>

      {/* Floating Enquiry FAB */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
        <div className="hidden sm:flex relative bg-slate-900/90 text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-800/80 backdrop-blur-md items-center gap-1.5 animate-callout-nudge select-none mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Enquiry here</span>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900/90 border-r border-t border-slate-800/80 rotate-45" />
        </div>
        <button onClick={() => setShowInquiry(true)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer mirror-shine border border-white/20 animate-enquiry-fab" style={{ backgroundColor: themeColor }} title="Make an Inquiry">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-xl transition-all"><X className="w-6 h-6" /></button>
          <img src={fixUrl(lightboxPhoto.url)} alt={lightboxPhoto.caption || ''} className="max-w-full max-h-full rounded-2xl object-contain" />
          {lightboxPhoto.caption && <p className="absolute bottom-6 left-0 right-0 text-center text-white text-sm font-medium">{lightboxPhoto.caption}</p>}
        </div>
      )}

      {/* Admission Enquiry Modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-white text-center relative" style={{ backgroundColor: themeColor }}>
              <button onClick={() => setShowInquiry(false)} className="absolute right-4 top-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-sm transition-all"><X className="w-4 h-4" /></button>
              <h3 className="text-xl font-black">{partner.instituteName}</h3>
              <p className="text-xs opacity-90 mt-1">Admission & Course Enquiry</p>
            </div>
            <form onSubmit={handleInquiry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Candidate Full Name *</label>
                <input type="text" required placeholder="e.g. Amit Kumar" value={inquiryData.name} onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Phone *</label>
                  <input type="tel" required placeholder="10-digit number" value={inquiryData.phone} onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" placeholder="e.g. student@example.com" value={inquiryData.email} onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course Interested</label>
                <select value={inquiryData.courseInterest} onChange={(e) => setInquiryData({ ...inquiryData, courseInterest: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850">
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message / Questions</label>
                <textarea rows="3" placeholder="Ask about batch timings, fees, eligibility..." value={inquiryData.message} onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInquiry(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2.5 text-white font-bold rounded-xl text-sm transition-all hover:scale-102 cursor-pointer shadow-md" style={{ backgroundColor: themeColor }}>Submit Inquiry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
