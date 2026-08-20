import { useState, useEffect } from 'react';
import { getInquiries, updateInquiryStatus, addFollowUp } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Bell, Phone, MessageSquare } from 'lucide-react';

export default function PartnerInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const { showSuccess, showError } = useToast();

  const load = () => { getInquiries().then(res => { setInquiries(res.data.inquiries); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try { await updateInquiryStatus(id, status); showSuccess(`Marked as ${status}`); load(); }
    catch (error) { showError('Failed'); }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    try { await addFollowUp(showFollowUp._id, followUpNote); showSuccess('Follow-up added'); setShowFollowUp(null); setFollowUpNote(''); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Inquiries</h1><p className="text-gray-500">Student admission inquiries from homepage</p></div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Name', 'Phone', 'Course Interest', 'Date', 'Status', 'Actions']}>
            {inquiries.map(i => (
              <TableRow key={i._id}>
                <TableCell><div className="flex items-center gap-2"><Bell className="w-4 h-4 text-gray-400" /><span className="font-medium">{i.name}</span></div></TableCell>
                <TableCell><a href={`tel:${i.phone}`} className="flex items-center gap-1 text-primary-600"><Phone className="w-3 h-3" />{i.phone}</a></TableCell>
                <TableCell>{i.courseInterest || 'N/A'}</TableCell>
                <TableCell>{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><span className={`badge ${i.status === 'new' ? 'badge-info' : i.status === 'admitted' ? 'badge-success' : i.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{i.status}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <select value={i.status} onChange={(e) => handleStatus(i._id, e.target.value)} className="text-xs border rounded px-2 py-1">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="admitted">Admitted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={() => setShowFollowUp(i)} className="text-primary-600 hover:text-primary-800"><MessageSquare className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {showFollowUp && (
        <Modal isOpen={true} onClose={() => setShowFollowUp(null)} title={`Follow-ups: ${showFollowUp.name}`} size="md">
          <div className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {showFollowUp.followUpNotes?.map((n, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p>{n.note}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</p>
                </div>
              ))}
              {(!showFollowUp.followUpNotes || showFollowUp.followUpNotes.length === 0) && <p className="text-sm text-gray-400">No follow-ups yet</p>}
            </div>
            <form onSubmit={handleFollowUp} className="space-y-3">
              <input type="text" required placeholder="Add follow-up note..." value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} className="input-field" />
              <button type="submit" className="btn-primary w-full">Add Note</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
