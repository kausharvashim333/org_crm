import { useState, useEffect } from 'react';
import { getCertificates, requestCertificate } from '../../api';
import { getStudents, getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, Award } from 'lucide-react';

export default function PartnerCertificates() {
  const [certs, setCerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ studentId: '', courseId: '' });

  const load = () => {
    getCertificates().then(res => { setCerts(res.data.certificates); setLoading(false); }).catch(() => setLoading(false));
    getStudents({ limit: 200 }).then(res => setStudents(res.data.students)).catch(() => {});
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await requestCertificate(formData); showSuccess('Certificate requested'); setShowAdd(false); setFormData({ studentId: '', courseId: '' }); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Certificates</h1><p className="text-gray-500">Request certificates for students</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Request Certificate</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Student', 'Course', 'Status', 'Cert No', 'Grade', 'Requested', 'Verify']}>
            {certs.map(c => (
              <TableRow key={c._id}>
                <TableCell><div className="flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" /><span className="font-medium">{c.studentId?.fullName || 'N/A'}</span></div></TableCell>
                <TableCell>{c.courseId?.name || 'N/A'}</TableCell>
                <TableCell><span className={`badge ${c.status === 'issued' ? 'badge-success' : c.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{c.status}</span></TableCell>
                <TableCell>{c.certificateNo || '-'}</TableCell>
                <TableCell>{c.grade || '-'}</TableCell>
                <TableCell>{new Date(c.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>{c.verificationCode && <a href={`/verify-certificate?code=${c.verificationCode}`} target="_blank" rel="noreferrer" className="text-primary-600 text-sm hover:underline">Verify</a>}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Request Certificate" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Student *</label><select required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="input-field"><option value="">Select...</option>{students.map(s => <option key={s._id} value={s._id}>{s.fullName} - {s.phone}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Course *</label><select required value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field"><option value="">Select...</option>{courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
          <button type="submit" className="btn-primary w-full">Send Request to Admin</button>
        </form>
      </Modal>
    </div>
  );
}
