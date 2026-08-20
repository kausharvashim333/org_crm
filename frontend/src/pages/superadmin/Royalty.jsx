import { useState, useEffect } from 'react';
import { getRoyalties, generateRoyalty, payRoyalty } from '../../api';
import { getPartners } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, IndianRupee } from 'lucide-react';

export default function Royalty() {
  const [royalties, setRoyalties] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const { showSuccess, showError } = useToast();
  const [genData, setGenData] = useState({ partnerId: '', period: '' });
  const [payData, setPayData] = useState({ amount: 0, mode: 'online', transactionId: '', remarks: '' });

  const load = () => {
    getRoyalties().then(res => { setRoyalties(res.data.royalties); setLoading(false); }).catch(() => setLoading(false));
    getPartners().then(res => setPartners(res.data.partners)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleGen = async (e) => {
    e.preventDefault();
    try { await generateRoyalty(genData); showSuccess('Royalty generated'); setShowGen(false); setGenData({ partnerId: '', period: '' }); load(); }
    catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try { await payRoyalty(showPay._id, payData); showSuccess('Payment recorded'); setShowPay(null); setPayData({ amount: 0, mode: 'online', transactionId: '', remarks: '' }); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Royalty Management</h1><p className="text-gray-500">Partner royalty payments</p></div>
        <button onClick={() => setShowGen(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Generate Royalty</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Partner', 'Period', 'Revenue', 'Royalty %', 'Royalty Amt', 'Paid', 'Pending', 'Status', 'Actions']}>
            {royalties.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.partnerId?.instituteName || 'N/A'}</TableCell>
                <TableCell>{r.period}</TableCell>
                <TableCell>₹{r.totalRevenue?.toLocaleString()}</TableCell>
                <TableCell>{r.royaltyPercent}%</TableCell>
                <TableCell>₹{r.royaltyAmount?.toLocaleString()}</TableCell>
                <TableCell>₹{r.paidAmount?.toLocaleString()}</TableCell>
                <TableCell>₹{r.pendingAmount?.toLocaleString()}</TableCell>
                <TableCell><span className={`badge ${r.status === 'paid' ? 'badge-success' : r.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>{r.status}</span></TableCell>
                <TableCell>{r.pendingAmount > 0 && <button onClick={() => setShowPay(r)} className="text-primary-600 hover:text-primary-800" title="Record Royalty Payment"><IndianRupee className="w-4 h-4" /></button>}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showGen} onClose={() => setShowGen(false)} title="Generate Royalty" size="md">
        <form onSubmit={handleGen} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Partner *</label><select required value={genData.partnerId} onChange={(e) => setGenData({ ...genData, partnerId: e.target.value })} className="input-field"><option value="">Select...</option>{partners.map(p => <option key={p._id} value={p._id}>{p.instituteName}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Period (YYYY-MM) *</label><input type="month" required value={genData.period} onChange={(e) => setGenData({ ...genData, period: e.target.value })} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Generate</button>
        </form>
      </Modal>

      {showPay && (
        <Modal isOpen={true} onClose={() => setShowPay(null)} title="Record Payment" size="md">
          <form onSubmit={handlePay} className="space-y-4">
            <p className="text-sm text-gray-600">Pending: ₹{showPay.pendingAmount?.toLocaleString()}</p>
            <div><label className="block text-sm font-medium mb-1">Amount *</label><input type="number" required max={showPay.pendingAmount} value={payData.amount} onChange={(e) => setPayData({ ...payData, amount: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Mode</label><select value={payData.mode} onChange={(e) => setPayData({ ...payData, mode: e.target.value })} className="input-field"><option value="online">Online</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="cash">Cash</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Transaction ID</label><input type="text" value={payData.transactionId} onChange={(e) => setPayData({ ...payData, transactionId: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Remarks</label><input type="text" value={payData.remarks} onChange={(e) => setPayData({ ...payData, remarks: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Record Payment</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
