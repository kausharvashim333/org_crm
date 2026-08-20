import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getOrderInvoice } from '../../api';
import Navbar from '../../components/Navbar';
import {
  CheckCircle2, Download, Printer, ArrowRight, BookOpen,
  Award, ShieldCheck, FileText, Sparkles, User, Key, Mail, Phone, MapPin
} from 'lucide-react';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.orderData || null);
  const [authData, setAuthData] = useState(location.state?.authData || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!order && orderId) {
      getOrderInvoice(orderId)
        .then((res) => {
          setOrder(res.data.order);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Generating your admission invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Not Found</h2>
        <Link to="/courses" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium">
          Browse Courses
        </Link>
      </div>
    );
  }

  const courseObj = order.courseId || {};
  const courseId = courseObj._id || order.courseId;
  const courseName = courseObj.name || order.courseName || 'Certified Computer Course';

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <div className="no-print">
        <Navbar activePage="courses" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full flex-1">
        
        {/* Top Celebration Banner */}
        <div className="text-center mb-10 no-print">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Payment Successful & Enrollment Confirmed
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
            Congratulations, {order.customerName}!
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto">
            You are now officially enrolled in <span className="font-bold text-indigo-900">{courseName}</span>. Your learning portal is ready!
          </p>

          {/* Instant CTA to Start Learning */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link
              to={courseId ? `/student/courses/${courseId}` : '/student/dashboard'}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm group cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> Start Watching Course Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={handlePrint}
              className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl shadow-sm transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Save Tax Invoice
            </button>
          </div>
        </div>

        {/* Account Credentials Callout if new student created */}
        {authData?.isNewUser && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-2xl no-print">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">Your Student LMS Login Credentials</h4>
                <p className="text-xs text-amber-800 mt-0.5 mb-2">
                  Your dedicated student account has been created. You can use these details to login anytime at <span className="font-mono font-bold">/student/login</span>.
                </p>
                <div className="bg-white/80 border border-amber-200 rounded-xl p-3 inline-flex items-center gap-6 text-xs text-slate-800 font-mono">
                  <div>Email: <span className="font-bold text-indigo-900">{authData.user?.email}</span></div>
                  <div>Password: <span className="font-bold text-indigo-900">{authData.temporaryPassword || order.customerPhone}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Invoice Document Box (Print Friendly) */}
        <div id="printable-invoice" className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-xl relative overflow-hidden">
          
          {/* Watermark */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.03] text-9xl font-black select-none pointer-events-none">
            PAID
          </div>

          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-8 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tight mb-1">
                <Award className="w-7 h-7" /> Skill India Computer Education
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Registered Franchise & Digital Skill Mission • ISO 9001:2015 Certified
              </p>
              <p className="text-xs text-slate-400 mt-1">support@skillindia.com | www.skillindia.com</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg inline-block uppercase tracking-wider mb-2">
                Official Tax Invoice
              </span>
              <div className="text-xs text-slate-500 font-mono">
                Invoice No: <span className="font-bold text-slate-800">{order.invoiceNumber || 'INV-2026-9482'}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Order No: <span className="font-bold text-slate-800">{order.orderNumber}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Date: <span className="font-semibold text-slate-700">{new Date(order.paidAt || order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Billed To & Center Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
            <div>
              <div className="font-bold uppercase text-slate-400 text-[10px] tracking-wider mb-2">Billed To (Student)</div>
              <div className="font-bold text-sm text-slate-900">{order.customerName}</div>
              <div className="text-slate-600 mt-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {order.customerEmail}</div>
              <div className="text-slate-600 mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {order.customerPhone}</div>
              {order.customerCity && (
                <div className="text-slate-600 mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {order.customerCity}, {order.customerState}</div>
              )}
            </div>

            <div className="sm:text-right">
              <div className="font-bold uppercase text-slate-400 text-[10px] tracking-wider mb-2">Payment Details</div>
              <div className="text-slate-700">Payment Status: <span className="font-bold text-emerald-600 uppercase">Paid / Completed</span></div>
              <div className="text-slate-600 font-mono mt-1">Transaction ID: {order.transactionId || 'TXN-ONLINE'}</div>
              <div className="text-slate-600 mt-1">Learning Mode: <span className="font-semibold capitalize">{order.learningMode?.replace('_', ' ') || '100% Online LMS'}</span></div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Course / Certification Description</th>
                  <th className="pb-3 text-center">Duration</th>
                  <th className="pb-3 text-right">Fee (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4">
                    <div className="font-bold text-sm text-slate-900">{courseName}</div>
                    <div className="text-[11px] text-slate-500">Includes LMS portal access, ISO QR-verified certificate, and study notes.</div>
                  </td>
                  <td className="py-4 text-center text-slate-600 font-medium">
                    {courseObj.duration || 'Full Course'}
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900">
                    ₹{(order.originalPrice || order.finalAmount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="pt-4 border-t border-slate-200 flex flex-col items-end text-xs space-y-2">
            <div className="w-64 flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{(order.originalPrice || order.finalAmount).toLocaleString('en-IN')}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="w-64 flex justify-between text-emerald-700 font-semibold">
                <span>Discount / Coupon {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                <span>-₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="w-64 flex justify-between text-slate-600">
              <span>GST / Taxes (Included):</span>
              <span>₹0.00</span>
            </div>

            <div className="w-64 flex justify-between text-base font-black text-indigo-950 pt-2 border-t border-slate-200">
              <span>Total Paid:</span>
              <span>₹{order.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Invoice Footer Seal */}
          <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronically generated valid tax receipt • No signature required</span>
            </div>
            <div>
              Thank you for learning with us!
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
