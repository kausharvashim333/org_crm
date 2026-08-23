import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses, getPublicStaff } from '../../api';
import {
  GraduationCap, Phone, Mail, MapPin, Users, BookOpen, Award,
  Monitor, Wifi, Building, ArrowRight, Check, Target,
} from 'lucide-react';

const iconMap = { monitor: Monitor, wifi: Wifi, book: BookOpen, award: Award, users: Users, building: Building };

export default function PartnerAboutPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    getPublicHomepage(slug).then(res => {
      setData(res.data);
      setLoading(false);
      getPublicCourses({ partnerId: res.data.partner._id }).then(r => setCourses(r.data.courses)).catch(() => {});
      getPublicStaff({ partnerId: res.data.partner._id }).then(r => setStaff(r.data.staff)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!data) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-gray-500 mb-4">Institute not found</p><Link to="/" className="btn-primary">Go Home</Link></div>;

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage.settings?.themeColor || '#2563eb';
  const about = homepage.about || {};
  const facilities = homepage.facilities || {};
  const activeCourses = courses.filter(c => c.isActive && c.approvalStatus === 'approved');
  const activeStaff = staff.filter(s => s.status === 'active');

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
            <Link to={`/institute/${slug}/about`} className="text-sm text-white hidden md:block px-3 py-2 rounded-lg font-medium" style={{ backgroundColor: themeColor }}>About</Link>
            <Link to={`/institute/${slug}/faculty`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Faculty</Link>
            <Link to={`/institute/${slug}/gallery`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Gallery</Link>
            <Link to={`/institute/${slug}/notices`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Notices</Link>
            <Link to={`/institute/${slug}/contact`} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">Contact</Link>
            <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105" style={{ backgroundColor: themeColor }}>Login</Link>
          </div>
        </div>
      </nav>

      <section className="py-16 px-4" style={{ backgroundColor: `${themeColor}08` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: themeColor }}>{about.title || 'About Us'}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{about.description || partner.description || 'Welcome to our institute. We provide quality education and skill development training.'}</p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Why Choose Us</h2>
            <div className="space-y-3">
              {(about.whyChooseUs || []).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: themeColor }}><Check className="w-4 h-4" /></div>
                  <span className="text-gray-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Our Achievements</h2>
            {(about.achievements?.length > 0) ? (
              <div className="space-y-3">
                {about.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: themeColor }}><Award className="w-4 h-4" /></div>
                    <span className="text-gray-700">{a}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Achievements will be updated soon.</p>
            )}
          </div>
        </div>
      </section>

      {(facilities.items?.length > 0) && (
        <section className="py-16 px-4" style={{ backgroundColor: `${themeColor}08` }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: themeColor }}>{facilities.title || 'Our Facilities'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {facilities.items.map((f, i) => {
                const Icon = iconMap[f.icon] || BookOpen;
                return (
                  <div key={i} className="bg-white rounded-xl p-6 text-center border border-gray-200">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${themeColor}15` }}>
                      <Icon className="w-7 h-7" style={{ color: themeColor }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-500">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(activeStaff.length > 0) && (
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: themeColor }}>Our Faculty</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {activeStaff.slice(0, 8).map(s => (
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
      )}

      {(activeCourses.length > 0) && (
        <section className="py-16 px-4" style={{ backgroundColor: `${themeColor}08` }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: themeColor }}>Our Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeCourses.map(c => (
                <div key={c._id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${themeColor}22` }}>
                    <BookOpen style={{ color: themeColor }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{c.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{c.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{c.duration}</span>
                    <span className="font-semibold" style={{ color: themeColor }}>₹{c.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-lg opacity-90 mb-8">Contact us today to start your learning journey</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to={`/institute/${slug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg font-medium hover:bg-gray-100 transition-colors" style={{ color: themeColor }}>Back to Home <ArrowRight className="w-4 h-4" /></Link>
            <Link to={`/institute/${slug}/contact`} className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white rounded-lg font-medium hover:bg-white hover:text-gray-800 transition-colors">Contact Us <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
          <p className="text-xs opacity-50 mt-2">Powered by {data.orgName || 'Skill India'}</p>
        </div>
      </footer>
    </div>
  );
}
