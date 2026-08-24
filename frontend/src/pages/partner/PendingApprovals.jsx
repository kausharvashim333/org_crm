import { useState, useEffect } from 'react';
import { getPendingApprovals, approveRejectAdmission } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Clock, CheckCircle2, XCircle, User, Phone, Mail, BookOpen, CreditCard, QrCode } from 'lucide-react';

export default function PendingApprovals() {
  const { showSuccess, showError } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchPending = () => {
    setLoading(true);
    getPendingApprovals()
      .then(res => setStudents(res.data.students || []))
      .catch(() => showError('Failed to load pending approvals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(id);
    try {
      const res = await approveRejectAdmission(id, action);
      showSuccess(res.data.message);
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to process action');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pending Admission Approvals</h1>
        <p className="text-sm text-slate-500">Students who paid via Institute QR and are waiting for your approval</p>
      </div>

      {students.length === 0 ? (
        <div className="card p-12 text-center border border-slate-200 rounded-2xl bg-white">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No pending approvals</p>
          <p className="text-xs text-slate-400 mt-1">All admissions are up to date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(student => (
            <div key={student._id} className="card p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Student Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase">
                      Pending Approval
                    </span>
                    <span className="text-xs text-slate-400">App: {student.applicationNo}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Name</p>
                        <p className="text-sm font-bold text-slate-800">{student.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Phone</p>
                        <p className="text-sm font-bold text-slate-800">{student.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-sm font-bold text-slate-800">{student.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Course</p>
                        <p className="text-sm font-bold text-slate-800">
                          {Array.isArray(student.courseId) ? student.courseId[0]?.name : student.courseId?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-800">UPI QR Payment</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500">Transaction ID</p>
                        <p className="text-sm font-bold text-slate-800">{student.paymentInfo?.transactionId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Amount Paid</p>
                        <p className="text-sm font-bold text-emerald-600">₹{student.paymentInfo?.paidAmount || 0}</p>
                      </div>
                    </div>
                    {student.totalFee > 0 && (
                      <div className="text-[10px] text-slate-500">
                        Total Fee: ₹{student.totalFee} | Pending: ₹{student.pendingFee}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Applied: {new Date(student.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                  <button
                    onClick={() => handleAction(student._id, 'approve')}
                    disabled={processing === student._id}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(student._id, 'reject')}
                    disabled={processing === student._id}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
