import { useState, useEffect } from 'react';
import { getProjects, createProject, assignProject, approveProjectDoc, addProjectNotice } from '../../api';
import { getPartners } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, Briefcase, Users, Check, X, Bell } from 'lucide-react';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [showNotice, setShowNotice] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ name: '', description: '', scheme: '', sector: '', startDate: new Date().toISOString().split('T')[0], endDate: '', budget: 0, targetEnrollment: 0, eligibilityCriteria: '' });
  const [assignData, setAssignData] = useState({ partnerIds: [], targetEnrollment: 0, targetPlacement: 0, customTerms: '', fundAllocated: 0 });
  const [noticeData, setNoticeData] = useState({ title: '', message: '' });

  const load = () => {
    getProjects().then(res => { setProjects(res.data.projects); setLoading(false); }).catch(() => setLoading(false));
    getPartners().then(res => setPartners(res.data.partners)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await createProject(formData); showSuccess('Project created'); setShowAdd(false); setFormData({ name: '', description: '', scheme: '', sector: '', startDate: new Date().toISOString().split('T')[0], endDate: '', budget: 0, targetEnrollment: 0, eligibilityCriteria: '' }); load(); }
    catch (error) { showError('Failed to create project'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try { await assignProject(showAssign._id, assignData); showSuccess('Project assigned'); setShowAssign(null); load(); }
    catch (error) { showError('Failed to assign'); }
  };

  const handleNotice = async (e) => {
    e.preventDefault();
    try { await addProjectNotice(showNotice._id, noticeData); showSuccess('Notice sent'); setShowNotice(null); setNoticeData({ title: '', message: '' }); load(); }
    catch (error) { showError('Failed'); }
  };

  const handleDocApprove = async (projectId, docId, status) => {
    try { await approveProjectDoc(projectId, docId, { approvalStatus: status }); showSuccess(`Document ${status}`); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Skill Development Projects</h1><p className="text-gray-500">Manage & assign projects to partners</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Project</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Project', 'Scheme', 'Sector', 'Budget', 'Status', 'Assigned To', 'Actions']}>
            {projects.map(p => (
              <TableRow key={p._id}>
                <TableCell><div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400" /><span className="font-medium">{p.name}</span></div></TableCell>
                <TableCell>{p.scheme || '-'}</TableCell>
                <TableCell>{p.sector || '-'}</TableCell>
                <TableCell>₹{(p.budget || 0).toLocaleString()}</TableCell>
                <TableCell><span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></TableCell>
                <TableCell>{p.assignments?.length || 0} partners</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAssign(p)} className="text-primary-600 hover:text-primary-800" title="Assign"><Users className="w-4 h-4" /></button>
                    <button onClick={() => setShowNotice(p)} className="text-yellow-600 hover:text-yellow-800" title="Notice"><Bell className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {showAssign && (
        <Modal isOpen={true} onClose={() => setShowAssign(null)} title={`Assign: ${showAssign.name}`} size="md">
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Partners</label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {partners.map(p => (
                  <label key={p._id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={assignData.partnerIds.includes(p._id)} onChange={(e) => {
                      if (e.target.checked) setAssignData({ ...assignData, partnerIds: [...assignData.partnerIds, p._id] });
                      else setAssignData({ ...assignData, partnerIds: assignData.partnerIds.filter(id => id !== p._id) });
                    }} />
                    {p.instituteName} - {p.city}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Target Enrollment</label><input type="number" value={assignData.targetEnrollment} onChange={(e) => setAssignData({ ...assignData, targetEnrollment: +e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Target Placement</label><input type="number" value={assignData.targetPlacement} onChange={(e) => setAssignData({ ...assignData, targetPlacement: +e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1">Fund Allocated (₹)</label><input type="number" value={assignData.fundAllocated} onChange={(e) => setAssignData({ ...assignData, fundAllocated: +e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Custom Terms</label><textarea rows="2" value={assignData.customTerms} onChange={(e) => setAssignData({ ...assignData, customTerms: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Assign Project</button>
          </form>
        </Modal>
      )}

      {showNotice && (
        <Modal isOpen={true} onClose={() => setShowNotice(null)} title={`Notice: ${showNotice.name}`} size="md">
          <form onSubmit={handleNotice} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" required value={noticeData.title} onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Message</label><textarea rows="4" required value={noticeData.message} onChange={(e) => setNoticeData({ ...noticeData, message: e.target.value })} className="input-field" /></div>
            <button type="submit" className="btn-primary w-full">Send Notice</button>
          </form>
        </Modal>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Project" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Project Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Scheme</label><input type="text" value={formData.scheme} onChange={(e) => setFormData({ ...formData, scheme: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Sector</label><input type="text" value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Budget (₹)</label><input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Start Date *</label><input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Target Enrollment</label><input type="number" value={formData.targetEnrollment} onChange={(e) => setFormData({ ...formData, targetEnrollment: +e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Eligibility Criteria</label><textarea rows="2" value={formData.eligibilityCriteria} onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Create Project</button>
        </form>
      </Modal>
    </div>
  );
}
