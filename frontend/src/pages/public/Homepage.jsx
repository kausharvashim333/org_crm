import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses, getPublicStaff, submitInquiry } from '../../api';
import { GraduationCap, Phone, Mail, MapPin, Star, Award, Wifi, BookOpen, Monitor, Users, Building, Bell, ArrowRight, Facebook, Instagram, Youtube, MessageCircle, MessageSquare, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PublicHomepage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showInquiry, setShowInquiry] = useState(false);
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

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!data) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-gray-500 mb-4">Institute not found</p><Link to="/" className="btn-primary">Go Home</Link></div>;

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage.settings?.themeColor || '#2563eb';
  const fontClass = homepage.settings?.fontChoice === 'poppins' ? 'font-poppins' : homepage.settings?.fontChoice === 'roboto' ? 'font-roboto' : 'font-inter';
  const layoutOrder = homepage.layoutOrder || ['hero', 'about', 'courses', 'faculty', 'gallery', 'testimonials', 'facilities', 'notices', 'contact'];

  const iconMap = { monitor: Monitor, wifi: Wifi, book: BookOpen, award: Award, users: Users, building: Building };
  const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube, whatsapp: MessageCircle };

  const renderSection = (section) => {
    switch (section) {
      case 'hero':
        return (
          <section key="hero" className="relative h-[400px] flex items-center justify-center text-white" style={{ background: homepage.hero?.bannerImage ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${homepage.hero.bannerImage}) center/cover` : `linear-gradient(135deg, ${themeColor}, ${themeColor}99)` }}>
            <div className="text-center px-4">
              <h1 className="text-4xl font-bold mb-3">{homepage.hero?.heading || partner.instituteName}</h1>
              <p className="text-xl mb-6 opacity-90">{homepage.hero?.subheading || partner.tagline}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to={`/institute/${slug}/admission`} className="px-8 py-3.5 bg-white text-indigo-950 font-black text-base rounded-2xl hover:bg-slate-100 transition-all shadow-2xl flex items-center gap-2 hover:scale-105">
                  <GraduationCap className="w-6 h-6 text-indigo-600" /> Online Student Admission Form
                </Link>
              </div>
            </div>
          </section>
        );
      case 'about':
        if (homepage.about?.show === false) return null;
        return (
          <section key="about" className="py-16 px-4 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>{homepage.about?.title || 'About Us'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <p className="text-gray-600 leading-relaxed">{homepage.about?.description || partner.description || 'Welcome to our institute. We provide quality computer education and skill development training.'}</p>
              <div className="space-y-3">
                {(homepage.about?.whyChooseUs || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: themeColor }}>✓</div>
                    <span className="text-gray-700">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'courses':
        return (
          <section key="courses" className="py-16 bg-gray-50 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>Our Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.filter(c => c.isActive && c.approvalStatus === 'approved').slice(0, 6).map(c => (
                  <div key={c._id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${themeColor}22` }}><BookOpen style={{ color: themeColor }} /></div>
                    <h3 className="font-semibold text-lg mb-2">{c.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{c.duration}</span>
                      <span className="font-semibold" style={{ color: themeColor }}>₹{c.fee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'faculty':
        if (homepage.faculty?.show === false) return null;
        return (
          <section key="faculty" className="py-16 px-4 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>Our Faculty</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {staff.filter(s => s.status === 'active').slice(0, 4).map(s => (
                <div key={s._id} className="text-center">
                  <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : <Users className="w-10 h-10 text-gray-400" />}
                  </div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.qualification}</p>
                  <p className="text-xs text-gray-400">{s.subjects?.join(', ')}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'gallery':
        if (homepage.gallery?.show === false || !homepage.gallery?.photos?.length) return null;
        return (
          <section key="gallery" className="py-16 bg-gray-50 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>{homepage.gallery?.title || 'Gallery'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {homepage.gallery.photos.map((p, i) => (
                  <img key={i} src={p.url} alt={p.caption || ''} className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                ))}
              </div>
            </div>
          </section>
        );
      case 'testimonials':
        if (homepage.testimonials?.show === false || !homepage.testimonials?.items?.length) return null;
        return (
          <section key="testimonials" className="py-16 px-4 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>{homepage.testimonials?.title || 'Student Reviews'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {homepage.testimonials.items.map((t, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex mb-2">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />)}</div>
                  <p className="text-gray-600 text-sm mb-3">"{t.review}"</p>
                  <p className="font-medium text-sm">- {t.studentName}{t.course ? `, ${t.course}` : ''}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'facilities':
        if (homepage.facilities?.show === false || !homepage.facilities?.items?.length) return null;
        return (
          <section key="facilities" className="py-16 bg-gray-50 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>{homepage.facilities?.title || 'Our Facilities'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {homepage.facilities.items.map((f, i) => {
                  const Icon = iconMap[f.icon] || BookOpen;
                  return (
                    <div key={i} className="text-center">
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${themeColor}22` }}><Icon style={{ color: themeColor }} className="w-8 h-8" /></div>
                      <h3 className="font-semibold text-sm">{f.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{f.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      case 'notices':
        if (homepage.notices?.show === false || !homepage.notices?.items?.length) return null;
        return (
          <section key="notices" className="py-16 px-4 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>{homepage.notices?.title || 'Notices'}</h2>
            <div className="space-y-3">
              {homepage.notices.items.map((n, i) => (
                <div key={i} className="bg-white rounded-lg border p-4 flex items-start gap-3">
                  <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                  <div><p className="font-medium">{n.title}</p><p className="text-sm text-gray-500">{n.message}</p></div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'contact':
        if (homepage.contact?.show === false) return null;
        return (
          <section key="contact" className="py-16 bg-gray-50 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8" style={{ color: themeColor }}>Contact Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><Phone className="w-5 h-5" style={{ color: themeColor }} /><span>{partner.phone}</span></div>
                  <div className="flex items-center gap-3"><Mail className="w-5 h-5" style={{ color: themeColor }} /><span>{partner.email}</span></div>
                  <div className="flex items-center gap-3"><MapPin className="w-5 h-5" style={{ color: themeColor }} /><span>{partner.address}, {partner.city}, {partner.state}</span></div>
                  <div className="flex gap-3 mt-4">
                    {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).map(([key, val]) => {
                      const Icon = socialIcons[key];
                      return Icon ? <a key={key} href={val} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}><Icon className="w-5 h-5" /></a> : null;
                    })}
                  </div>
                </div>
                <button onClick={() => setShowInquiry(true)} className="bg-white rounded-xl shadow-sm border p-6 text-center hover:shadow-md transition-shadow">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: themeColor }} />
                  <h3 className="font-semibold text-lg mb-2">Admission Inquiry</h3>
                  <p className="text-sm text-gray-500 mb-4">Interested in joining? Send us your details</p>
                  <span className="inline-flex items-center gap-2 font-medium" style={{ color: themeColor }}>Apply Now <ArrowRight className="w-4 h-4" /></span>
                </button>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={fontClass}>
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {partner.logo ? <img src={partner.logo} alt="logo" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
            <span className="font-bold text-lg">{partner.instituteName}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#courses" className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Courses</a>
            <Link to={`/institute/${slug}/about`} className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">About</Link>
            <Link to={`/institute/${slug}/contact`} className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Contact</Link>
            <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-lg text-white" style={{ backgroundColor: themeColor }}>Login</Link>
          </div>
        </div>
      </nav>

      {layoutOrder.map(section => renderSection(section))}

      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
          <p className="text-xs opacity-50 mt-2">Powered by {data.orgName || 'Skill India'}</p>
        </div>
      </footer>

      {/* Floating Enquiry FAB Button Wrapper */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3">
        {/* Callout Tooltip */}
        <div className="hidden sm:flex relative bg-slate-900/90 text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-800/80 backdrop-blur-md items-center gap-1.5 animate-callout-nudge select-none mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Enquiry here</span>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900/90 border-r border-t border-slate-800/80 rotate-45" />
        </div>

        <button
          onClick={() => setShowInquiry(false) || setShowInquiry(true)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer mirror-shine border border-white/20 animate-enquiry-fab"
          style={{ backgroundColor: themeColor }}
          title="Make an Inquiry"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Admission Enquiry Modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header banner */}
            <div className="p-6 text-white text-center relative" style={{ backgroundColor: themeColor }}>
              <button 
                onClick={() => setShowInquiry(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-black">{partner.instituteName}</h3>
              <p className="text-xs opacity-90 mt-1">Admission & Course Enquiry</p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleInquiry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Kumar"
                  value={inquiryData.name}
                  onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. student@example.com"
                    value={inquiryData.email}
                    onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course Interested</label>
                <select
                  value={inquiryData.courseInterest}
                  onChange={(e) => setInquiryData({ ...inquiryData, courseInterest: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message / Questions</label>
                <textarea
                  rows="3"
                  placeholder="Ask about batch timings, fees, eligibility..."
                  value={inquiryData.message}
                  onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInquiry(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white font-bold rounded-xl text-sm transition-all hover:scale-102 cursor-pointer shadow-md"
                  style={{ backgroundColor: themeColor }}
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
