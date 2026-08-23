import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses, submitInquiry } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap, Phone, Mail, MapPin, ArrowRight, X, Map as MapIcon,
  Facebook, Instagram, Youtube, MessageCircle,
} from 'lucide-react';

const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube, whatsapp: MessageCircle };

export default function PartnerContactPage() {
  const { slug } = useParams();
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', courseInterest: '', message: '' });
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
      getPublicCourses({ partnerId: res.data.partner._id }).then(r => setCourses(r.data.courses)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!data) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-gray-500 mb-4">Institute not found</p><Link to="/" className="btn-primary">Go Home</Link></div>;

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage.settings?.themeColor || '#2563eb';
  const contact = homepage.contact || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitInquiry(partner._id, form);
      showSuccess('Inquiry submitted! We will contact you soon.');
      setForm({ name: '', phone: '', email: '', courseInterest: '', message: '' });
    } catch (error) {
      showError('Failed to submit inquiry');
    }
  };

  return (
    <div>
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/institute/${slug}`} className="flex items-center gap-2.5">
            {partner.logo ? <img src={partner.logo} alt="logo" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
            <span className="font-bold text-base text-slate-900 truncate max-w-[200px]">{partner.instituteName}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to={`/institute/${slug}`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Home</Link>
            <Link to={`/institute/${slug}/courses`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Courses</Link>
            <Link to={`/institute/${slug}/about`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">About</Link>
            <Link to={`/institute/${slug}/faculty`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Faculty</Link>
            <Link to={`/institute/${slug}/gallery`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Gallery</Link>
            <Link to={`/institute/${slug}/notices`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Notices</Link>
            <Link to={`/institute/${slug}/contact`} className="text-sm text-white hidden md:block px-3 py-2 rounded-lg font-medium" style={{ backgroundColor: themeColor }}>Contact</Link>
            <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105" style={{ backgroundColor: themeColor }}>Login</Link>
          </div>
        </div>
      </nav>

      <section className="py-16 px-4" style={{ backgroundColor: `${themeColor}08` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: themeColor }}>{contact.title || 'Contact Us'}</h1>
          <p className="text-lg text-gray-600">Get in touch with us for admissions, inquiries, or any questions</p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
                <Phone className="w-6 h-6" style={{ color: themeColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Phone</h3>
                <p className="text-gray-600">{partner.phone}</p>
                {partner.alternatePhone && <p className="text-gray-600">{partner.alternatePhone}</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
                <Mail className="w-6 h-6" style={{ color: themeColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-gray-600">{partner.email}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
                <MapPin className="w-6 h-6" style={{ color: themeColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Address</h3>
                <p className="text-gray-600">{partner.address}, {partner.city}, {partner.state} {partner.pincode}</p>
                {partner.mapsLink && <a href={partner.mapsLink} target="_blank" rel="noreferrer" className="text-sm mt-1 inline-block" style={{ color: themeColor }}>View on Google Maps →</a>}
              </div>
            </div>

            {Object.entries(partner.socialLinks || {}).filter(([_, v]) => v).length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold mb-3">Follow Us</h3>
                <div className="flex gap-3">
                  {Object.entries(partner.socialLinks).filter(([_, v]) => v).map(([key, val]) => {
                    const Icon = socialIcons[key];
                    return Icon ? <a key={key} href={val} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}><Icon className="w-5 h-5" /></a> : null;
                  })}
                </div>
              </div>
            )}

            {contact.mapEmbed && (
              <button onClick={() => setShowMap(true)} className="group w-full bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
                  <MapIcon className="w-6 h-6" style={{ color: themeColor }} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-sm">View Location on Map</h3>
                  <p className="text-xs text-gray-500">Click to open map</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: themeColor }} />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-xl mb-6" style={{ color: themeColor }}>Admission Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Your Name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input type="text" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Your Phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="Your Email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course Interest</label>
                <select value={form.courseInterest} onChange={(e) => setForm({ ...form, courseInterest: e.target.value })} className="input-field">
                  <option value="">Select a Course</option>
                  {courses.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea rows="3" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field" placeholder="Your Message" />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" style={{ backgroundColor: themeColor }}>
                Submit Inquiry <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
          <p className="text-xs opacity-50 mt-2">Powered by {data.orgName || 'Skill India'}</p>
        </div>
      </footer>

      {showMap && contact.mapEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMap(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: themeColor }}><MapIcon className="w-5 h-5" /> Our Location</h3>
              <button onClick={() => setShowMap(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-1" dangerouslySetInnerHTML={{ __html: contact.mapEmbed }} />
          </div>
        </div>
      )}
    </div>
  );
}
