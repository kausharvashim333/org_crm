import { useState, useEffect } from 'react';
import { getBatches, createBatch, updateBatch, deleteBatch, enrollStudent } from '../../api';
import { getCourses, getStaff, getStudents } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, Edit, Users, Ban, GraduationCap } from 'lucide-react';

export default function PartnerBatches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEnroll, setShowEnroll] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ courseId: '', name: '', startDate: '', endDate: '', timing: '', schedule: '', teacherId: '', maxStudents: 30 });

  const load = () => {
    getBatches().then(res => { setBatches(res.data.batches); setLoading(false); }).catch(() => setLoading(false));
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
    getStaff().then(res => setStaff(res.data.staff)).catch(() => {});
    getStudents({ limit: 200 }).then(res => setStudents(res.data.students)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBatch) { await updateBatch(editBatch._id, formData); showSuccess('Batch updated'); }
      else { await createBatch(formData); showSuccess('Batch created'); }
      setShowAdd(false); setEditBatch(null);
      setFormData({ courseId: '', name: '', startDate: '', endDate: '', timing: '', schedule: '', teacherId: '', maxStudents: 30 });
      load();
    } catch (error) { showError('Failed'); }
  };

  const handleEnroll = async (batchId, studentId) => {
    try { await enrollStudent(batchId, studentId); showSuccess('Student enrolled'); load(); }
    catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Cancel this batch?')) return;
    try { await deleteBatch(id); showSuccess('Batch cancelled'); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Batches</h1><p className="text-gray-500">Manage course batches</p></div>
        <button onClick={() => { setEditBatch(null); setFormData({ courseId: '', name: '', startDate: '', endDate: '', timing: '', schedule: '', teacherId: '', maxStudents: 30 }); setShowAdd(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Batch</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Batch', 'Course', 'Teacher', 'Start Date', 'Enrolled', 'Status', 'Actions']}>
            {batches.map(b => (
              <TableRow key={b._id}>
                <TableCell><div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-400" /><span className="font-medium">{b.name}</span></div></TableCell>
                <TableCell>{b.courseId?.name || 'N/A'}</TableCell>
                <TableCell>{b.teacherId?.name || 'Unassigned'}</TableCell>
                <TableCell>{b.startDate ? new Date(b.startDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{b.enrolledStudents?.length || 0}/{b.maxStudents}</TableCell>
                <TableCell><span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'upcoming' ? 'badge-info' : 'badge-warning'}`}>{b.status}</span></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => setShowEnroll(b)} className="text-primary-600 hover:text-primary-800" title="Enroll"><Users className="w-4 h-4" /></button>
                    <button onClick={() => { setEditBatch(b); setFormData({ courseId: b.courseId?._id, name: b.name, startDate: b.startDate?.split('T')[0] || '', endDate: b.endDate?.split('T')[0] || '', timing: b.timing || '', schedule: b.schedule || '', teacherId: b.teacherId?._id || '', maxStudents: b.maxStudents }); setShowAdd(true); }} className="text-primary-600 hover:text-primary-800"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:text-red-800"><Ban className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditBatch(null); }} title={editBatch ? 'Edit Batch' : 'Add Batch'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Batch Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Course *</label><select required value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field"><option value="">Select...</option>{courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Start Date *</label><input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Timing</label><input type="text" placeholder="e.g. 9-11 AM" value={formData.timing} onChange={(e) => setFormData({ ...formData, timing: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Schedule</label><input type="text" placeholder="e.g. Mon-Sat" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Teacher</label><select value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} className="input-field"><option value="">Select...</option>{staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Max Students</label><input type="number" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: +e.target.value })} className="input-field" /></div>
          </div>
          <button type="submit" className="btn-primary w-full">{editBatch ? 'Update' : 'Create Batch'}</button>
        </form>
      </Modal>

      {showEnroll && (
        <Modal isOpen={true} onClose={() => setShowEnroll(null)} title={`Enroll in: ${showEnroll.name}`} size="md">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.filter(s => s.status === 'active').map(s => {
              const enrolled = showEnroll.enrolledStudents?.some(es => es._id === s._id);
              return (
                <div key={s._id} className="flex items-center justify-between py-2 border-b">
                  <div><p className="text-sm font-medium">{s.fullName}</p><p className="text-xs text-gray-500">{s.phone}</p></div>
                  <button disabled={enrolled} onClick={() => handleEnroll(showEnroll._id, s._id)} className={enrolled ? 'badge badge-success' : 'btn-primary text-sm'}>{enrolled ? 'Enrolled' : 'Enroll'}</button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
