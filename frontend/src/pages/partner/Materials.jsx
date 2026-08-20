import { useState, useEffect } from 'react';
import { getMaterials, uploadMaterial, deleteMaterial } from '../../api';
import { getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, Trash2, FileText, Video, Link as LinkIcon, Download } from 'lucide-react';

export default function PartnerMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ title: '', description: '', type: 'notes', externalLink: '' });
  const [file, setFile] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const load = () => {
    getMaterials().then(res => { setMaterials(res.data.materials); setLoading(false); }).catch(() => setLoading(false));
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('type', formData.type);
      fd.append('courseIds', JSON.stringify(selectedCourses));
      if (formData.externalLink) fd.append('externalLink', formData.externalLink);
      if (file) fd.append('file', file);
      await uploadMaterial(fd);
      showSuccess('Material uploaded (pending admin approval)');
      setShowAdd(false); setFormData({ title: '', description: '', type: 'notes', externalLink: '' }); setFile(null); setSelectedCourses([]);
      load();
    } catch (error) { showError('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this material?')) return;
    try { await deleteMaterial(id); showSuccess('Removed'); load(); }
    catch (error) { showError('Failed'); }
  };

  const typeIcon = (type) => type === 'video' ? <Video className="w-4 h-4 text-red-500" /> : type === 'link' ? <LinkIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-gray-400" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Study Material</h1><p className="text-gray-500">View standard material & upload custom</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Upload Material</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Title', 'Type', 'Standard/Custom', 'Status', 'Actions']}>
            {materials.map(m => (
              <TableRow key={m._id}>
                <TableCell><div className="flex items-center gap-2">{typeIcon(m.type)}<span className="font-medium">{m.title}</span></div></TableCell>
                <TableCell className="capitalize">{m.type}</TableCell>
                <TableCell><span className={`badge ${m.isStandard ? 'badge-info' : 'badge-warning'}`}>{m.isStandard ? 'Standard' : 'Custom'}</span></TableCell>
                <TableCell><span className={`badge ${m.approvalStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>{m.approvalStatus}</span></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {m.approvalStatus === 'approved' && (m.fileUrl || m.externalLink) && <a href={m.externalLink || m.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-800"><Download className="w-4 h-4" /></a>}
                    {!m.isStandard && <button onClick={() => handleDelete(m._id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Upload Study Material" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Type *</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field"><option value="notes">Notes (PDF)</option><option value="video">Video Lecture</option><option value="presentation">Presentation</option><option value="assignment">Assignment</option><option value="question_bank">Question Bank</option><option value="ebook">E-Book</option><option value="link">External Link</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" /></div>
          <div>
            <label className="block text-sm font-medium mb-1">Assign to Courses</label>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 grid grid-cols-2 gap-2">
              {courses.map(c => (
                <label key={c._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedCourses.includes(c._id)} onChange={(e) => {
                    if (e.target.checked) setSelectedCourses([...selectedCourses, c._id]);
                    else setSelectedCourses(selectedCourses.filter(id => id !== c._id));
                  }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          {formData.type === 'link' ? (
            <div><label className="block text-sm font-medium mb-1">External Link *</label><input type="url" required value={formData.externalLink} onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })} className="input-field" /></div>
          ) : (
            <div><label className="block text-sm font-medium mb-1">File</label><input type="file" onChange={(e) => setFile(e.target.files[0])} className="input-field" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.zip" /></div>
          )}
          <button type="submit" className="btn-primary w-full">Upload (Pending Approval)</button>
        </form>
      </Modal>
    </div>
  );
}
