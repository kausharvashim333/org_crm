import { useState, useEffect } from 'react';
import { getProjects, acceptProject, declineProject, uploadProjectDoc, addPlacement } from '../../api';
import { getStudents } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Briefcase, Check, X, Upload, UserPlus } from 'lucide-react';

export default function PartnerProjects() {
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(null);
  const [showPlacement, setShowPlacement] = useState(null);
  const { showSuccess, showError } = useToast();
  const [docData, setDocData] = useState({ title: '', fileUrl: '', type: 'kyc' });
  const [placementData, setPlacementData] = useState({ studentId: '', company: '', jobRole: '', salary: 0, joiningDate: '' });

  const load = () => {
    getProjects().then(res => { setProjects(res.data.projects); setLoading(false); }).catch(() => setLoading(false));
    getStudents({ limit: 200 }).then(res => setStudents(res.data.students)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAccept = async (id) => { try { await acceptProject(id); showSuccess('Project accepted'); load(); } catch (error) { showError('Failed'); } };
  const handleDecline = async (id, reason) => { try { await declineProject(id, reason); showSuccess('Project declined'); load(); } catch (error) { showError('Failed'); } };

  const handleUpload = async (e) => {
    e.preventDefault();
    try { await uploadProjectDoc(showUpload._id, docData); showSuccess('Document uploaded'); setShowUpload(null); setDocData({ title: '', fileUrl: '', type: 'kyc' }); load(); }
    catch (error) { showError('Failed'); }
  };

  const handlePlacement = async (e) => {
    e.preventDefault();
    try { await addPlacement(showPlacement._id, placementData); showSuccess('Placement recorded'); setShowPlacement(null); setPlacementData({ studentId: '', company: '', jobRole: '', salary: 0, joiningDate: '' }); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Projects</h1><p className="text-gray-500">Skill development projects assigned to you</p></div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Project', 'Scheme', 'Sector', 'Status', 'Target', 'Progress', 'Actions']}>
            {projects.map(p => {
              const assignment = p.assignments?.find(a => a.partnerId?._id === p.assignments[0]?.partnerId);
              return (
                <TableRow key={p._id}>
                  <TableCell><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400" /><span className="font-medium">{p.name}</span></div></TableCell>
                  <TableCell>{p.scheme || '-'}</TableCell>
                  <TableCell>{p.sector || '-'}</TableCell>
                  <TableCell><span className={`badge ${assignment?.status === 'accepted' ? 'badge-success' : assignment?.status === 'declined' ? 'badge-danger' : 'badge-warning'}`}>{assignment?.status || 'N/A'}</span></TableCell>
                  <TableCell>{assignment?.targetEnrollment || 0}</TableCell>
                  <TableCell>{assignment?.progress || 0}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {assignment?.status === 'assigned' && (<>
                        <button onClick={() => handleAccept(p._id)} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleDecline(p._id, 'Cannot take at this time')} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
                      </>)}
                      {assignment?.status === 'accepted' && (<>
                        <button onClick={() => setShowUpload(p)} className="text-primary-600 hover:text-primary-800"><Upload className="w-4 h-4" /></button>
                        <button onClick={() => setShowPlacement(p)} className="text-green-600 hover:text-green-800"><UserPlus className="w-4 h-4" /></button>
                      </>)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      {showUpload && (
        <Modal isOpen={true} onClose={() => setShowUpload(null)} title={`Upload Document: ${showUpload.name}`} size="md">
          <form onSubmit={handleUpload} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" required value={docData.title} onChange={(e) => setDocData({ ...docData, title: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Type</label><select value={docData.type} onChange={(e) => setDocData({ ...docData, type: e.target.value })} className="input-field"><option value="kyc">KYC</option><option value="attendance">Attendance</option><option value="assessment">Assessment</option><option value="placement">Placement</option><option value="invoice">Invoice</option><option value="other">Other</option></select></div>
            <div><label className="block text-sm font-medium mb-1">File URL</label><input type="text" placeholder="Upload URL or path" value={docData.fileUrl} onChange={(e) => setDocData({ ...docData, fileUrl: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Upload</button>
          </form>
        </Modal>
      )}

      {showPlacement && (
        <Modal isOpen={true} onClose={() => setShowPlacement(null)} title={`Add Placement: ${showPlacement.name}`} size="md">
          <form onSubmit={handlePlacement} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Student *</label><select required value={placementData.studentId} onChange={(e) => setPlacementData({ ...placementData, studentId: e.target.value })} className="input-field"><option value="">Select...</option>{students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Company *</label><input type="text" required value={placementData.company} onChange={(e) => setPlacementData({ ...placementData, company: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Job Role</label><input type="text" value={placementData.jobRole} onChange={(e) => setPlacementData({ ...placementData, jobRole: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Salary</label><input type="number" value={placementData.salary} onChange={(e) => setPlacementData({ ...placementData, salary: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Joining Date</label><input type="date" value={placementData.joiningDate} onChange={(e) => setPlacementData({ ...placementData, joiningDate: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Add Placement</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
