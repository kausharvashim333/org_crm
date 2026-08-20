import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStoreCourse, validateCoupon, createOrder, verifyOrder, getPublicPartners } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import {
  ShieldCheck, Lock, CheckCircle2, Tag, ArrowRight, BookOpen,
  CreditCard, QrCode, Building, Award, Clock, ArrowLeft, Sparkles, X
} from 'lucide-react';

export default function CourseCheckoutPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user, loginUser } = useAuth ? useAuth() : { user: null, loginUser: () => {} };

  const [course, setCourse] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    customerCity: '',
    customerState: '',
    learningMode: 'online', // 'online' | 'hybrid_offline_lab'
    preferredFranchiseCenter: '',
    paymentGateway: 'upi_qr', // 'upi_qr' | 'razorpay' | 'mock_gateway'
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
    ])
      .then(([courseRes, partnersRes]) => {
        setCourse(courseRes.data.course);
        setPartners(partnersRes.data?.partners || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showError('Course details could not be loaded');
        setLoading(false);
      });
  }, [courseId]);

  const basePrice = course ? (course.salePrice > 0 ? course.salePrice : (course.fee || 1999)) : 0;
  const originalPrice = course ? (course.originalPrice > 0 ? course.originalPrice : (course.fee || 2999)) : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPayable = Math.max(0, Math.round(basePrice - discountAmount));

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
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
    e.preventDefault();

    if (!formData.customerName.trim()) {
      return showError('Please enter your full name');
    }
    if (!formData.customerEmail.trim()) {
      return showError('Please enter a valid email address');
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length < 10) {
      return showError('Please enter a valid 10-digit mobile number');
    }

    setSubmitting(true);

    try {
      // 1. Create Pending Order
      const createRes = await createOrder({
        courseId: course._id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerCity: formData.customerCity,
        customerState: formData.customerState,
        learningMode: formData.learningMode,
        preferredFranchiseCenter: formData.preferredFranchiseCenter || undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentGateway: formData.paymentGateway,
      });

      const order = createRes.data.order;

      // 2. If Razorpay is enabled and amount > 0, open native Razorpay popup
      if (finalPayable > 0 && window.Razorpay && order.razorpayOrderId) {
        const options = {
          key: order.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
          amount: Math.round(finalPayable * 100),
          currency: 'INR',
          name: 'Skill India Training Network',
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

              showSuccess('Payment verified successfully! Enrolled into course.');
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

      // 3. Fallback for 100% discount or offline simulation
      const verifyRes = await verifyOrder({
        orderId: order._id,
        transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentDetails: {
          gateway: formData.paymentGateway || 'free_enrollment',
          amount: finalPayable,
          method: 'instant',
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

      showSuccess('Order placed successfully! Enrolled into course.');
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
          <p className="text-sm font-medium text-slate-300">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <Navbar activePage="courses" />

      {/* Header bar */}
      <div className="bg-slate-900 text-white py-6 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={`/courses/${course._id}`} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted & Secure Checkout
          </div>
        </div>
      </div>

      {/* Main Checkout Area */}
      <div className="max-w-6xl mx-auto px-4 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form & Payment (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Student Information */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Student & Enrollment Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name (As you want on Certificate) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (For LMS Login) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lucknow / Delhi"
                      value={formData.customerCity}
                      onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Learning Mode & Hybrid Franchise Option */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Choose Your Learning Mode</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, learningMode: 'online' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.learningMode === 'online'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">⚡ 100% Online LMS</span>
                    <input
                      type="radio"
                      checked={formData.learningMode === 'online'}
                      onChange={() => {}}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Learn at your own pace from home with lifetime video lectures and online quizzes.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, learningMode: 'hybrid_offline_lab' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.learningMode === 'hybrid_offline_lab'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">🏢 Hybrid (Online + Lab)</span>
                    <input
                      type="radio"
                      checked={formData.learningMode === 'hybrid_offline_lab'}
                      onChange={() => {}}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Online videos + physical lab practicals & teacher guidance at nearest franchise center.
                  </p>
                </div>
              </div>

              {/* Franchise Center Dropdown if Hybrid */}
              {formData.learningMode === 'hybrid_offline_lab' && partners.length > 0 && (
                <div className="pt-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select Nearest Franchise Computer Center
                  </label>
                  <select
                    value={formData.preferredFranchiseCenter}
                    onChange={(e) => setFormData({ ...formData, preferredFranchiseCenter: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Nearest Center --</option>
                    {partners.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.instituteName} ({p.city}, {p.state} - Code: {p.centerCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Select Payment Method</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Instant UPI & QR Code / NetBanking</div>
                      <div className="text-xs text-slate-500">Google Pay, PhonePe, Paytm, BHIM UPI</div>
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

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Credit / Debit Card (Visa, Mastercard, RuPay)</div>
                      <div className="text-xs text-slate-500">Secure card payment gateway</div>
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
              </div>

            </div>

          </div>

          {/* Right Column: Order Summary & Coupon (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            
            {/* Order Summary Box */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-lg space-y-6">
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              {/* Course details mini badge */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{course.name}</h4>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{course.duration || '3 Months'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">{course.level || 'All Levels'}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Applicator */}
              <div className="pt-2">
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
                      className="text-slate-400 hover:text-rose-600 p-1"
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
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}

                {/* Popular Coupons Hint */}
                {!appliedCoupon && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Try code:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('SKILL50')}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      SKILL50
                    </button>
                    <span>or</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('WELCOME2026')}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      WELCOME2026
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculation Ledger */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Course Original Fee</span>
                  <span className="line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Special Institute Discount</span>
                  <span className="text-emerald-600 font-semibold">
                    -₹{(originalPrice - basePrice).toLocaleString('en-IN')}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Digital QR Certificate & GST</span>
                  <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base font-black text-slate-900">
                  <span>Total Amount Payable</span>
                  <span className="text-2xl font-black text-indigo-900">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Complete Order Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-center font-bold text-base rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Enrollment...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Order & Start Learning</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Trust badges footer */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant student account activation & login upon payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>GST Tax Invoice & admission confirmation receipt included</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
