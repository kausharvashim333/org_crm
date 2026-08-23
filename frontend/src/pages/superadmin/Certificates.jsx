import { useState, useEffect } from 'react';
import { getCertificates, approveCertificate, bulkApproveCertificates, rejectCertificate } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Check, X, Award, CheckCircle } from 'lucide-react';

export default function AdminCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(null);
  const [showReject, setShowReject] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [bulkData, setBulkData] = useState({ grade: 'A', percentage: 0 });
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { showSuccess, showError } = useToast();
  const [approveData, setApproveData] = useState({ grade: '', percentage: 0 });
  const [rejectReason, setRejectReason] = useState('');

  const load = () => { getCertificates().then(res => { setCerts(res.data.certificates); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    try { await approveCertificate(showApprove._id, approveData); showSuccess('Certificate issued'); setShowApprove(null); setApproveData({ grade: '', percentage: 0 }); load(); }
    catch (error) { showError('Failed'); }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try { await rejectCertificate(showReject._id, rejectReason); showSuccess('Certificate rejected'); setShowReject(null); setRejectReason(''); load(); }
    catch (error) { showError('Failed'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const requestedCerts = certs.filter(c => c.status === 'requested');
    if (selectedIds.length === requestedCerts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requestedCerts.map(c => c._id));
    }
  };

  const handleBulkApprove = async (e) => {
    e.preventDefault();
    setBulkProcessing(true);
    try {
      const res = await bulkApproveCertificates({ certIds: selectedIds, grade: bulkData.grade, percentage: bulkData.percentage });
      showSuccess(res.data.message || `${res.data.approved} certificate(s) issued`);
      setShowBulkApprove(false);
      setSelectedIds([]);
      setBulkData({ grade: 'A', percentage: 0 });
      load();
    } catch (error) {
      showError('Bulk approve failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const requestedCerts = certs.filter(c => c.status === 'requested');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Certificates</h1><p className="text-gray-500">Approve or reject certificate requests</p></div>
        {selectedIds.length > 0 && (
          <button onClick={() => setShowBulkApprove(true)} className="btn-primary flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Bulk Approve ({selectedIds.length})
          </button>
        )}
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['', 'Student', 'Institute', 'Course', 'Status', 'Cert No', 'Requested', 'Actions']}>
            {requestedCerts.length > 0 && (
              <TableRow>
                <TableCell>
                  <input type="checkbox" checked={selectedIds.length === requestedCerts.length && requestedCerts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer" />
                </TableCell>
                <TableCell colSpan={7} className="text-xs font-bold text-slate-500">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all requested'}
                </TableCell>
              </TableRow>
            )}
            {certs.map(c => (
              <TableRow key={c._id}>
                <TableCell>
                  {c.status === 'requested' && (
                    <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} className="w-4 h-4 rounded cursor-pointer" />
                  )}
                </TableCell>
                <TableCell><div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />{c.studentId?.fullName || 'N/A'}</div></TableCell>
                <TableCell>{c.partnerId?.instituteName || 'N/A'}</TableCell>
                <TableCell>{c.courseId?.name || 'N/A'}</TableCell>
                <TableCell><span className={`badge ${c.status === 'issued' ? 'badge-success' : c.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{c.status}</span></TableCell>
                <TableCell>{c.certificateNo || '-'}</TableCell>
                <TableCell>{new Date(c.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {c.status === 'requested' && (
                    <div className="flex gap-2">
                      <button onClick={() => setShowApprove(c)} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setShowReject(c)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {showBulkApprove && (
        <Modal isOpen={true} onClose={() => setShowBulkApprove(false)} title={`Bulk Approve ${selectedIds.length} Certificates`} size="md">
          <form onSubmit={handleBulkApprove} className="space-y-4">
            <p className="text-sm text-gray-600">You are about to issue {selectedIds.length} certificates with the same grade and percentage.</p>
            <div><label className="block text-sm font-medium mb-1">Grade (applies to all)</label><input type="text" placeholder="A, B, C..." value={bulkData.grade} onChange={(e) => setBulkData({ ...bulkData, grade: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Percentage (applies to all)</label><input type="number" min="0" max="100" value={bulkData.percentage} onChange={(e) => setBulkData({ ...bulkData, percentage: +e.target.value })} className="input-field" /></div>
            <button type="submit" disabled={bulkProcessing} className="btn-primary w-full disabled:opacity-50">{bulkProcessing ? 'Processing...' : `Issue ${selectedIds.length} Certificates`}</button>
          </form>
        </Modal>
      )}

      {showApprove && (
        <Modal isOpen={true} onClose={() => setShowApprove(null)} title="Issue Certificate" size="md">
          <form onSubmit={handleApprove} className="space-y-4">
            <p className="text-sm text-gray-600">Student: {showApprove.studentId?.fullName} | Course: {showApprove.courseId?.name}</p>
            <div><label className="block text-sm font-medium mb-1">Grade</label><input type="text" placeholder="A, B, C..." value={approveData.grade} onChange={(e) => setApproveData({ ...approveData, grade: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Percentage</label><input type="number" min="0" max="100" value={approveData.percentage} onChange={(e) => setApproveData({ ...approveData, percentage: +e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Issue Certificate</button>
          </form>
        </Modal>
      )}

      {showReject && (
        <Modal isOpen={true} onClose={() => setShowReject(null)} title="Reject Certificate" size="md">
          <form onSubmit={handleReject} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Rejection Reason</label><textarea rows="3" required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field" /></div>
            <button type="submit" className="btn-danger w-full">Reject</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
