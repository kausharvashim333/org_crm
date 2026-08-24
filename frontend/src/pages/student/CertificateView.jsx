import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentCertificate, getOrgHomepagePublic } from '../../api';
import { Printer, Download, ArrowLeft, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CertificateView() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [orgData, setOrgData] = useState(null);

  useEffect(() => {
    getStudentCertificate(certificateId)
      .then(res => {
        setCert(res.data.certificate);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
    getOrgHomepagePublic().then(res => setOrgData(res.data.homepage)).catch(() => {});
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading Certificate...</div>;
  }

  if (!cert) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Certificate Not Found</div>;
  }

  const student = cert.studentId || {};
  const course = cert.courseId || {};
  const partner = cert.partnerId || {};
  const orgName = orgData?.settings?.orgName || 'Training Institute';
  const orgLogo = orgData?.settings?.logo || '';
  const formattedDate = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar - Hidden when printing */}
      <header className="bg-slate-900 border-b border-slate-800 print:hidden sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/student/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg mirror-shine"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Certificate Area */}
      <main className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        {/* Printable Certificate Frame */}
        <div className="print-certificate-container bg-white text-slate-900 rounded-3xl p-8 sm:p-14 border-[12px] border-double border-indigo-900 shadow-2xl max-w-4xl w-full relative overflow-hidden my-auto font-serif">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-indigo-900 pointer-events-none"></div>
          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-indigo-900 pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-indigo-900 pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-indigo-900 pointer-events-none"></div>

          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-96 h-96 text-indigo-900" />
          </div>

          <div className="relative z-10 text-center space-y-6">
            {/* Header / Logo */}
            <div className="space-y-1">
              <div className="inline-flex items-center justify-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-lg font-sans overflow-hidden">
                  {orgLogo ? (
                    <img
                      src={orgLogo.startsWith('/uploads/') ? `/api${orgLogo}` : orgLogo}
                      alt="Org Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => { const img = e.target; if (!img.dataset.retried && orgLogo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = orgLogo.substring(orgLogo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }}
                    />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                </div>
                <span className="font-extrabold text-2xl text-indigo-950 font-sans tracking-tight">{orgName}</span>
              </div>
              <p className="text-xs uppercase tracking-widest text-indigo-900 font-sans font-bold">
                {partner.centerName || 'Computer & Vocational Skill Training Institute'}
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-900 to-transparent mx-auto mt-2"></div>
            </div>

            {/* Certificate Title */}
            <div className="pt-2 space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-wide uppercase font-serif">
                Certificate of Completion
              </h1>
              <p className="text-xs text-gray-500 font-sans italic">This certificate is proudly awarded to</p>
            </div>

            {/* Student Name */}
            <div className="py-2">
              <h2 className="text-3xl sm:text-4xl font-black text-indigo-900 underline decoration-indigo-300 decoration-wavy underline-offset-8">
                {student.fullName || 'Student Name'}
              </h2>
            </div>

            {/* Completion Text */}
            <div className="max-w-2xl mx-auto space-y-2 text-sm sm:text-base text-gray-700 leading-relaxed font-sans">
              <p>
                for successfully completing all chapter video modules and passing the bilingual assessment evaluation for the course:
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif pt-1">
                {course.name || 'Certified Skill Course'}
              </h3>
              <p className="text-xs text-gray-500 font-sans">
                Course Duration: <span className="font-semibold text-gray-800">{course.duration || 'Standard Term'}</span> | Grade Achieved: <span className="font-bold text-indigo-900">{cert.grade || 'Passed'} ({cert.percentage}%)</span>
              </p>
            </div>

            {/* Signatures & Verification Row */}
            <div className="pt-10 grid grid-cols-3 gap-6 items-end font-sans">
              {/* Left: Issue Date */}
              <div className="text-left text-xs space-y-1">
                <p className="font-bold text-gray-800">Issue Date:</p>
                <p className="text-gray-600">{formattedDate}</p>
                <p className="text-[10px] text-gray-400 font-mono">Cert No: {cert.certificateNo}</p>
              </div>

              {/* Center: Verification Seal */}
              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-900 text-indigo-900 flex flex-col items-center justify-center mx-auto bg-indigo-50/50 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-[9px] font-bold uppercase">Verified</span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">Code: {cert.verificationCode}</p>
              </div>

              {/* Right: Signature */}
              <div className="text-right text-xs space-y-1">
                <div className="border-b border-gray-400 w-36 ml-auto pb-1 text-center font-serif italic text-indigo-900 font-bold">
                  Authorized Signatory
                </div>
                <p className="font-bold text-gray-800">Director / Controller of Exams</p>
                <p className="text-[10px] text-gray-500">{orgName}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Embedded CSS for Print Styling */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, nav, footer, .print\\:hidden {
            display: none !important;
          }
          .print-certificate-container {
            border-width: 8px !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
