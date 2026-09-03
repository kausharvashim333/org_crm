import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrgHomepagePublic, applyPartner, createFranchiseOrder, checkPartnerEmail } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Sparkles, Send, Mail, Check, ArrowLeft, Building2, User, MapPin, Laptop, Briefcase, HelpCircle,
  Award, Zap, Crown, CreditCard, ShieldCheck, CheckCircle2, IndianRupee, AlertCircle, FileText
} from 'lucide-react';

export default function PartnerApplyPage() {
  const [searchParams] = useSearchParams();
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const queryPlan = searchParams.get('plan') || '';

  // Detailed application form states
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [paymentMode, setPaymentMode] = useState('online_razorpay'); // 'online_razorpay' | 'offline_pay_later'
  const [submittedData, setSubmittedData] = useState(null);

  const [formData, setFormData] = useState({
    instituteName: '',
    name: '',
    email: '',
    phone: '',
    profession: '',
    qualification: '',
    idProof: '',
    state: 'Chhattisgarh',
    city: '',
    pincode: '',
    address: '',
    ownership: 'Rented',
    floorLevel: 'Ground Floor',
    spaceSqFt: '',
    computers: '',
    internet: 'FTTH Fiber',
    powerBackup: 'Inverter & UPS',
    experience: '',
    investment: '₹1,00,000 - ₹2,00,000',
    timeline: 'Within 1 Month',
    expectedAdmissions: '25 - 50 students',
    
    // Partnership Plan field
    partnershipPlan: queryPlan || '',
    partnershipType: 'Partner Center',
    interestedVerticals: [],
    currentBusinessType: 'Existing Institute/School',
    experienceInEducation: 'No Experience',
    hearAboutUs: 'Google/Website',
    organizationName: '',
    institutionType: 'Academy',

    // Detailed Questionnaire Fields
    currentOccupation: '',
    relevantExperienceYears: '',
    teamSize: '',
    centerClassification: 'District Skill Center',
    proposedCenterName: '',
    nearestLandmark: '',
    premisesType: 'commercial',
    totalCarpetArea: '',
    cctvInstalled: 'Yes',
    drinkingWaterToilet: 'Yes',
    classroomCount: '',
    preferredCourses: '',
    labEquipments: '',
    hospitalTieUp: '',
    medicalStaffCount: '',
    internetSpeed: '',
    itInstructor: '',
    yogaMatsCount: '',
    yogaHallArea: '',
    certifiedInstructor: '',
    projectorAvailable: 'Yes',
    tradingTerminalsCount: '',
    seatingCapacity: '',
    facultyExperience: '',
    govtRegNo: '',
    pastPlacementDetails: '',
    biometricSystem: 'Yes',

    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    gstNumber: '',
  });

  const defaultPlans = [
    { name: 'Silver - Authorized Study Center', badge: 'Starter Center', fee: 15000, originalFee: 25000, royaltyPercentage: 'Zero Monthly Royalty', certificateShare: '₹150 / Student', isActive: true },
    { name: 'Gold - Master District Franchise', badge: 'Most Popular', fee: 35000, originalFee: 55000, royaltyPercentage: 'Zero Monthly Royalty', certificateShare: '₹100 / Student', isActive: true },
    { name: 'Platinum - State Skill Hub', badge: 'Enterprise', fee: 75000, originalFee: 125000, royaltyPercentage: 'Zero Monthly Royalty', certificateShare: '₹75 / Student', isActive: true },
  ];

  const availablePlans = (hp?.franchise?.plans && hp.franchise.plans.length > 0)
    ? hp.franchise.plans.filter(p => p.isActive !== false)
    : defaultPlans;

  const selectedPlanObj = availablePlans.find(p => p.name === formData.partnershipPlan)
    || (queryPlan ? availablePlans.find(p => p.name.toLowerCase().includes(queryPlan.toLowerCase()) || queryPlan.toLowerCase().includes(p.name.toLowerCase())) : null)
    || availablePlans[0];

  const planFee = selectedPlanObj?.fee !== undefined ? selectedPlanObj.fee : 15000;

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => {
        setHp(res.data.homepage);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!formData.partnershipPlan && selectedPlanObj) {
      setFormData(prev => ({ ...prev, partnershipPlan: selectedPlanObj.name }));
    }
  }, [hp, queryPlan]);

  const handleEmailBlur = async () => {
    const email = (formData.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    setCheckingEmail(true);
    try {
      const res = await checkPartnerEmail(email);
      if (res.data?.available === false) {
        setEmailError(res.data.message || 'This email is already registered.');
      } else {
        setEmailError('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingEmail(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  );

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const contact = hp?.contact || {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmailError('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (vertical) => {
    setFormData(prev => {
      const current = prev.interestedVerticals || [];
      const next = current.includes(vertical)
        ? current.filter(v => v !== vertical)
        : [...current, vertical];
      return { ...prev, interestedVerticals: next };
    });
  };

  const isFormValid = () => {
    if (emailError || checkingEmail) return false;
    const baseValid =
      formData.instituteName.trim() &&
      formData.name.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.state.trim() &&
      formData.city.trim() &&
      formData.pincode.trim() &&
      formData.spaceSqFt.trim() &&
      formData.qualification.trim();

    if (!baseValid) return false;
    if (!formData.interestedVerticals || formData.interestedVerticals.length === 0) return false;

    // Validate organizationName if institutional type
    if (['Skill Development Projects', 'Paramedical Training'].includes(formData.institutionType)) {
      if (!formData.organizationName.trim()) return false;
    }

    // Specific validation based on institution type
    switch (formData.institutionType) {
      case 'Academy':
        return formData.classroomCount.trim() && formData.preferredCourses.trim();
      case 'Paramedical Training':
        return formData.labEquipments.trim() && formData.hospitalTieUp.trim() && formData.medicalStaffCount.trim();
      case 'Computer & IT Training':
        return formData.computers.trim() && formData.itInstructor.trim();
      case 'Health & Yoga Training':
        return formData.yogaMatsCount.trim() && formData.yogaHallArea.trim() && formData.certifiedInstructor.trim();
      case 'Stock Market & Finance':
        return formData.tradingTerminalsCount.trim();
      case 'CGPSC & CGVYAPAM Preparation':
        return formData.seatingCapacity.trim() && formData.facultyExperience.trim();
      case 'Skill Development Projects':
        return formData.govtRegNo.trim() && formData.pastPlacementDetails.trim();
      default:
        return true;
    }
  };

  const performApplicationSubmit = async (paymentData = {}) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const mode = paymentData.paymentMode || paymentMode;
      const payload = {
        ...formData,
        partnershipPlan: selectedPlanObj?.name || formData.partnershipPlan || 'Authorized Partner Plan',
        paymentMode: mode,
        paidAmount: paymentData.paidAmount !== undefined ? paymentData.paidAmount : (mode === 'online_razorpay' ? planFee : 0),
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
      };

      const res = await applyPartner(payload);
      setSubmitted(true);
      setSubmittedData({
        ...formData,
        franchiseId: res.data.franchiseId,
        paymentStatus: res.data.paymentStatus,
        paidAmount: res.data.paidAmount,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        planName: selectedPlanObj?.name || formData.partnershipPlan,
        planFee: planFee,
      });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    if (paymentMode === 'online_razorpay' && window.Razorpay && planFee > 0) {
      setSubmitting(true);
      setSubmitError('');
      try {
        const orderRes = await createFranchiseOrder({
          planName: selectedPlanObj?.name || formData.partnershipPlan || 'Partnership Plan',
          feeAmount: planFee,
          instituteName: formData.instituteName,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });

        const rzpData = orderRes.data;

        const options = {
          key: rzpData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
          amount: Math.round(planFee * 100),
          currency: 'INR',
          name: hp?.settings?.orgName || 'Franchise Partner Network',
          description: `Affiliation Fee: ${selectedPlanObj?.name || 'Partnership Plan'}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response) {
            await performApplicationSubmit({
              paymentMode: 'online_razorpay',
              paidAmount: planFee,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              setSubmitError('Online payment window was closed. You can retry or choose Pay Later.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        setSubmitError('Could not initialize online payment. Please choose Pay Later or retry.');
        setSubmitting(false);
      }
    } else {
      await performApplicationSubmit({ paymentMode: 'offline_pay_later' });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        <Navbar />

        <div className="max-w-4xl mx-auto py-12 px-6">
          {/* Back to Info Page */}
          <button 
            onClick={() => navigate('/franchise')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Partnership Info
          </button>

          <div className="bg-white rounded-3xl border border-slate-200/85 shadow-xl overflow-hidden">
            {/* Header banner */}
            <div className="p-8 text-white text-center relative" style={{ backgroundColor: themeColor }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto animate-pulse" />
                <h3 className="text-2xl md:text-3xl font-black">Partnership & Franchise Application</h3>
                <p className="text-sm opacity-90">Apply for institutional affiliation, course curriculum & CRM management portal</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-8">
              {submitted ? (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <Check className="w-10 h-10" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black text-slate-800">
                      {submittedData?.paymentStatus === 'paid'
                        ? '🎉 Affiliation Fee Paid & Application Submitted!'
                        : 'Application Submitted Successfully!'}
                    </h4>
                    <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      {submittedData?.paymentStatus === 'paid'
                        ? `Aapka ₹${submittedData.paidAmount?.toLocaleString('en-IN')} ka affiliation payment verify ho chuka hai. Franchise center ID generate kar di gayi hai.`
                        : 'Aapka partnership application safaltapoorvak submit ho gaya hai aur Admin Panel me approval ke liye bhej diya gaya hai.'}
                    </p>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-2.5 text-xs text-slate-700 mt-4 shadow-sm">
                      <p className="font-bold text-slate-900 border-b pb-2 mb-2 flex items-center justify-between">
                        <span>Application Summary:</span>
                        {submittedData?.franchiseId && (
                          <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {submittedData.franchiseId}
                          </span>
                        )}
                      </p>
                      <p><span className="font-medium text-slate-500">Institute Name:</span> <strong className="text-slate-900">{formData.instituteName}</strong></p>
                      <p><span className="font-medium text-slate-500">Applicant Name:</span> {formData.name}</p>
                      <p><span className="font-medium text-slate-500">Partnership Plan:</span> <strong className="text-indigo-900">{submittedData?.planName || formData.partnershipPlan}</strong></p>
                      <p><span className="font-medium text-slate-500">Mobile Number:</span> {formData.phone}</p>
                      <p><span className="font-medium text-slate-500">Location:</span> {formData.city}, {formData.state}</p>
                      
                      <div className="pt-2 border-t mt-2 flex items-center justify-between">
                        <span className="font-medium text-slate-500">Payment Status:</span>
                        {submittedData?.paymentStatus === 'paid' ? (
                          <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3" /> PAID ONLINE (₹{submittedData.paidAmount})
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                            PAY LATER / PENDING
                          </span>
                        )}
                      </div>

                      {submittedData?.razorpayPaymentId && (
                        <p className="text-[10px] text-slate-400 font-mono pt-1 truncate">
                          Txn ID: {submittedData.razorpayPaymentId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    {submittedData?.franchiseId && (
                      <button
                        onClick={() => navigate(`/franchise/receipt/${submittedData.franchiseId}`)}
                        className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-xl hover:scale-102 flex items-center gap-2 justify-center cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> View & Print Franchise Receipt →
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/')}
                      className="px-8 py-3.5 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-102 flex items-center gap-2 justify-center"
                      style={{ backgroundColor: themeColor }}
                    >
                      Go to Home
                    </button>
                    <button
                      onClick={() => navigate('/franchise')}
                      className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                    >
                      Back to Partnership Info
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-8">
                  {submitError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl">
                      {submitError}
                    </div>
                  )}

                  {/* Section 0: Select Partnership Plan */}
                  {availablePlans.length > 0 && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-slate-50 border-2 border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-600" /> Choose Your Partnership Plan
                        </h4>
                        <span className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                          {availablePlans.length} Plans Available
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {availablePlans.map((p, pIdx) => {
                          const isSelected = (formData.partnershipPlan && formData.partnershipPlan === p.name)
                            || (!formData.partnershipPlan && selectedPlanObj?.name === p.name);
                          return (
                            <div
                              key={pIdx}
                              onClick={() => setFormData(prev => ({ ...prev, partnershipPlan: p.name }))}
                              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                                isSelected
                                  ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-200'
                                  : 'border-slate-200 bg-white/70 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <strong className="text-xs font-black text-slate-900 truncate">{p.name}</strong>
                                  {p.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-base font-black text-indigo-700 block">₹{p.fee?.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-slate-500 font-semibold block">{p.royaltyPercentage}</span>
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Cost: {p.certificateShare}</span>
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                  {isSelected ? '✓ Selected' : 'Select'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Section 1: Contact Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <User className="w-5 h-5" style={{ color: themeColor }} />
                      <h4 className="font-bold text-slate-800 text-base">1. Applicant Personal Profile</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Institute Name *</label>
                        <input
                          type="text"
                          required
                          name="instituteName"
                          value={formData.instituteName}
                          onChange={handleInputChange}
                          placeholder="e.g. Skill India Computer Academy"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                        <input
                          type="text"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder={
                            ['Skill Development Projects', 'Paramedical Training'].includes(formData.institutionType)
                              ? 'e.g. Rahul Kumar (Director / Center Head)'
                              : 'e.g. Rahul Kumar'
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Email Address *</span>
                          {checkingEmail && <span className="text-[10px] text-indigo-600 font-bold">Verifying email...</span>}
                        </label>
                        <input
                          type="email"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={handleEmailBlur}
                          placeholder="e.g. rahul@example.com"
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all text-slate-850 ${
                            emailError ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500 focus:bg-white'
                          }`}
                        />
                        {emailError && (
                          <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700 font-bold">
                            <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" /> {emailError}</span>
                            <a href="/partner/login" className="underline text-indigo-600 font-black">Login Here →</a>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                    </div>

                    <div>
                      {['Skill Development Projects', 'Paramedical Training'].includes(formData.institutionType) ? (
                        <>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Organization / Trust / Society Name *</label>
                          <input
                            type="text"
                            required
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleInputChange}
                            placeholder="e.g. Skill India Foundation"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Profession / Business</label>
                          <input
                            type="text"
                            name="profession"
                            value={formData.profession}
                            onChange={handleInputChange}
                            placeholder="e.g. Computer Teacher, Training Owner"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                          />
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Highest Educational Qualification *</label>
                      <input
                        type="text"
                        required
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleInputChange}
                        placeholder={
                          ['Skill Development Projects', 'Paramedical Training'].includes(formData.institutionType)
                            ? 'e.g. MCA, MBA, PhD (of Center Head)'
                            : 'e.g. MCA, B.Tech, M.A.'
                        }
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Section 2: Location Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                      <h4 className="font-bold text-slate-800 text-base">2. Proposed Center Location & Property</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed State *</label>
                        <select
                          required
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          {[
                            'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
                            'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
                            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
                            'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
                            'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
                            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
                            'Uttarakhand', 'West Bengal'
                          ].map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed City/Town *</label>
                        <input
                          type="text"
                          required
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="e.g. Patna"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pin Code *</label>
                        <input
                          type="text"
                          required
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="e.g. 800001"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Property Ownership Status</label>
                        <select
                          name="ownership"
                          value={formData.ownership}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="Owned">Self-Owned Property</option>
                          <option value="Rented">Rented Space</option>
                          <option value="Leased">Leased / Partnership Property</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Building Floor Level</label>
                        <select
                          name="floorLevel"
                          value={formData.floorLevel}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="Ground Floor">Ground Floor</option>
                          <option value="First Floor">1st Floor</option>
                          <option value="Second Floor">2nd Floor</option>
                          <option value="Higher Floor">3rd Floor or Higher</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complete Center Address</label>
                      <textarea
                        rows="2.5"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Complete building details, landmark details, street number..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Section 3: Dynamic Setup Header */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Laptop className="w-5 h-5" style={{ color: themeColor }} />
                      <h4 className="font-bold text-slate-800 text-base">
                        {['Computer & IT Training', 'Paramedical Training'].includes(formData.institutionType) && '3. Lab Infrastructure & Utilities'}
                        {formData.institutionType === 'Health & Yoga Training' && '3. Yoga Center Setup & Utilities'}
                        {['CGPSC & CGVYAPAM Preparation', 'Stock Market & Finance'].includes(formData.institutionType) && '3. Coaching & Classroom Setup'}
                        {['Academy', 'Skill Development Projects'].includes(formData.institutionType) && '3. Academic & Training Setup'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Institution Type *</label>
                        <select
                          name="institutionType"
                          value={formData.institutionType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850 font-bold"
                        >
                          <option value="Academy">Academy</option>
                          <option value="Paramedical Training">Paramedical Training</option>
                          <option value="Computer & IT Training">Computer & IT Training</option>
                          <option value="Health & Yoga Training">Health & Yoga Training</option>
                          <option value="Stock Market & Finance">Stock Market & Finance</option>
                          <option value="CGPSC & CGVYAPAM Preparation">CGPSC & CGVYAPAM Preparation</option>
                          <option value="Skill Development Projects">Skill Development Projects</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Classroom/Lab Space (Sq Ft) *</label>
                        <input
                          type="number"
                          required
                          name="spaceSqFt"
                          value={formData.spaceSqFt}
                          onChange={handleInputChange}
                          placeholder={
                            formData.institutionType === 'Health & Yoga Training'
                              ? 'e.g. 300 (Yoga Studio Space)'
                              : ['CGPSC & CGVYAPAM Preparation', 'Stock Market & Finance'].includes(formData.institutionType)
                              ? 'e.g. 600 (Classroom/Library Space)'
                              : 'e.g. 500 (Total Lab/Classroom Area)'
                          }
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        />
                      </div>
                    </div>



                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Previous Training Center Experience (Optional)</label>
                      <textarea
                        rows="2"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="Describe any education or training center operations experience..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                      />
                    </div>

                    {/* Dynamic Fields Section */}
                    <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-4">
                      <h5 className="text-xs font-black uppercase tracking-wider text-indigo-650 mb-2">
                        Specific Details Required for: {formData.institutionType}
                      </h5>

                      {formData.institutionType === 'Academy' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number of Classrooms *</label>
                            <input
                              type="number"
                              required
                              name="classroomCount"
                              value={formData.classroomCount}
                              onChange={handleInputChange}
                              placeholder="e.g. 3"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Courses / Streams *</label>
                            <input
                              type="text"
                              required
                              name="preferredCourses"
                              value={formData.preferredCourses}
                              onChange={handleInputChange}
                              placeholder="e.g. DCA, Paramedical Diploma, Spoken English, Academy programs"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'Paramedical Training' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructors / Medical Staff Count *</label>
                            <input
                              type="number"
                              required
                              name="medicalStaffCount"
                              value={formData.medicalStaffCount}
                              onChange={handleInputChange}
                              placeholder="e.g. 3"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hospital Tie-up Details *</label>
                            <input
                              type="text"
                              required
                              name="hospitalTieUp"
                              value={formData.hospitalTieUp}
                              onChange={handleInputChange}
                              placeholder="e.g. Govt District Hospital / Jeevan Hospital Raipur"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Lab Equipments *</label>
                            <textarea
                              rows="2"
                              required
                              name="labEquipments"
                              value={formData.labEquipments}
                              onChange={handleInputChange}
                              placeholder="e.g. Microscopes, Autoclave, BP Monitors, First Aid kits"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'Computer & IT Training' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Computers Available *</label>
                            <input
                              type="number"
                              required
                              name="computers"
                              value={formData.computers}
                              onChange={handleInputChange}
                              placeholder="e.g. 15"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Internet Speed (Mbps)</label>
                            <input
                              type="number"
                              name="internetSpeed"
                              value={formData.internetSpeed}
                              onChange={handleInputChange}
                              placeholder="e.g. 100 (Optional)"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IT Instructor Qualification / Profile *</label>
                            <input
                              type="text"
                              required
                              name="itInstructor"
                              value={formData.itInstructor}
                              onChange={handleInputChange}
                              placeholder="e.g. MCA with 2 years web development teaching experience"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'Health & Yoga Training' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yoga Practice Hall Area (Sq Ft) *</label>
                            <input
                              type="number"
                              required
                              name="yogaHallArea"
                              value={formData.yogaHallArea}
                              onChange={handleInputChange}
                              placeholder="e.g. 400"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yoga Mats Available *</label>
                            <input
                              type="number"
                              required
                              name="yogaMatsCount"
                              value={formData.yogaMatsCount}
                              onChange={handleInputChange}
                              placeholder="e.g. 20"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Certified Instructor Details *</label>
                            <input
                              type="text"
                              required
                              name="certifiedInstructor"
                              value={formData.certifiedInstructor}
                              onChange={handleInputChange}
                              placeholder="e.g. MA in Yoga Sciences / Certified Wellness Coach"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'Stock Market & Finance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Projector / Smart Display available *</label>
                            <select
                              name="projectorAvailable"
                              value={formData.projectorAvailable}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            >
                              <option value="Yes">Yes, available</option>
                              <option value="No">No, standard blackboard/whiteboard only</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trading Screens / Terminals Count *</label>
                            <input
                              type="number"
                              required
                              name="tradingTerminalsCount"
                              value={formData.tradingTerminalsCount}
                              onChange={handleInputChange}
                              placeholder="e.g. 5"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'CGPSC & CGVYAPAM Preparation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Study Hall Seating Capacity *</label>
                            <input
                              type="number"
                              required
                              name="seatingCapacity"
                              value={formData.seatingCapacity}
                              onChange={handleInputChange}
                              placeholder="e.g. 50"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Subject Experts / Faculty Details *</label>
                            <input
                              type="text"
                              required
                              name="facultyExperience"
                              value={formData.facultyExperience}
                              onChange={handleInputChange}
                              placeholder="e.g. 2 permanent trainers with CGPSC Mains experience"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}

                      {formData.institutionType === 'Skill Development Projects' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Government / NGO Registration No *</label>
                            <input
                              type="text"
                              required
                              name="govtRegNo"
                              value={formData.govtRegNo}
                              onChange={handleInputChange}
                              placeholder="e.g. Society Act Reg No / NGO Darpan ID"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Biometric Attendance Machine *</label>
                            <select
                              name="biometricSystem"
                              value={formData.biometricSystem}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            >
                              <option value="Yes">Yes, installed</option>
                              <option value="No">No biometric setup</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Brief Placement / Employment Record *</label>
                            <textarea
                              rows="2"
                              required
                              name="pastPlacementDetails"
                              value={formData.pastPlacementDetails}
                              onChange={handleInputChange}
                              placeholder="Describe your center's connection with local employers or past placement records..."
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-850"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Partnership Details & Profile */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <HelpCircle className="w-5 h-5" style={{ color: themeColor }} />
                      <h4 className="font-bold text-slate-800 text-base">4. Partnership Preferences & Background</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Partnership Type *</label>
                        <select
                          name="partnershipType"
                          value={formData.partnershipType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="Partner Center">Partner Center</option>
                          <option value="Training Partner">Training Partner</option>
                          <option value="Exam Center">Exam Center</option>
                          <option value="Skill Development Center">Skill Development Center</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Business Type *</label>
                        <select
                          name="currentBusinessType"
                          value={formData.currentBusinessType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="Existing Institute/School">Existing Institute / School</option>
                          <option value="Coaching Center">Coaching Center</option>
                          <option value="New Entrepreneur">New Entrepreneur</option>
                          <option value="NGO/Trust">NGO / Trust</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Experience in Education Industry *</label>
                        <select
                          name="experienceInEducation"
                          value={formData.experienceInEducation}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="No Experience">No prior experience in education</option>
                          <option value="1-3 Years">1 - 3 Years of experience</option>
                          <option value="3-5 Years">3 - 5 Years of experience</option>
                          <option value="5+ Years">More than 5 years of experience</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How did you hear about us? *</label>
                        <select
                          name="hearAboutUs"
                          value={formData.hearAboutUs}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-850"
                        >
                          <option value="Google/Website">Google Search / Website</option>
                          <option value="Social Media">Social Media (Facebook, Instagram, YouTube)</option>
                          <option value="Friend/Referral">Friend or Referral recommendation</option>
                          <option value="Advertisement">Newspaper / Banner advertisement</option>
                          <option value="Other">Other sources</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Interested Training Verticals (Select all that apply) *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        {[
                          'Paramedical Training',
                          'Computer Education',
                          'Government Skill Projects',
                          'Stock Market & Trading'
                        ].map((v) => {
                          const isChecked = formData.interestedVerticals?.includes(v);
                          return (
                            <label key={v} className="flex items-center gap-3 cursor-pointer text-slate-700 font-semibold text-sm">
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={() => handleCheckboxChange(v)}
                                className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500/20"
                              />
                              {v}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>



                  {/* Section 5: Affiliation Fee & Payment Selection */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border-2 border-indigo-100/90 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            Franchise Affiliation & Setup Fee
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Selected Plan: <strong className="text-indigo-900">{selectedPlanObj?.name || formData.partnershipPlan}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right bg-white px-4 py-2 rounded-2xl border border-indigo-100 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payable Setup Fee</span>
                        <strong className="text-2xl font-black text-indigo-700">₹{planFee?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Option A: Razorpay Online Payment */}
                      <label
                        onClick={() => setPaymentMode('online_razorpay')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMode === 'online_razorpay'
                            ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              paymentMode === 'online_razorpay' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                            }`}>
                              {paymentMode === 'online_razorpay' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <strong className="text-xs sm:text-sm font-black text-slate-900">⚡ Online Payment (Instant)</strong>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                            UPI / QR / Cards
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pl-6">
                          Pay ₹{planFee?.toLocaleString('en-IN')} setup fee instantly via Google Pay, PhonePe, Paytm QR code or Cards. Instant verified receipt.
                        </p>
                      </label>

                      {/* Option B: Pay Later / Bank Transfer */}
                      <label
                        onClick={() => setPaymentMode('offline_pay_later')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMode === 'offline_pay_later'
                            ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              paymentMode === 'offline_pay_later' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                            }`}>
                              {paymentMode === 'offline_pay_later' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <strong className="text-xs sm:text-sm font-black text-slate-900">🏢 Pay Later / Bank Transfer</strong>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Offline
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pl-6">
                          Submit your application first. Deposit the fee via Bank NEFT / RTGS after document review and counseling.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium">
                      By submitting, you agree to our institutional guidelines and partnership terms.
                    </p>

                    <button
                      type="submit"
                      disabled={!isFormValid() || submitting}
                      className="w-full sm:w-auto px-10 py-4 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black text-sm inline-flex items-center gap-2 transition-all shadow-xl hover:scale-102 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing Application...
                        </>
                      ) : paymentMode === 'online_razorpay' ? (
                        <>
                          <Zap className="w-5 h-5" /> Pay ₹{planFee?.toLocaleString('en-IN')} & Submit Application
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> Submit Application (Pay Later)
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
