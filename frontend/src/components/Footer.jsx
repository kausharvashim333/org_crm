import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrgHomepagePublic } from '../api';
import { GraduationCap, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

export default function Footer({ homepageData }) {
  const [hp, setHp] = useState(homepageData);

  useEffect(() => {
    if (!homepageData) {
      getOrgHomepagePublic().then(res => setHp(res.data.homepage)).catch(() => {});
    }
  }, [homepageData]);

  if (!hp) return null;

  const themeColor = hp.settings?.themeColor || '#2563eb';
  const orgName = hp.settings?.orgName || 'Skill India';
  const logo = hp.settings?.logo;

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-white pt-20 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              {logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'undefined' ? (
                <img
                  src={logo}
                  alt="logo"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                  onError={(e) => {
                    if (!e.target.dataset.retried && logo.startsWith('/uploads/')) {
                      e.target.dataset.retried = 'true';
                      e.target.src = `/api${logo}`;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: themeColor }}>
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="font-extrabold text-xl tracking-tight">{orgName}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6 font-light">
              {hp.about?.description || 'Empowering through quality education and vocational training skills across multiple fields.'}
            </p>
            <div className="flex gap-2">
              {hp.contact?.socialLinks?.facebook && (
                <a href={hp.contact.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {hp.contact?.socialLinks?.instagram && (
                <a href={hp.contact.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {hp.contact?.socialLinks?.youtube && (
                <a href={hp.contact.socialLinks.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {hp.contact?.socialLinks?.whatsapp && (
                <a href={hp.contact.socialLinks.whatsapp} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wider uppercase">Quick Links</h4>
            <div className="space-y-3">
              <Link to="/admission" className="block text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Online Admission Portal</Link>
              <Link to="/about" className="block text-sm text-slate-400 hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="block text-sm text-slate-400 hover:text-white transition-colors">Contact Us</Link>
              <Link to="/franchises" className="block text-sm text-slate-400 hover:text-white transition-colors">Our Centers</Link>
              <Link to="/notices" className="block text-sm text-slate-400 hover:text-white transition-colors">Notices</Link>
              <Link to="/verify-certificate" className="block text-sm text-slate-400 hover:text-white transition-colors">Verify Certificate</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wider uppercase">Our Fields</h4>
            <div className="space-y-3">
              {(hp.verticals?.items || []).slice(0, 5).map((v, i) => (
                <p key={i} className="text-sm text-slate-400">{v.title}</p>
              ))}
              {(!hp.verticals?.items || hp.verticals.items.length === 0) && (
                <>
                  <p className="text-sm text-slate-400">Paramedical</p>
                  <p className="text-sm text-slate-400">Computer Training</p>
                  <p className="text-sm text-slate-400">Skill Development</p>
                  <p className="text-sm text-slate-400">Stock Market Training</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} {orgName}. All rights reserved.</p>
          <p className="text-xs text-slate-500">Paramedical | Computer Training | Skill Development | Stock Market Training</p>
        </div>
      </div>
    </footer>
  );
}
