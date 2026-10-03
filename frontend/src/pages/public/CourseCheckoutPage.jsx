import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getStoreCourse, validateCoupon, createOrder, verifyOrder, getPublicPartners, getOrgHomepagePublic } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  ShieldCheck, Lock, CheckCircle2, Tag, ArrowRight, BookOpen,
  CreditCard, QrCode, Building, Award, Clock, ArrowLeft, Sparkles, X,
  Check, HelpCircle, PhoneCall, Headphones, FileText, UserCheck, MapPin,
  Crown, Gift
} from 'lucide-react';

export default function CourseCheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user, loginUser } = useAuth ? useAuth() : { user: null, loginUser: () => {} };
  
  const storedStudent = (() => {
    try {
      return JSON.parse(localStorage.getItem('student_user') || 'null');
    } catch {
      return null;
    }
  })();

  const [course, setCourse] = useState(null);
  const [partners, setPartners] = useState([]);
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: user?.name || storedStudent?.name || '',
    customerEmail: user?.email || storedStudent?.email || '',
    customerPhone: user?.phone || storedStudent?.phone || '',
    customerCity: '',
    customerState: '',
    learningMode: 'online', // 'online' | 'hybrid_offline_lab'
    preferredPartnerCenter: '',
    paymentGateway: 'razorpay', // 'razorpay' | 'upi_qr'
  });

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      getStoreCourse(courseId),
      getPublicPartners().catch(() => ({ data: { partners: [] } })),
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
    ])
      .then(([courseRes, partnersRes, hpRes]) => {
        setCourse(courseRes.data.course);
        setPartners(partnersRes.data?.partners || []);
        setHp(hpRes.data?.homepage || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showError('Course details could not be loaded');
        setLoading(false);
      });
  }, [courseId]);

  const [searchParams, setSearchParams] = useSearchParams();
  const trackParam = searchParams.get('track') || searchParams.get('mode');
  const [selectedTrack, setSelectedTrack] = useState(trackParam === 'free' ? 'free' : (trackParam === 'paid' ? 'paid' : (course?.isFree ? 'free' : 'paid')));

  useEffect(() => {
    if (trackParam === 'free') setSelectedTrack('free');
    else if (trackParam === 'paid') setSelectedTrack('paid');
  }, [trackParam]);

  const isFreeCourse = selectedTrack === 'free';

  const basePrice = course ? (isFreeCourse ? 0 : (course.salePrice > 0 ? course.salePrice : (course.fee > 0 ? course.fee : 1999))) : 0;
  const originalPrice = course ? (isFreeCourse ? 0 : (course.originalPrice > 0 ? course.originalPrice : (course.fee > 0 ? course.fee : 2999))) : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(0, Math.round(basePrice - discountAmount));
  const orgName = hp?.settings?.orgName || 'Lili Organization';

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    try {
      const res = await validateCoupon({
        code: couponInput.trim(),
        amount: basePrice,
        courseId: course._id,
      });

      setAppliedCoupon(res.data.coupon);
      showSuccess(`Coupon applied! ₹${res.data.coupon.discountAmount} saved.`);
      setCouponLoading(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid or expired coupon code');
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleSubmitOrder = async (e) => {
    e?.preventDefault();

    if (!formData.customerName.trim()) {
      return showError('Please enter your full student name for the certificate');
    }
    if (!formData.customerEmail.trim()) {
      return showError('Please enter a valid email address');
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.replace(/\D/g, '').length < 10) {
      return showError('Please enter a valid 10-digit mobile number');
    }

    setSubmitting(true);

    try {
      // 1. Create Pending Order
      const createRes = await createOrder({
        courseId: course._id,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerCity: formData.customerCity.trim(),
        customerState: formData.customerState.trim(),
        learningMode: formData.learningMode,
        preferredPartnerCenter: formData.preferredPartnerCenter || undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentGateway: isFreeCourse ? 'free_enrollment' : formData.paymentGateway,
      });

      const order = createRes.data.order;

      // 2. If Paid and Razorpay gateway selected, trigger Razorpay popup
      if (!isFreeCourse && finalPayable > 0 && formData.paymentGateway === 'razorpay' && window.Razorpay && order.razorpayOrderId) {
        const options = {
          key: order.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
          amount: Math.round(finalPayable * 100),
          currency: 'INR',
          name: orgName,
          description: `Enrollment: ${course.name}`,
          order_id: order.razorpayOrderId,
          prefill: {
            name: formData.customerName,
            email: formData.customerEmail,
            contact: formData.customerPhone,
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response) {
            try {
              const verifyRes = await verifyOrder({
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.auth?.token && verifyRes.data.auth?.user) {
                localStorage.setItem('student_token', verifyRes.data.auth.token);
                localStorage.setItem('student_user', JSON.stringify(verifyRes.data.auth.user));
                if (loginUser) {
                  loginUser({
                    user: verifyRes.data.auth.user,
                    token: verifyRes.data.auth.token,
                  });
                }
              }

              showSuccess('Payment verified successfully! Welcome to your course.');
              setSubmitting(false);

              navigate(`/order-success/${order._id}`, {
                state: {
                  orderData: verifyRes.data.order,
                  authData: verifyRes.data.auth,
                },
              });
            } catch (vErr) {
              console.error(vErr);
              showError(vErr.response?.data?.message || 'Payment verification failed');
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              showError('Payment window closed. Order is saved in pending status.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // 3. Fallback for Free Enrollment or UPI QR confirmation
      const verifyRes = await verifyOrder({
        orderId: order._id,
        transactionId: isFreeCourse 
          ? `FREE-ENROLL-${Date.now()}` 
          : `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentDetails: {
          gateway: isFreeCourse ? 'free_enrollment' : formData.paymentGateway,
          amount: finalPayable,
          method: isFreeCourse ? 'free_direct' : 'instant_transfer',
        },
      });

      if (verifyRes.data.auth?.token && verifyRes.data.auth?.user) {
        localStorage.setItem('student_token', verifyRes.data.auth.token);
        localStorage.setItem('student_user', JSON.stringify(verifyRes.data.auth.user));
        if (loginUser) {
          loginUser({
            user: verifyRes.data.auth.user,
            token: verifyRes.data.auth.token,
          });
        }
      }

      showSuccess(isFreeCourse ? 'Admission confirmed! Welcome to Lili Organization.' : 'Enrollment placed successfully!');
      setSubmitting(false);

      navigate(`/order-success/${order._id}`, {
        state: {
          orderData: verifyRes.data.order,
          authData: verifyRes.data.auth,
        },
      });
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to complete order');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Preparing secure enrollment checkout...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Course Not Found</h2>
        <Link to="/courses" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium">
          Browse All Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <Navbar activePage="courses" />

      {/* Trust Header Bar */}
      <div className="bg-slate-900 text-white py-4 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <Link to={`/courses/${course._id}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Course Overview
          </Link>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted Checkout
            </span>
            <span className="hidden sm:flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> ISO 9001:2015 Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Checkout Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 w-full flex-1">
        
        {/* Track Switcher: Free vs Paid */}
        <div className="mb-6 p-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-2">Select Program Track:</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setSelectedTrack('free'); setSearchParams({ track: 'free' }); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFreeCourse ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> 100% Free Track (₹0)
              </button>
              <button
                type="button"
                onClick={() => { setSelectedTrack('paid'); setSearchParams({ track: 'paid' }); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isFreeCourse ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-amber-950 text-amber-950" /> 👑 Premium Certified Track
              </button>
            </div>
          </div>
          <span className="text-xs text-slate-500 pr-2 hidden md:inline">
            {isFreeCourse ? 'Free LMS video access & assessments' : 'Includes ISO certificate + physical lab access'}
          </span>
        </div>

        {/* Banner if Free Course */}
        {isFreeCourse && (
          <div className="mb-8 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Special Free Scholarship Pass
                </span>
                <h3 className="text-xl font-black mt-0.5">100% Free Course Enrollment (₹0 Fee)</h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Complete the quick admission form below to instantly unlock your student account & LMS portal.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white text-emerald-800 rounded-2xl text-xs font-black shadow-sm">
              FREE ADMISSION
            </div>
          </div>
        )}

        {/* Banner if Paid Pro Certified Course */}
        {!isFreeCourse && (
          <div className="mb-8 p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-amber-950 text-white rounded-3xl shadow-lg border border-amber-400/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  👑 Premium Professional Track
                </span>
                <h3 className="text-xl font-black mt-0.5">Government Recognized & ISO 9001:2015 Certification</h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  Includes QR-verified hardcopy certificate, 50+ partner computer lab practicals & placement support.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-2xl text-xs font-black shadow-sm flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-amber-950" /> PRO CERTIFIED
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Multi-Step Enrollment Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Student Information */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Student & Enrollment Details</h3>
                    <p className="text-xs text-slate-500">Certificate and LMS portal will be generated with these details</p>
                  </div>
                </div>
                {(user || storedStudent) && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5" /> Auto-filled
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Student Name (As needed on Certificate) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (For LMS Login & Notes) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Mobile Number (For Login OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City / District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lucknow, Varanasi, Delhi"
                      value={formData.customerCity}
                      onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={formData.customerState}
                      onChange={(e) => setFormData({ ...formData, customerState: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Learning Delivery Mode */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Learning Mode</h3>
                  <p className="text-xs text-slate-500">Choose between flexible online learning or hybrid physical center practice</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, learningMode: 'online' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.learningMode === 'online'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> 100% Online LMS
                    </span>
                    <input
                      type="radio"
                      checked={formData.learningMode === 'online'}
                      onChange={() => {}}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Study anytime from smartphone/laptop with recorded lectures, online exercises & instant doubt clearing.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, learningMode: 'hybrid_offline_lab' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.learningMode === 'hybrid_offline_lab'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600" /> Hybrid (Online + Center Lab)
                    </span>
                    <input
                      type="radio"
                      checked={formData.learningMode === 'hybrid_offline_lab'}
                      onChange={() => {}}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Online study + offline computer lab access at an authorized partner center for hands-on practice.
                  </p>
                </div>
              </div>

              {/* Partner Center Dropdown if Hybrid */}
              {formData.learningMode === 'hybrid_offline_lab' && partners.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Nearest Authorized Center
                  </label>
                  <select
                    value={formData.preferredPartnerCenter}
                    onChange={(e) => setFormData({ ...formData, preferredPartnerCenter: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Nearest Center --</option>
                    {partners.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.instituteName} ({p.city}, {p.state} - Center Code: {p.centerCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method or Free Enrollment */}
            {isFreeCourse || finalPayable === 0 ? (
              <div className="bg-emerald-50 rounded-3xl p-6 md:p-8 border border-emerald-200 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-950">100% Free Course Activation</h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Zero registration fee required! As soon as you submit, your Student LMS profile will be created and you can immediately begin learning.
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-emerald-900 font-semibold flex-wrap">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant LMS Access</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Free Practice Files</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Student Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Select Payment Method</h3>
                    <p className="text-xs text-slate-500">Secure, encrypted transactions with instant confirmation</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    onClick={() => setFormData({ ...formData, paymentGateway: 'razorpay' })}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentGateway === 'razorpay'
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">Razorpay Secure Gateway</div>
                        <div className="text-xs text-slate-500">Credit/Debit Cards, UPI, NetBanking, Paytm, PhonePe, Wallets</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentGateway"
                      checked={formData.paymentGateway === 'razorpay'}
                      onChange={() => setFormData({ ...formData, paymentGateway: 'razorpay' })}
                      className="text-indigo-600"
                    />
                  </label>

                  <label
                    onClick={() => setFormData({ ...formData, paymentGateway: 'upi_qr' })}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentGateway === 'upi_qr'
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">Instant UPI Direct Scan</div>
                        <div className="text-xs text-slate-500">Instant activation via BHIM UPI, GPay, PhonePe</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentGateway"
                      checked={formData.paymentGateway === 'upi_qr'}
                      onChange={() => setFormData({ ...formData, paymentGateway: 'upi_qr' })}
                      className="text-indigo-600"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Satisfaction Guarantee Badge */}
            <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                <strong>Official Admission Promise:</strong> Your registration includes instant enrollment receipt, student ID card, and verifiable certificate issuance upon completion.
              </span>
            </div>

          </div>

          {/* Right Column: Sticky Order Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-20">
            
            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Enrollment Summary
              </h3>

              {/* Course details mini card */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-1 ${
                    isFreeCourse ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {!isFreeCourse && <Crown className="w-3 h-3 fill-amber-900" />}
                    {isFreeCourse ? 'Free Track' : 'Pro Certification'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 truncate">{course.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{course.duration || '3 Months'}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">{course.code || 'LILI-EDU'}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Applicator (Only for Paid Courses) */}
              {!isFreeCourse && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Have a Promo / Discount Coupon?
                  </label>

                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>{appliedCoupon.code} applied (-₹{appliedCoupon.discountAmount})</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. SKILL50, WELCOME2026"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 uppercase bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {!appliedCoupon && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Use coupon:</span>
                      <button
                        type="button"
                        onClick={() => { setCouponInput('SKILL50'); }}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        SKILL50
                      </button>
                      <span>or</span>
                      <button
                        type="button"
                        onClick={() => { setCouponInput('WELCOME2026'); }}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        WELCOME2026
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Price Calculation Ledger */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-sm">
                {isFreeCourse ? (
                  <>
                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>Standard Tuition Fee</span>
                      <span className="line-through text-slate-400">₹2,999</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                      <span>Free Scholarship Grant</span>
                      <span>-₹2,999</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base font-black text-slate-900">
                      <span>Total Amount Payable</span>
                      <span className="text-2xl font-black text-emerald-600">
                        ₹0 (FREE)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>Course Original Fee</span>
                      <span className="line-through text-slate-400">₹{originalPrice.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>Special Institutional Discount</span>
                      <span className="text-emerald-600 font-semibold">
                        -₹{(originalPrice - basePrice).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                        <span>Coupon Savings ({appliedCoupon.code})</span>
                        <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600 text-xs">
                      <span>Digital QR Certificate & LMS Access</span>
                      <span className="text-emerald-600 font-bold">INCLUDED</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base font-black text-slate-900">
                      <span>Total Amount Payable</span>
                      <span className="text-2xl font-black text-indigo-900">
                        ₹{finalPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Complete Order Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className={`w-full py-4 px-6 text-white text-center font-bold text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group cursor-pointer ${
                  isFreeCourse
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isFreeCourse ? 'Confirming Free Admission...' : 'Processing Payment...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isFreeCourse
                        ? 'Confirm Free Enrollment (निःशुल्क प्रवेश लें)'
                        : `Pay ₹${finalPayable.toLocaleString('en-IN')} & Complete Enrollment`}
                    </span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Trust badges footer */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Immediate access to student LMS dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>GST Tax Invoice & Admission confirmation generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>ISO 9001:2015 recognized course completion certificate</span>
                </div>
              </div>

            </div>

            {/* Need Help Box */}
            <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Headphones className="w-4 h-4 text-indigo-600" />
                <span>Need help with enrollment?</span>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-enquiry', { detail: { service: course.name } }))}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Contact Support
              </button>
            </div>

          </div>

        </div>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
