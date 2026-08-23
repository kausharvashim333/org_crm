import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicPartners, getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { GraduationCap, MapPin, Search, ExternalLink, Menu, X } from 'lucide-react';

export default function FranchisesList() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [orgData, setOrgData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getPublicPartners().then(res => { setPartners(res.data.partners); setLoading(false); }).catch(() => setLoading(false));
    getOrgHomepagePublic().then(res => setOrgData(res.data.homepage)).catch(() => {});
  }, []);

  const cities = [...new Set(partners.map(p => p.city).filter(Boolean))];

  const filtered = partners.filter(p => {
    if (p.status !== 'active') return false;
    if (cityFilter && p.city !== cityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.instituteName?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.state?.toLowerCase().includes(q);
    }
    return true;
  });

  const themeColor = orgData?.settings?.themeColor || '#2563eb';
  const orgName = orgData?.settings?.orgName || 'Skill India';
  const logo = orgData?.settings?.logo;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="franchises" />

      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          {logo ? (
            <img src={logo} alt={orgName} className="w-12 h-12 rounded-xl object-cover border border-slate-200" onError={(e) => { const img = e.target; if (!img.dataset.retried && logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = logo.substring(logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold" style={{ color: themeColor }}>Our Partner Centers</h1>
        </div>
        <p className="text-gray-500 mb-8">Find a {orgName} partner center near you</p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by name, city, or state..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input-field w-48">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No partner centers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link key={p._id} to={`/institute/${p.slug}`} className="card hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3 mb-3">
                  {p.logo ? <img src={p.logo} alt={p.instituteName} className="w-12 h-12 rounded-lg object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && p.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = p.logo.substring(p.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.themeColor || '#2563eb' }}><GraduationCap className="w-6 h-6 text-white" /></div>}
                  <div>
                    <h3 className="font-semibold group-hover:text-primary-600 transition-colors">{p.instituteName}</h3>
                    <p className="text-xs text-gray-500">{p.tagline || 'Training Institute'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" /> {p.city}, {p.state}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{p.franchiseId}</span>
                  <span className="text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">Visit <ExternalLink className="w-3 h-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer homepageData={orgData} />
    </div>
  );
}
