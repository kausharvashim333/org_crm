import { useState, useEffect } from 'react';
import { getFees, createFee, addFeePayment } from '../../api';
import { getStudents, getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, IndianRupee, Receipt } from 'lucide-react';

export default function PartnerFees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ studentId: '', courseId: '', totalFee: 0, discount: 0, discountReason: '' });
  const [payData, setPayData] = useState({ amount: 0, mode: 'cash', transactionId: '', remarks: '' });

  const load = () => {
    getFees().then(res => { setFees(res.data.fees); setLoading(false); }).catch(() => setLoading(false));
    getStudents({ limit: 200 }).then(res => setStudents(res.data.students)).catch(() => {});
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createFee(formData);
      showSuccess('Fee record created');
      setShowAdd(false);
      setFormData({ studentId: '', courseId: '', totalFee: 0, discount: 0, discountReason: '' });
      load();
    } catch (error) { showError('Failed'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      const res = await addFeePayment(showPay._id, payData);
      showSuccess(`Payment recorded. Receipt: ${res.data.receiptNo}`);
      setShowPay(null);
      setPayData({ amount: 0, mode: 'cash', transactionId: '', remarks: '' });
      load();
    } catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Fee Management</h1><p className="text-gray-500">Collect & track fees</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Fee Record</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Student', 'Course', 'Total', 'Paid', 'Pending', 'Status', 'Actions']}>
            {fees.map(f => (
              <TableRow key={f._id}>
                <TableCell><span className="font-medium">{f.studentId?.fullName || 'N/A'}</span></TableCell>
                <TableCell>{f.courseId?.name || 'N/A'}</TableCell>
                <TableCell>₹{f.totalFee?.toLocaleString()}</TableCell>
                <TableCell>₹{f.paidAmount?.toLocaleString()}</TableCell>
                <TableCell>₹{f.pendingAmount?.toLocaleString()}</TableCell>
                <TableCell><span className={`badge ${f.status === 'paid' ? 'badge-success' : f.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{f.status}</span></TableCell>
                <TableCell>{f.pendingAmount > 0 && <button onClick={() => setShowPay(f)} className="text-primary-600 hover:text-primary-800" title="Collect Fee Payment"><IndianRupee className="w-4 h-4" /></button>}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Fee Record" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Student *</label><select required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="input-field"><option value="">Select...</option>{students.map(s => <option key={s._id} value={s._id}>{s.fullName} - {s.phone}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Course</label><select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field"><option value="">Select...</option>{courses.map(c => <option key={c._id} value={c._id}>{c.name} (₹{c.fee})</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Total Fee *</label><input type="number" required value={formData.totalFee} onChange={(e) => setFormData({ ...formData, totalFee: +e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Discount</label><input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: +e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Discount Reason</label><input type="text" value={formData.discountReason} onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Create Fee Record</button>
        </form>
      </Modal>

      {showPay && (
        <Modal isOpen={true} onClose={() => setShowPay(null)} title="Collect Payment" size="md">
          <form onSubmit={handlePay} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p>Student: <span className="font-medium">{showPay.studentId?.fullName}</span></p>
              <p>Pending: <span className="font-medium text-red-600">₹{showPay.pendingAmount?.toLocaleString()}</span></p>
            </div>
            <div><label className="block text-sm font-medium mb-1">Amount *</label><input type="number" required max={showPay.pendingAmount} value={payData.amount} onChange={(e) => setPayData({ ...payData, amount: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Payment Mode</label><select value={payData.mode} onChange={(e) => setPayData({ ...payData, mode: e.target.value })} className="input-field"><option value="cash">Cash</option><option value="upi">UPI</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="card">Card</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Transaction ID</label><input type="text" value={payData.transactionId} onChange={(e) => setPayData({ ...payData, transactionId: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Remarks</label><input type="text" value={payData.remarks} onChange={(e) => setPayData({ ...payData, remarks: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Receipt className="w-4 h-4" /> Collect & Generate Receipt</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
