import { useState, useEffect } from 'react';
import { getExams, createExam, submitExamResults } from '../../api';
import { getBatches, getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, FileText, Award } from 'lucide-react';

export default function PartnerExams() {
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showResults, setShowResults] = useState(null);
  const [results, setResults] = useState({});
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ name: '', batchId: '', courseId: '', examType: 'internal', date: new Date().toISOString().split('T')[0], maxMarks: 100, passingMarks: 40, syllabus: '' });

  const load = () => {
    getExams().then(res => { setExams(res.data.exams); setLoading(false); }).catch(() => setLoading(false));
    getBatches().then(res => setBatches(res.data.batches)).catch(() => {});
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await createExam(formData); showSuccess('Exam created'); setShowAdd(false); setFormData({ name: '', batchId: '', courseId: '', examType: 'internal', date: new Date().toISOString().split('T')[0], maxMarks: 100, passingMarks: 40, syllabus: '' }); load(); }
    catch (error) { showError('Failed'); }
  };

  const handleResults = async () => {
    const resultsArr = Object.entries(results).map(([studentId, marksObtained]) => {
      const num = Number(marksObtained);
      return { studentId, marksObtained: num, status: num >= showResults.passingMarks ? 'pass' : 'fail', grade: num >= 90 ? 'A+' : num >= 80 ? 'A' : num >= 70 ? 'B' : num >= 60 ? 'C' : num >= showResults.passingMarks ? 'D' : 'F' };
    });
    try { await submitExamResults(showResults._id, resultsArr); showSuccess('Results declared'); setShowResults(null); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Exams</h1><p className="text-gray-500">Create exams & declare results</p></div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Exam</button>
      </div>
      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Exam', 'Batch', 'Course', 'Date', 'Type', 'Status', 'Actions']}>
            {exams.map(ex => (
              <TableRow key={ex._id}>
                <TableCell><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /><span className="font-medium">{ex.name}</span></div></TableCell>
                <TableCell>{ex.batchId?.name || 'N/A'}</TableCell>
                <TableCell>{ex.courseId?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(ex.date).toLocaleDateString()}</TableCell>
                <TableCell className="capitalize">{ex.examType}</TableCell>
                <TableCell><span className={`badge ${ex.status === 'result_declared' ? 'badge-success' : ex.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{ex.status.replace('_', ' ')}</span></TableCell>
                <TableCell>{ex.status !== 'result_declared' && <button onClick={() => { setShowResults(ex); const init = {}; ex.batchId?.enrolledStudents?.forEach(s => init[s._id] = ''); setResults(init); }} className="text-primary-600 hover:text-primary-800"><Award className="w-4 h-4" /></button>}</TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Exam" size="lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Exam Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Type</label><select value={formData.examType} onChange={(e) => setFormData({ ...formData, examType: e.target.value })} className="input-field"><option value="internal">Internal</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="external">External</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Batch *</label><select required value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="input-field"><option value="">Select...</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Course</label><select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field"><option value="">Select...</option>{courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Date *</label><input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Max Marks</label><input type="number" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Passing Marks</label><input type="number" value={formData.passingMarks} onChange={(e) => setFormData({ ...formData, passingMarks: +e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Syllabus</label><textarea rows="2" value={formData.syllabus} onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })} className="input-field" /></div>
          <button type="submit" className="btn-primary w-full">Create Exam</button>
        </form>
      </Modal>

      {showResults && (
        <Modal isOpen={true} onClose={() => setShowResults(null)} title={`Enter Results: ${showResults.name}`} size="md">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Max: {showResults.maxMarks} | Pass: {showResults.passingMarks}</p>
            {showResults.batchId?.enrolledStudents?.map(s => (
              <div key={s._id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.fullName}</span>
                <input type="number" min="0" max={showResults.maxMarks} placeholder="Marks" value={results[s._id] || ''} onChange={(e) => setResults({ ...results, [s._id]: e.target.value })} className="w-24 px-3 py-1.5 border rounded-lg text-sm" />
              </div>
            ))}
            <button onClick={handleResults} className="btn-primary w-full">Declare Results</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
