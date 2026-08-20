import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFranchiseReceipt } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Printer, Download, CheckCircle2, ArrowLeft, Building2, ShieldCheck,
  User, Phone, Mail, MapPin, Calendar, Check, Award, Laptop, CreditCard,
  Zap, Clock, FileText, Globe
} from 'lucide-react';

export default function PartnerReceiptPage() {
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
      .catch(() => {
        setLoading(false);
      });
  }, [franchiseId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Franchise Receipt Not Found</h2>
        <p className="text-slate-400 text-sm">Please verify the Franchise Center ID or Application Number.</p>
        <Link to="/franchise/apply" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg">
          Back to Partnership Form
        </Link>
      </div>
    );
  }

  const orgSettings = orgInfo?.settings || {};
  const orgContact = orgInfo?.contact || {};
  const orgName = orgSettings.orgName || 'National Skill & Educational Mission';
  const orgTagline = orgSettings.tagline || 'Govt. Recognized & ISO 9001:2015 Certified Educational Network';
  const orgLogo = orgSettings.logo || '';
  const proposal = partner.proposalDetails || {};
  const payment = partner.paymentInfo || {};

  const formattedDate = partner.createdAt
    ? new Date(partner.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString();

  const isPaid = payment.paymentStatus === 'paid' || partner.status === 'active';
  const planName = payment.planName || proposal.partnershipPlan || 'Authorized Study Center Plan';
  const paidAmount = payment.paidAmount || payment.planFee || 0;

  // Verification QR Code encoding essential registry details
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    `FRANCHISE AFFILIATION RECEIPT | ORG: ${orgName} | CENTER: ${partner.instituteName} | CODE: ${partner.franchiseId} | OWNER: ${partner.ownerName} | STATUS: ${isPaid ? 'PAID & REGISTERED' : 'SUBMITTED PENDING'} | CITY: ${partner.city}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activePage="services" />

      {/* Top Floating Actions Bar - Hidden in Print */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 print:hidden py-4 px-4 sticky top-16 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/franchise" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Partner With Us
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 text-xs font-bold flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-400" /> Print Application Slip
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Printable Slip Container */}
      <main className="flex-1 p-3 sm:p-8 flex items-center justify-center">
        <div className="print-slip-container bg-white text-slate-900 rounded-3xl p-6 sm:p-10 border-4 border-indigo-900/20 shadow-2xl max-w-4xl w-full relative overflow-hidden my-auto font-sans">

          {/* Watermark Organization Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt="Org Watermark"
                className="w-[460px] h-[460px] max-w-[70%] max-h-[70%] object-contain opacity-[0.06] grayscale contrast-125 select-none print:opacity-[0.08]"
              />
            ) : (
              <Building2 className="w-[450px] h-[450px] text-indigo-950 opacity-[0.04]" />
            )}
          </div>

          {/* Header Section */}
          <div className="border-b-4 border-indigo-900 pb-5 space-y-2 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {orgLogo ? (
                    <img
                      src={orgLogo}
                      alt={orgName}
                      className="w-12 h-12 rounded-xl object-contain shadow-xs border border-indigo-100 bg-white p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-lg">
                      {orgName.charAt(0) || 'L'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight uppercase">
                      {orgName}
                    </h1>
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      {orgTagline}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {orgContact.address ? `${orgContact.address}, ${orgContact.city || ''} ${orgContact.state || ''}` : 'Head Office Educational Mission'} · Helpline: {orgContact.phone || '+91 98765 43210'}
                </p>
              </div>

              {/* Verified QR Code */}
              <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-xs flex-shrink-0">
                <img
                  src={qrUrl}
                  alt="Official Verification QR"
                  className="w-24 h-24 rounded-lg object-contain"
                />
                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest mt-1">
                  Scan to Verify
                </span>
              </div>
            </div>

            {/* Document Ribbon Title */}
            <div className="mt-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-white py-2 px-4 rounded-xl text-center shadow-sm flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-indigo-200 uppercase">
                Official Document
              </span>
              <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase text-amber-300">
                Partnership & Franchise Affiliation Receipt
              </h2>
              <span className="text-[10px] font-mono tracking-widest text-indigo-200">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Quick Key Reference Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Franchise Center ID</span>
              <strong className="text-sm font-black text-indigo-900 font-mono">{partner.franchiseId}</strong>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
              <strong className="text-xs font-bold text-slate-800">{formattedDate}</strong>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Partnership Tier</span>
              <strong className="text-xs font-bold text-indigo-800 truncate block">{planName}</strong>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" /> PAID (₹{paidAmount.toLocaleString('en-IN')})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md mt-0.5">
                  <Clock className="w-3 h-3" /> PENDING REVIEW
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Study Center & Institute Details */}
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-indigo-900 pb-1.5">
              <Building2 className="w-4 h-4 text-indigo-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                1. Study Center & Institutional Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium block">Institute / Center Name:</span>
                <span className="font-black text-sm text-slate-900 uppercase">{partner.instituteName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Center Category:</span>
                <span className="font-bold text-slate-800">{partner.centerType || proposal.institutionType || 'Computer & IT Academy'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium block">Center Address:</span>
                <span className="font-semibold text-slate-800">{partner.address}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">City, State & PIN:</span>
                <span className="font-bold text-slate-900">{partner.city}, {partner.state} - {partner.pincode || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Premises Ownership:</span>
                <span className="font-bold text-slate-800 capitalize">{partner.premisesType || proposal.ownership || 'Rented'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Covered Space:</span>
                <span className="font-bold text-slate-800">{partner.totalArea || proposal.spaceSqFt || '600+'} Sq. Ft.</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Computer Systems / Labs:</span>
                <span className="font-bold text-slate-800">{partner.computers || proposal.computers || '10+'} Terminals</span>
              </div>
            </div>
          </div>

          {/* Section 2: Authorized Center Head / Owner Details */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-indigo-900 pb-1.5">
              <User className="w-4 h-4 text-indigo-900" />
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                2. Authorized Center Head / Applicant Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Authorized Person / Director:</span>
                <span className="font-black text-slate-900 text-sm uppercase">{partner.ownerName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Official Mobile Number:</span>
                <span className="font-bold text-slate-900 font-mono">{partner.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Registered Email:</span>
                <span className="font-bold text-slate-900 truncate block">{partner.email}</span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Education Experience:</span>
                <span className="font-semibold text-slate-800">{proposal.experienceInEducation || 'Experienced'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Current Business:</span>
                <span className="font-semibold text-slate-800">{proposal.currentBusinessType || 'Educational Center'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Power & Internet:</span>
                <span className="font-semibold text-slate-800">{proposal.internet || 'FTTH Fiber'} · {proposal.powerBackup || 'UPS Backup'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Partnership Plan & Payment Acknowledgment */}
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                  3. Partnership Plan & Payment Acknowledgment
                </h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-800 uppercase bg-indigo-100 px-2 py-0.5 rounded">
                Official Fee Acknowledgment
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium block">Selected Partnership Tier:</span>
                <strong className="text-slate-900 text-sm">{planName}</strong>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Affiliation Fee:</span>
                <strong className="text-sm font-black text-indigo-900">
                  ₹{paidAmount > 0 ? paidAmount.toLocaleString('en-IN') : '15,000'}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Payment Method:</span>
                <strong className="text-xs text-slate-800 font-bold">
                  {payment.paymentMode === 'online_razorpay' ? '⚡ Razorpay Online (UPI/Cards)' : '🏢 Pay Later / Bank Transfer'}
                </strong>
              </div>
            </div>

            {payment.razorpayPaymentId && (
              <div className="pt-2 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-indigo-900">
                <span>Razorpay Payment ID: <strong>{payment.razorpayPaymentId}</strong></span>
                {payment.razorpayOrderId && <span>Order ID: <strong>{payment.razorpayOrderId}</strong></span>}
                <span>Paid At: <strong>{payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : formattedDate}</strong></span>
              </div>
            )}
          </div>

          {/* Section 4: Authorized Deliverables & Terms */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Deliverables & Institutional Privileges Included:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Affiliation Certificate & Center Authorization Code</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>All-in-One CRM Management Software & Partner Portal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Standard Course Curriculum, Offline Syllabus & Lab Exercises</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Online Student Certification & QR Code Instant Verification</span>
              </div>
            </div>
          </div>

          {/* Footer Seals and Signatures */}
          <div className="mt-10 pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1 text-[10px] text-slate-400 max-w-sm">
              <p className="font-semibold text-slate-600">System Generated Document:</p>
              <p>This is an electronically generated and authenticated franchise application slip. It serves as valid proof of application submission.</p>
            </div>

            {/* Official Stamp & Sign */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="w-28 h-12 border-b-2 border-dashed border-slate-400 mb-1 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">Applicant Sign</span>
                </div>
                <span className="text-[10px] font-bold text-slate-700 uppercase">Center Head Signature</span>
              </div>

              <div className="text-center">
                <div className="w-28 h-12 border-2 border-indigo-900 rounded-xl flex items-center justify-center bg-indigo-50/50 mb-1">
                  <span className="text-[9px] font-black text-indigo-900 uppercase tracking-tighter">
                    ✓ VERIFIED SEAL
                  </span>
                </div>
                <span className="text-[10px] font-bold text-indigo-900 uppercase">Authorized Registrar</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer homepageData={orgInfo} />
    </div>
  );
}
