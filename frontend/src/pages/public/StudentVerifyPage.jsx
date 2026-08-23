import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicAdmissionReceipt, getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ShieldCheck, User, GraduationCap, Building2, CheckCircle2, XCircle, Calendar, Phone, BookOpen, IndianRupee, Loader2 } from 'lucide-react';

export default function StudentVerifyPage() {
  const { applicationNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [orgLogo, setOrgLogo] = useState('');

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => setOrgLogo(res.data?.homepage?.settings?.logo || ''))
      .catch(() => {});

    getPublicAdmissionReceipt(applicationNo)
      .then(res => {
        setStudent(res.data.student);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [applicationNo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <XCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-2xl font-bold">Student Not Found</h2>
        <p className="text-slate-400 text-sm">Invalid verification code or student record does not exist.</p>
        <Link to="/" className="btn-primary text-xs px-6 py-3">Go Home</Link>
      </div>
    );
  }

  const partner = student.partnerId || {};
  const course = (student.courseId && student.courseId[0]) || {};
  const photoUrl = student.photo ? (student.photo.startsWith('http') ? student.photo : `${window.location.origin}${student.photo}`) : null;
  const formattedDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activePage="services" />

      <main className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 border-4 border-emerald-600/30 shadow-2xl max-w-2xl w-full space-y-6">

          {/* Verification Header */}
          <div className="text-center space-y-3 pb-4 border-b-2 border-emerald-100">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-emerald-700">Student Verification</h1>
            <p className="text-xs text-slate-500">This is a verified student record from the admission system.</p>
          </div>

          {/* Student Photo + Basic Info */}
          <div className="flex items-center gap-5 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <div className="w-24 h-28 rounded-lg bg-slate-100 border-2 border-emerald-900 p-0.5 overflow-hidden shadow-sm flex-shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Student" className="w-full h-full object-cover rounded" />
              ) : (
                <User className="w-10 h-10 mx-auto text-slate-400 mt-8" />
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <h2 className="text-xl font-black text-slate-900">{student.fullName}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">{course.name || 'Course'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{partner.instituteName || partner.centerName || 'Organization'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Admitted: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Verification Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Application No.</span>
              <span className="font-black text-slate-900 font-mono">{student.applicationNo}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Student ID</span>
              <span className="font-black text-slate-900 font-mono">{student.studentIdNo || 'Auto-Assigned'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Phone</span>
              <span className="font-bold text-slate-900">{student.phone || 'N/A'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> {student.status || 'Active'}
              </span>
            </div>
            {student.totalFee > 0 && (
              <>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Fee</span>
                  <span className="font-black text-slate-900">₹{student.totalFee}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Pending Fee</span>
                  <span className="font-black text-rose-600">₹{student.pendingFee || 0}</span>
                </div>
              </>
            )}
          </div>

          {/* Verified Badge */}
          <div className="flex items-center justify-center gap-2 text-sm font-black text-emerald-700 bg-emerald-50 py-3 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" /> Verified Student Record
          </div>

          <div className="text-center">
            <Link to={`/admission-receipt/${student.applicationNo}`} className="text-xs text-indigo-600 hover:underline font-bold">
              View Full Admission Receipt →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
