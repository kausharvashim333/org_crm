import { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, Edit, Ban, UserCog } from 'lucide-react';

export default function PartnerStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'teacher', qualification: '', subjects: '', salary: 0, address: '', joiningDate: new Date().toISOString().split('T')[0], experience: '' });

  const load = () => { getStaff().then(res => { setStaff(res.data.staff); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (editStaff) { await updateStaff(editStaff._id, payload); showSuccess('Staff updated'); }
      else { await createStaff(payload); showSuccess('Staff added'); }
      setShowAdd(false); setEditStaff(null);
      setFormData({ name: '', email: '', phone: '', role: 'teacher', qualification: '', subjects: '', salary: 0, address: '', joiningDate: new Date().toISOString().split('T')[0], experience: '' });
      load();
    } catch (error) { showError('Failed'); }
  };

  const handleEdit = (s) => {
    setEditStaff(s);
    setFormData({ name: s.name, email: s.email || '', phone: s.phone, role: s.role, qualification: s.qualification || '', subjects: s.subjects?.join(', ') || '', salary: s.salary || 0, address: s.address || '', joiningDate: s.joiningDate?.split('T')[0] || '', experience: s.experience || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this staff member?')) return;
    try { await deleteStaff(id); showSuccess('Deactivated'); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Staff</h1><p className="text-gray-500">Manage teachers & staff</p></div>
        <button onClick={() => { setEditStaff(null); setFormData({ name: '', email: '', phone: '', role: 'teacher', qualification: '', subjects: '', salary: 0, address: '', joiningDate: new Date().toISOString().split('T')[0], experience: '' }); setShowAdd(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Staff</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Name', 'Role', 'Phone', 'Subjects', 'Salary', 'Status', 'Actions']}>
            {staff.map(s => (
              <TableRow key={s._id}>
                <TableCell><div className="flex items-center gap-2"><UserCog className="w-4 h-4 text-gray-400" /><span className="font-medium">{s.name}</span></div></TableCell>
                <TableCell className="capitalize">{s.role.replace('_', ' ')}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.subjects?.join(', ') || '-'}</TableCell>
                <TableCell>₹{s.salary?.toLocaleString()}</TableCell>
                <TableCell><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></TableCell>
                <TableCell><div className="flex gap-2"><button onClick={() => handleEdit(s)} className="text-primary-600 hover:text-primary-800"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-800"><Ban className="w-4 h-4" /></button></div></TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditStaff(null); }} title={editStaff ? 'Edit Staff' : 'Add Staff'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone *</label><input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-field"><option value="teacher">Teacher</option><option value="counselor">Counselor</option><option value="admin_staff">Admin Staff</option><option value="accountant">Accountant</option><option value="other">Other</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Qualification</label><input type="text" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Subjects (comma separated)</label><input type="text" value={formData.subjects} onChange={(e) => setFormData({ ...formData, subjects: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Salary</label><input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Joining Date</label><input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Experience</label><input type="text" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" /></div>
          </div>
          <button type="submit" className="btn-primary w-full">{editStaff ? 'Update' : 'Add Staff'}</button>
        </form>
      </Modal>
    </div>
  );
}
