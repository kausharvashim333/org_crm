import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicAdmissionReceipt, getOrgHomepagePublic, getCourseBatches, assignStudentBatch } from '../../api';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Printer, Download, CheckCircle2, ArrowLeft, Building2, BookOpen, GraduationCap, ShieldCheck, User, QrCode, Phone, Mail, MapPin, School, Calendar, Check, Users, Loader2 } from 'lucide-react';

export default function AdmissionReceiptPage() {
  const { applicationNo } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [orgLogo, setOrgLogo] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [batchAssigned, setBatchAssigned] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    getOrgHomepagePublic()
      .then(res => {
        setOrgLogo(res.data?.homepage?.settings?.logo || '');
      })
      .catch(() => {});

    getPublicAdmissionReceipt(applicationNo)
      .then(res => {
        setStudent(res.data.student);
        setLoading(false);
        // Fetch batches for the student's course
        const cId = res.data.student?.courseId?.[0]?._id || res.data.student?.courseId?.[0];
        const pId = res.data.student?.partnerId?._id || res.data.student?.partnerId;
        if (cId) {
          getCourseBatches(cId, pId)
            .then(bRes => setBatches(bRes.data.batches || []))
            .catch(() => {});
        }
        if (res.data.student?.batchId) setBatchAssigned(true);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [applicationNo]);

  const handleAssignBatch = async () => {
    if (!selectedBatch) return showError('Please select a batch');
    setAssigning(true);
    try {
      const res = await assignStudentBatch({ studentId: student._id, batchId: selectedBatch });
      setBatchAssigned(true);
      setStudent(res.data.student);
      showSuccess('Batch assigned successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to assign batch');
    } finally {
      setAssigning(false);
    }
  };

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

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-2xl font-bold">Admission Receipt Not Found</h2>
        <p className="text-slate-400 text-sm">Please check your Application Registration Number.</p>
        <Link to="/admission" className="btn-primary text-xs px-6 py-3">Back to Admission Portal</Link>
      </div>
    );
  }

  const partner = student.partnerId || {};
  const course = (student.courseId && student.courseId[0]) || {};
  const formattedDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString();

  // Verification QR Code - encodes a URL that opens verification page
  const verifyUrl = `${window.location.origin}/verify-student/${student.applicationNo || student._id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

  // Resolve photo & signature to absolute URLs for print
  const photoUrl = student.photo ? (student.photo.startsWith('http') ? student.photo : `${window.location.origin}${student.photo}`) : null;
  const signatureUrl = student.signature ? (student.signature.startsWith('http') ? student.signature : `${window.location.origin}${student.signature}`) : null;

  const tenth = student.tenthDetails || {};
  const twelfth = student.twelfthDetails || {};
  const grad = student.graduationDetails || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activePage="services" />

      {/* Top Navbar Actions - Hidden when printing */}
      <div className="bg-slate-900 border-b border-slate-800 print:hidden py-4 px-4 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/admission" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Apply Another Admission
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Print Application Slip
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all"
            >
              <Download className="w-4 h-4" /> Download PDF Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Container */}
      <main className="flex-1 p-4 sm:p-8 flex items-center justify-center">
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

          {/* Top Header */}
          <div className="border-b-4 border-indigo-900 pb-5 text-center space-y-2 relative z-10">
            <div className="flex items-start justify-between">
              <div className="text-left space-y-1">
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight uppercase">
                  {partner.instituteName || partner.centerName || 'Computer Institute Center'}
                </h1>
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                  Official Online Student Admission Application Form
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Address: {partner.address || 'Main Road'}, {partner.city || partner.district || ''}, {partner.state || 'Chhattisgarh'}
                </p>
              </div>

              {/* Status Badge & QR Code */}
              <div className="flex items-center gap-3">
                <img src={qrUrl} alt="Verification QR" className="w-16 h-16 border border-slate-300 rounded-lg p-0.5" />
              </div>
            </div>
          </div>

          {/* Application No. & Photo/Sign Bar */}
          <div className="py-4 px-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 my-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-900/70 uppercase tracking-wider block">Application Reg. Number</span>
              <span className="text-xl font-black text-indigo-950 font-mono tracking-wider">{student.applicationNo}</span>
              <div className="text-[11px] text-slate-600">
                Student Roll ID: <strong className="text-slate-900">{student.studentIdNo || 'Auto-Assigned'}</strong> | Date: <strong>{formattedDate}</strong>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Photo */}
              <div className="text-center">
                <div className="w-24 h-28 rounded-lg bg-slate-100 border-2 border-indigo-950 p-0.5 overflow-hidden shadow-sm">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Student" className="w-full h-full object-cover rounded" crossOrigin="anonymous" />
                  ) : (
                    <User className="w-10 h-10 mx-auto text-slate-400 mt-8" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">Photo</span>
              </div>

              {/* Signature */}
              <div className="text-center">
                <div className="w-28 h-16 rounded-lg bg-slate-100 border border-slate-300 p-1 overflow-hidden flex items-center justify-center">
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Signature</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">Signature</span>
              </div>
            </div>
          </div>

          {/* 1. Candidate Personal & Parent Details */}
          <div className="space-y-3 mb-5">
            <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wider bg-indigo-900 text-white px-3 py-1 rounded-md inline-block">
              1. Personal & Parent Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Full Name</span>
                <span className="font-extrabold text-slate-900">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Mobile Phone</span>
                <span className="font-bold text-slate-900">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">WhatsApp Phone</span>
                <span className="font-semibold text-slate-800">{student.whatsappPhone || student.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Gender & DOB</span>
                <span className="font-semibold text-slate-800">{student.gender} | {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Father's Name</span>
                <span className="font-semibold text-slate-800">{student.fatherName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Mother's Name</span>
                <span className="font-semibold text-slate-800">{student.motherName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Category & Blood</span>
                <span className="font-semibold text-slate-800">{student.category || 'General'} {student.bloodGroup ? `(${student.bloodGroup})` : ''}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">ID Proof (Aadhaar)</span>
                <span className="font-semibold text-slate-800">{student.idProofNumber || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Address</span>
                <span className="font-semibold text-slate-800">{student.address}, {student.city}, {student.state} - {student.pincode}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Parent Mobile & Income</span>
                <span className="font-semibold text-slate-800">{student.fatherPhone || '—'} | {student.familyIncome || 'Below 1 Lakh'}</span>
              </div>
            </div>
          </div>

          {/* 2. Course Selection & Fee Status */}
          <div className="space-y-3 mb-5">
            <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wider bg-indigo-900 text-white px-3 py-1 rounded-md inline-block">
              2. Course Enrolled & Fee Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
              <div className="col-span-2">
                <span className="text-indigo-900/70 block uppercase font-bold text-[10px]">Course Title</span>
                <span className="font-black text-indigo-950 text-sm">{course.name || 'Computer Diploma Course'}</span>
              </div>
              <div>
                <span className="text-indigo-900/70 block uppercase font-bold text-[10px]">Course Duration</span>
                <span className="font-bold text-indigo-950">{course.duration || 'Diploma'}</span>
              </div>
              <div>
                <span className="text-indigo-900/70 block uppercase font-bold text-[10px]">Course Fee</span>
                <span className="font-black text-slate-900 text-sm">₹{course.fee || course.courseFee || 0}</span>
              </div>
              <div>
                <span className="text-indigo-900/70 block uppercase font-bold text-[10px]">Registration Fee</span>
                {student.paymentInfo?.paymentStatus === 'paid' ? (
                  <div>
                    <span className="font-black text-emerald-800 text-sm block">₹{student.paymentInfo.paidAmount || 500}</span>
                    <span className="inline-block text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ✓ PAID ONLINE
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-black text-amber-900 text-sm block">₹{course.registrationFee || 500}</span>
                    <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      PAY AT CENTER
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Fee Details & Batch Selection */}
          <div className="space-y-3 mb-5 print:hidden">
            <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wider bg-indigo-900 text-white px-3 py-1 rounded-md inline-block">
              3. Fee Details & Batch Selection
            </h3>

            {/* Fee Summary */}
            {student.totalFee > 0 && (
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-center">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Fee</span>
                  <span className="font-black text-slate-900 text-base">₹{student.totalFee}</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Paid</span>
                  <span className="font-black text-emerald-600 text-base">₹{student.totalFee - (student.pendingFee || 0)}</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Pending</span>
                  <span className="font-black text-rose-600 text-base">₹{student.pendingFee || 0}</span>
                </div>
              </div>
            )}

            {/* Batch Selection */}
            {batchAssigned ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" /> Batch assigned successfully!
              </div>
            ) : batches.length > 0 ? (
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">Select Your Batch</h4>
                </div>
                <div className="space-y-2">
                  {batches.map(b => (
                    <label
                      key={b._id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedBatch === b._id ? 'border-indigo-600 bg-white' : 'border-slate-200 bg-white/60 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="batch"
                          value={b._id}
                          checked={selectedBatch === b._id}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{b.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {b.timing || 'Time TBD'} | Starts: {new Date(b.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.availableSeats > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {b.availableSeats > 0 ? `${b.availableSeats} seats left` : 'Full'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.enrolledCount}/{b.maxStudents} enrolled</p>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleAssignBatch}
                  disabled={!selectedBatch || assigning}
                  className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm Batch
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                No batches available for this course yet. Please contact your center for batch assignment.
              </div>
            )}
          </div>

          {/* 4. Academic Qualifications Table */}
          <div className="space-y-3 mb-5">
            <h3 className="font-bold text-xs text-indigo-950 uppercase tracking-wider bg-indigo-900 text-white px-3 py-1 rounded-md inline-block">
              3. Educational Qualification Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
                    <th className="p-2 border border-slate-300">Exam</th>
                    <th className="p-2 border border-slate-300">Board / University</th>
                    <th className="p-2 border border-slate-300">School / College</th>
                    <th className="p-2 border border-slate-300">Year</th>
                    <th className="p-2 border border-slate-300">Roll No</th>
                    <th className="p-2 border border-slate-300">Marks / CGPA</th>
                    <th className="p-2 border border-slate-300">Percentage</th>
                    <th className="p-2 border border-slate-300">Division</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* 10th Row */}
                  <tr>
                    <td className="p-2 font-bold border border-slate-300">10th (High School)</td>
                    <td className="p-2 border border-slate-300">{tenth.board || 'CGBSE / CBSE'}</td>
                    <td className="p-2 border border-slate-300">{tenth.schoolName || '—'}</td>
                    <td className="p-2 border border-slate-300">{tenth.passingYear || '—'}</td>
                    <td className="p-2 border border-slate-300">{tenth.rollNo || '—'}</td>
                    <td className="p-2 border border-slate-300">{tenth.obtainedMarks ? `${tenth.obtainedMarks} / ${tenth.totalMarks}` : '—'}</td>
                    <td className="p-2 font-bold text-indigo-900 border border-slate-300">{tenth.percentage ? `${tenth.percentage}%` : '—'}</td>
                    <td className="p-2 font-bold border border-slate-300">{tenth.division || '—'}</td>
                  </tr>

                  {/* 12th Row */}
                  <tr>
                    <td className="p-2 font-bold border border-slate-300">12th ({twelfth.stream || 'Intermediate'})</td>
                    <td className="p-2 border border-slate-300">{twelfth.board || 'CGBSE / CBSE'}</td>
                    <td className="p-2 border border-slate-300">{twelfth.schoolName || '—'}</td>
                    <td className="p-2 border border-slate-300">{twelfth.passingYear || '—'}</td>
                    <td className="p-2 border border-slate-300">{twelfth.rollNo || '—'}</td>
                    <td className="p-2 border border-slate-300">{twelfth.obtainedMarks ? `${twelfth.obtainedMarks} / ${twelfth.totalMarks}` : '—'}</td>
                    <td className="p-2 font-bold text-indigo-900 border border-slate-300">{twelfth.percentage ? `${twelfth.percentage}%` : '—'}</td>
                    <td className="p-2 font-bold border border-slate-300">{twelfth.division || '—'}</td>
                  </tr>

                  {/* Graduation Row if available */}
                  {(grad.university || grad.degree) && (
                    <tr>
                      <td className="p-2 font-bold border border-slate-300">UG ({grad.degree || 'Graduation'})</td>
                      <td className="p-2 border border-slate-300">{grad.university || '—'}</td>
                      <td className="p-2 border border-slate-300">{grad.collegeName || '—'}</td>
                      <td className="p-2 border border-slate-300">{grad.passingYear || '—'}</td>
                      <td className="p-2 border border-slate-300">{grad.rollNo || '—'}</td>
                      <td className="p-2 border border-slate-300">
                        {grad.marksType === 'cgpa' ? `CGPA: ${grad.cgpa}` : `${grad.obtainedMarks} / ${grad.totalMarks}`}
                      </td>
                      <td className="p-2 font-bold text-indigo-900 border border-slate-300">{grad.percentage ? `${grad.percentage}%` : '—'}</td>
                      <td className="p-2 font-bold border border-slate-300">{grad.division || '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Declaration & Stamp Signatures */}
          <div className="pt-4 grid grid-cols-2 gap-6 items-end text-xs font-sans border-t-2 border-slate-300 mt-6">
            <div>
              <p className="font-bold text-slate-900 text-[11px]">Declaration & Student Signature:</p>
              <p className="text-[10px] text-slate-600 leading-tight mt-1">
                Maine sabhi niyam aur shartiyein acche se padh li hain aur sabhi jaankari satya hai.
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="border-b border-slate-400 w-44 ml-auto pb-1 text-center font-bold text-indigo-900 text-[11px]">
                Authorized Stamp & Sign
              </div>
              <p className="font-bold text-slate-900">{partner.instituteName || partner.centerName}</p>
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, .print\\:hidden {
            display: none !important;
          }
          .print-slip-container {
            border-width: 4px !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}
