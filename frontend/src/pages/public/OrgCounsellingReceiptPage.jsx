import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCounsellingReceipt, getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CheckCircle2, Printer, ArrowLeft, Calendar, Phone, Mail, ShieldAlert } from 'lucide-react';

export default function OrgCounsellingReceiptPage() {
  const { code } = useParams();
  const [hp, setHp] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
      getCounsellingReceipt(code),
    ]).then(([hpRes, bRes]) => {
      setHp(hpRes.data?.homepage || {});
      setBooking(bRes.data.booking);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [code]);

  const themeColor = hp?.settings?.themeColor || '#2563eb';
  const session = booking?.session;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar activePage="counselling" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
          <h1 className="text-xl font-black text-slate-800">Receipt not found</h1>
          <p className="text-sm text-slate-500 mt-1">Booking is unpaid or the code is invalid.</p>
          <Link to="/counselling" className="mt-4 text-sm font-bold" style={{ color: themeColor }}>Back to counselling</Link>
        </div>
        <Footer homepageData={hp} />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar activePage="counselling" />
      <div className="max-w-lg mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:shadow-none">
          <div className="text-center space-y-2 mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-black text-slate-800">Booking confirmed</h1>
            <p className="font-mono text-sm font-bold text-indigo-700">{booking.bookingCode}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Name:</span> <strong>{booking.name}</strong></p>
            <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {booking.phone}</p>
            {booking.email && <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {booking.email}</p>}
            <p><span className="text-slate-500">Session:</span> <strong>{booking.itemTitle}</strong></p>
            {session?.date && (
              <p className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(session.date).toLocaleDateString('en-IN')} {session.startTime}–{session.endTime}
              </p>
            )}
            <p><span className="text-slate-500">Paid:</span> <strong>₹{booking.amount}</strong> ({booking.paymentMode})</p>
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3">{booking.notice}</p>
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={() => window.print()} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1 py-2.5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <Link to="/counselling" className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-2.5">
              <ArrowLeft className="w-4 h-4" /> Counselling
            </Link>
          </div>
        </div>
      </div>
      <Footer homepageData={hp} />
    </div>
  );
}
