import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Phone, Mail, MapPin, ArrowRight, X, Map as MapIcon,
  Facebook, Instagram, Youtube, MessageCircle, Award, Sparkles, Send
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

export default function OrgContactPage() {
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [showMap, setShowMap] = useState(false);
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
  const contact = hp?.contact || {};
  const social = contact.socialLinks || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    const subjectText = encodeURIComponent(`Contact Form: ${form.subject || 'Inquiry'}`);
    const bodyText = encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:${contact.email || 'contact@example.com'}?subject=${subjectText}&body=${bodyText}`;
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="py-20 px-6 relative overflow-hidden text-center bg-slate-900 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
          <div className="max-w-4xl mx-auto relative z-10 space-y-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 text-indigo-250 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>Get In Touch With Us</span>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{contact.title || 'Contact Our Desk'}</h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-sm md:text-base text-slate-350 max-w-2xl mx-auto font-light leading-relaxed">
                {contact.subtitle || 'Have questions? We are here to assist with licensing, curriculum, or admission queries.'}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Content Body Grid */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Column 1: Info Cards */}
            <div className="space-y-6">
              
              {/* Phone Card */}
              <Reveal delay={100}>
                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md flex items-center gap-5 hover:border-slate-300 transition-colors">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                    <Phone className="w-6 h-6" style={{ color: themeColor }} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Call Us Directly</span>
                    <h3 className="font-extrabold text-slate-800 text-base">{contact.phone || 'N/A'}</h3>
                  </div>
                </div>
              </Reveal>

              {/* Email Card */}
              <Reveal delay={150}>
                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md flex items-center gap-5 hover:border-slate-300 transition-colors">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                    <Mail className="w-6 h-6" style={{ color: themeColor }} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Correspondence</span>
                    <h3 className="font-extrabold text-slate-800 text-base">{contact.email || 'N/A'}</h3>
                  </div>
                </div>
              </Reveal>

              {/* Address Card */}
              <Reveal delay={200}>
                <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md flex items-center gap-5 hover:border-slate-300 transition-colors">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                    <MapPin className="w-6 h-6" style={{ color: themeColor }} />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Headquarters Address</span>
                    <h3 className="font-bold text-slate-700 text-sm leading-relaxed">{contact.address || 'N/A'}</h3>
                  </div>
                </div>
              </Reveal>

              {/* Social Channels */}
              {(social.facebook || social.instagram || social.youtube || social.whatsapp) && (
                <Reveal delay={250}>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">Connect With Our Socials</h4>
                    <div className="flex gap-3">
                      {social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: themeColor }}><Facebook className="w-5 h-5" /></a>}
                      {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: themeColor }}><Instagram className="w-5 h-5" /></a>}
                      {social.youtube && <a href={social.youtube} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: themeColor }}><Youtube className="w-5 h-5" /></a>}
                      {social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-transform" style={{ backgroundColor: themeColor }}><MessageCircle className="w-5 h-5" /></a>}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Map Trigger */}
              {contact.mapEmbed && (
                <Reveal delay={300}>
                  <button onClick={() => setShowMap(true)} className="group w-full bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md hover:border-slate-350 transition-colors flex items-center gap-5 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}12` }}>
                      <MapIcon className="w-6 h-6" style={{ color: themeColor }} />
                    </div>
                    <div className="text-left flex-1 space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Navigation Assistant</span>
                      <h3 className="font-extrabold text-slate-800 text-sm">Interactive GPS Map</h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-450 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Reveal>
              )}
            </div>

            {/* Column 2: Redesigned Message Form */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: themeColor }} />
              
              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-800">Send Admin Message</h2>
                <p className="text-xs text-slate-450 mt-1">Submit your details to establish email correspondence with us</p>
              </div>

              {submitted ? (
                <div className="text-center py-12 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-55/70 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <Send className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-800">Message Drafted Successfully!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your local mail app should open immediately with pre-filled candidate details. If it fails, mail us at <span className="font-bold text-slate-700">{contact.email}</span>.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', subject: '', message: '' }); }} 
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                    >
                      Draft Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850" 
                        placeholder="e.g. Aman Raj" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number *</label>
                      <input 
                        type="tel" 
                        required 
                        value={form.phone} 
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm text-slate-850" 
                        placeholder="e.g. 9876543210" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm text-slate-850" 
                      placeholder="e.g. aman@example.com" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Subject</label>
                    <input 
                      type="text" 
                      value={form.subject} 
                      onChange={(e) => setForm({ ...form, subject: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm text-slate-850" 
                      placeholder="e.g. Course Admissions, Fee Inquiry" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Body *</label>
                    <textarea 
                      rows="4" 
                      required 
                      value={form.message} 
                      onChange={(e) => setForm({ ...form, message: e.target.value })} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm text-slate-850" 
                      placeholder="Describe your inquiry details..." 
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mirror-shine hover:scale-102" 
                      style={{ backgroundColor: themeColor }}
                    >
                      Send Message Email <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </section>
      </div>

      <Footer homepageData={hp} />

      {/* GPS Embed Map Modal */}
      {showMap && contact.mapEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMap(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-850 flex items-center gap-2" style={{ color: themeColor }}><MapIcon className="w-5 h-5" /> GPS Location Map</h3>
              <button onClick={() => setShowMap(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"><X className="w-5 h-5 text-slate-450" /></button>
            </div>
            <div className="p-2 bg-slate-50 flex justify-center" dangerouslySetInnerHTML={{ __html: contact.mapEmbed }} />
          </div>
        </div>
      )}
    </div>
  );
}
