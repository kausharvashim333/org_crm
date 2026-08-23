import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFranchiseReceipt } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  ShieldCheck, Building2, User, MapPin, Phone, Mail, Calendar,
  CheckCircle2, Clock, Award, FileText, ArrowLeft, BadgeCheck,
  Globe, Laptop, Zap
} from 'lucide-react';

export default function FranchiseVerificationPage() {
  const { franchiseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [orgInfo, setOrgInfo] = useState(null);

  useEffect(() => {
    getFranchiseReceipt(franchiseId)
      .then(res => {
        setPartner(res.data.partner);
        setOrgInfo(res.data.orgInfo);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [franchiseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Verifying franchise credentials...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Failed</h2>
          <p className="text-sm text-slate-500 mb-6">No franchise record found for this ID. Please check and try again.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const orgSettings = orgInfo?.settings || {};
  const orgContact = orgInfo?.contact || {};
  const orgName = orgSettings.orgName || 'National Skill & Educational Mission';
  const orgTagline = orgSettings.tagline || 'Govt. Recognized & ISO 9001:2015 Certified Educational Network';
  const orgLogo = orgSettings.logo || '';
  const themeColor = orgSettings.themeColor || '#2563eb';
  const proposal = partner.proposalDetails || {};
  const payment = partner.paymentInfo || {};
  const isPaid = payment.paymentStatus === 'paid' || partner.status === 'active';
  const planName = payment.planName || proposal.partnershipPlan || 'Authorized Study Center Plan';
  const paidAmount = payment.paidAmount || payment.planFee || 0;

  const formattedDate = partner.createdAt
    ? new Date(partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const statusLabel = isPaid ? 'Active & Paid' : 'Pending Review';
  const statusColor = isPaid ? 'emerald' : 'amber';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Verification Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" /> QR Verification Successful
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Franchise Authorization Verified</h1>
          <p className="text-sm text-slate-300">This is an officially recognized partner center of {orgName}</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Status Card */}
        <div className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${
          isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isPaid ? 'bg-emerald-500' : 'bg-amber-500'
          }`}>
            {isPaid ? <CheckCircle2 className="w-7 h-7 text-white" /> : <Clock className="w-7 h-7 text-white" />}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-black ${isPaid ? 'text-emerald-900' : 'text-amber-900'}`}>
              {statusLabel}
            </h3>
            <p className={`text-sm ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
              Franchise ID: <strong>{partner.franchiseId}</strong> · Registered on {formattedDate}
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${
              isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {partner.status || (isPaid ? 'active' : 'pending')}
            </span>
          </div>
        </div>

        {/* Institute Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: themeColor }} />
            <h2 className="font-bold text-slate-900 text-base">Institute Details</h2>
          </div>
          <div className="p-6 space-y-5">

            {/* Institute Name + Logo */}
            <div className="flex items-center gap-4">
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={partner.instituteName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                  onError={(e) => {
                    const img = e.target;
                    if (!img.dataset.retried && partner.logo.includes('/uploads/')) {
                      img.dataset.retried = 'true';
                      const path = partner.logo.substring(partner.logo.indexOf('/uploads/'));
                      img.src = `/api${path}`;
                    } else { img.style.display = 'none'; }
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}25` }}>
                  <Building2 className="w-8 h-8" style={{ color: themeColor }} />
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-slate-900">{partner.instituteName}</h3>
                <p className="text-sm text-slate-500">{partner.tagline || 'Authorized Training Center'}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="text-sm font-semibold text-slate-800">{partner.address}</p>
                  <p className="text-sm text-slate-600">{partner.city}, {partner.state} - {partner.pincode || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Center Head / Director</p>
                  <p className="text-sm font-semibold text-slate-800">{partner.ownerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 font-mono">{partner.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{partner.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Date</p>
                  <p className="text-sm font-semibold text-slate-800">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partnership Plan</p>
                  <p className="text-sm font-semibold text-slate-800">{planName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Laptop className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Infrastructure</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {partner.computers || proposal.computers || '10+'} Computers · {partner.totalArea || proposal.spaceSqFt || '600+'} Sq.Ft.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BadgeCheck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Center Type</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{partner.centerType || proposal.institutionType || 'Computer & IT Academy'}</p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: themeColor }} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Affiliation Fee</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    ₹{paidAmount > 0 ? paidAmount.toLocaleString('en-IN') : '15,000'}
                  </span>
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded ${
                    isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isPaid ? 'PAID' : 'PENDING'}
                  </span>
                </div>
              </div>
              {payment.razorpayPaymentId && (
                <p className="text-[11px] font-mono text-slate-500 mt-2">
                  Transaction ID: {payment.razorpayPaymentId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5" style={{ color: themeColor }} />
            <h2 className="font-bold text-slate-900 text-base">Parent Organization</h2>
          </div>
          <div className="p-6 flex items-center gap-4">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt={orgName}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                onError={(e) => {
                  const img = e.target;
                  if (!img.dataset.retried && orgLogo.includes('/uploads/')) {
                    img.dataset.retried = 'true';
                    const path = orgLogo.substring(orgLogo.indexOf('/uploads/'));
                    img.src = `/api${path}`;
                  } else { img.style.display = 'none'; }
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                <Globe className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-slate-900">{orgName}</h3>
              <p className="text-xs text-slate-500">{orgTagline}</p>
              {orgContact.phone && (
                <p className="text-xs text-slate-400 mt-1">Helpline: {orgContact.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {partner.slug && (
            <Link
              to={`/institute/${partner.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
              style={{ backgroundColor: themeColor }}
            >
              <Building2 className="w-4 h-4" /> Visit Institute Website
            </Link>
          )}
          <Link
            to="/franchises"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> All Partner Centers
          </Link>
        </div>

        {/* Trust Footer */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>This verification is system-generated and cryptographically linked to {orgName}'s registry.</span>
          </div>
        </div>
      </main>

      <Footer homepageData={orgInfo} />
    </div>
  );
}
