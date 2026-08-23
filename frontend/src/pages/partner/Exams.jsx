import { useState, useEffect } from 'react';
import { getExams, getExam, createExam, updateExam, deleteExam, submitExamResults } from '../../api';
import { getBatches, getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, FileText, Award, Trash2, Pencil, Settings, Eye, ChevronUp, ChevronDown, ListChecks, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';

const emptyQuestion = { type: 'mcq', questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1, negativeMarks: 0, explanation: '' };
const emptyExamSettings = {
  durationMinutes: 60,
  isOnline: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultsImmediately: true,
  allowRetake: false,
  maxRetakes: 0,
  negativeMarkingEnabled: false,
  instructions: 'Read all questions carefully before answering.',
};

export default function PartnerExams() {
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showResults, setShowResults] = useState(null);
  const [results, setResults] = useState({});
  const [editingExam, setEditingExam] = useState(null);
  const [viewExam, setViewExam] = useState(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '', batchId: '', courseId: '', examType: 'internal', date: new Date().toISOString().split('T')[0],
    maxMarks: 100, passingMarks: 40, syllabus: '',
    questions: [], examSettings: { ...emptyExamSettings },
  });

  const load = () => {
    getExams().then(res => { setExams(res.data.exams); setLoading(false); }).catch(() => setLoading(false));
    getBatches().then(res => setBatches(res.data.batches)).catch(() => {});
    getCourses().then(res => setCourses(res.data.courses)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFormData({ name: '', batchId: '', courseId: '', examType: 'internal', date: new Date().toISOString().split('T')[0],
      maxMarks: 100, passingMarks: 40, syllabus: '', questions: [], examSettings: { ...emptyExamSettings } });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.questions.length) { showError('Add at least one question'); return; }
    try {
      await createExam(formData);
      showSuccess('Exam created with ' + formData.questions.length + ' questions');
      setShowAdd(false); resetForm(); load();
    } catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateExam(editingExam._id, formData);
      showSuccess('Exam updated');
      setEditingExam(null); resetForm(); load();
    } catch (error) { showError('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam? All submissions will be lost.')) return;
    try { await deleteExam(id); showSuccess('Exam deleted'); load(); }
    catch (error) { showError('Failed'); }
  };

  const startEdit = async (exam) => {
    try {
      const res = await getExam(exam._id);
      const ex = res.data.exam;
      setFormData({
        name: ex.name, batchId: ex.batchId?._id || '', courseId: ex.courseId?._id || '',
        examType: ex.examType, date: new Date(ex.date).toISOString().split('T')[0],
        maxMarks: ex.maxMarks, passingMarks: ex.passingMarks, syllabus: ex.syllabus || '',
        questions: ex.questions || [],
        examSettings: { ...emptyExamSettings, ...(ex.examSettings || {}) },
      });
      setEditingExam(exam);
    } catch (error) { showError('Failed to load exam'); }
  };

  const handleResults = async () => {
    const resultsArr = Object.entries(results).map(([studentId, marksObtained]) => {
      const num = Number(marksObtained);
      return { studentId, marksObtained: num, status: num >= showResults.passingMarks ? 'pass' : 'fail', grade: num >= 90 ? 'A+' : num >= 80 ? 'A' : num >= 70 ? 'B' : num >= 60 ? 'C' : num >= showResults.passingMarks ? 'D' : 'F' };
    });
    try { await submitExamResults(showResults._id, resultsArr); showSuccess('Results declared'); setShowResults(null); load(); }
    catch (error) { showError('Failed'); }
  };

  // Question management
  const addQuestion = () => setFormData(d => ({ ...d, questions: [...d.questions, { ...emptyQuestion, options: ['', '', '', ''] }] }));
  const removeQuestion = (i) => setFormData(d => ({ ...d, questions: d.questions.filter((_, idx) => idx !== i) }));
  const moveQuestion = (i, dir) => setFormData(d => {
    const qs = [...d.questions]; const ni = i + dir;
    if (ni < 0 || ni >= qs.length) return d;
    [qs[i], qs[ni]] = [qs[ni], qs[i]]; return { ...d, questions: qs };
  });
  const updateQuestion = (i, key, val) => setFormData(d => {
    const qs = [...d.questions]; qs[i] = { ...qs[i], [key]: val }; return { ...d, questions: qs };
  });
  const updateOption = (qi, oi, val) => setFormData(d => {
    const qs = [...d.questions]; const opts = [...qs[qi].options]; opts[oi] = val;
    qs[qi] = { ...qs[qi], options: opts }; return { ...d, questions: qs };
  });
  const addOption = (qi) => setFormData(d => {
    const qs = [...d.questions]; qs[qi] = { ...qs[qi], options: [...qs[qi].options, ''] };
    return { ...d, questions: qs };
  });
  const removeOption = (qi, oi) => setFormData(d => {
    const qs = [...d.questions];
    const opts = qs[qi].options.filter((_, idx) => idx !== oi);
    let correct = qs[qi].correctOptionIndex;
    if (correct === oi) correct = 0;
    else if (correct > oi) correct--;
    qs[qi] = { ...qs[qi], options: opts, correctOptionIndex: correct };
    return { ...d, questions: qs };
  });
  const updateSettings = (key, val) => setFormData(d => ({ ...d, examSettings: { ...d.examSettings, [key]: val } }));

  const totalMarks = formData.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const renderQuestionEditor = (q, i) => (
    <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Q{i + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
          <button type="button" onClick={() => moveQuestion(i, 1)} disabled={i === formData.questions.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
          <button type="button" onClick={() => removeQuestion(i)} className="text-red-500 hover:text-red-700 ml-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="input-field text-sm">
          <option value="mcq">Multiple Choice</option>
          <option value="true_false">True / False</option>
          <option value="subjective">Subjective (Text)</option>
        </select>
        <input type="number" min="1" placeholder="Marks" value={q.marks} onChange={(e) => updateQuestion(i, 'marks', +e.target.value)} className="input-field text-sm" />
        {formData.examSettings.negativeMarkingEnabled && (
          <input type="number" min="0" placeholder="Neg. Marks" value={q.negativeMarks} onChange={(e) => updateQuestion(i, 'negativeMarks', +e.target.value)} className="input-field text-sm" />
        )}
      </div>
      <textarea rows="3" required placeholder="Enter question text (supports line breaks, formatting)..." value={q.questionText}
        onChange={(e) => updateQuestion(i, 'questionText', e.target.value)}
        className="input-field text-sm font-medium" />

      {q.type === 'mcq' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500">Options (select correct answer):</p>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input type="radio" name={`correct-${i}`} checked={q.correctOptionIndex === oi}
                onChange={() => updateQuestion(i, 'correctOptionIndex', oi)} className="w-4 h-4 text-indigo-600" />
              <input type="text" placeholder={`Option ${oi + 1}`} value={opt}
                onChange={(e) => updateOption(i, oi, e.target.value)} className="input-field text-sm flex-1" />
              {q.options.length > 2 && <button type="button" onClick={() => removeOption(i, oi)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
            </div>
          ))}
          {q.options.length < 6 && <button type="button" onClick={() => addOption(i)} className="text-xs text-indigo-600 hover:underline font-medium">+ Add Option</button>}
        </div>
      )}

      {q.type === 'true_false' && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="radio" name={`tf-${i}`} checked={q.correctOptionIndex === 0} onChange={() => updateQuestion(i, 'correctOptionIndex', 0)} className="w-4 h-4" /> True</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" name={`tf-${i}`} checked={q.correctOptionIndex === 1} onChange={() => updateQuestion(i, 'correctOptionIndex', 1)} className="w-4 h-4" /> False</label>
        </div>
      )}

      {q.type === 'subjective' && (
        <p className="text-xs text-slate-400 italic">Subjective questions require manual grading after exam submission.</p>
      )}

      <textarea rows="2" placeholder="Explanation (shown after exam if results are immediate)..." value={q.explanation}
        onChange={(e) => updateQuestion(i, 'explanation', e.target.value)} className="input-field text-sm" />
    </div>
  );

  const renderExamForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleUpdate : handleAdd} className="space-y-5">
      {/* Basic Info */}
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

      {/* Exam Settings */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3"><Settings className="w-4 h-4 text-slate-500" /><h4 className="font-semibold text-sm">Exam Settings</h4></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium mb-1">Duration (minutes)</label><input type="number" min="1" value={formData.examSettings.durationMinutes} onChange={(e) => updateSettings('durationMinutes', +e.target.value)} className="input-field text-sm" /></div>
          <div><label className="block text-xs font-medium mb-1">Max Retakes</label><input type="number" min="0" value={formData.examSettings.maxRetakes} onChange={(e) => updateSettings('maxRetakes', +e.target.value)} className="input-field text-sm" disabled={!formData.examSettings.allowRetake} /></div>
        </div>
        <div><label className="block text-xs font-medium mb-1 mt-2">Instructions for Students</label><textarea rows="2" value={formData.examSettings.instructions} onChange={(e) => updateSettings('instructions', e.target.value)} className="input-field text-sm" /></div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.isOnline} onChange={(e) => updateSettings('isOnline', e.target.checked)} /> Online Exam</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.shuffleQuestions} onChange={(e) => updateSettings('shuffleQuestions', e.target.checked)} /> Shuffle Questions</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.shuffleOptions} onChange={(e) => updateSettings('shuffleOptions', e.target.checked)} /> Shuffle Options</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.showResultsImmediately} onChange={(e) => updateSettings('showResultsImmediately', e.target.checked)} /> Show Results Immediately</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.allowRetake} onChange={(e) => updateSettings('allowRetake', e.target.checked)} /> Allow Retake</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.examSettings.negativeMarkingEnabled} onChange={(e) => updateSettings('negativeMarkingEnabled', e.target.checked)} /> Negative Marking</label>
        </div>
      </div>

      {/* Questions Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><ListChecks className="w-4 h-4 text-slate-500" /><h4 className="font-semibold text-sm">Questions ({formData.questions.length})</h4></div>
          <span className="text-xs text-slate-400">Total Marks: {totalMarks}</span>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {formData.questions.map((q, i) => renderQuestionEditor(q, i))}
        </div>
        <button type="button" onClick={addQuestion} className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <button type="submit" className="btn-primary w-full">{isEdit ? 'Update Exam' : 'Create Exam'}</button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Exams & Tests</h1><p className="text-gray-500">Create online exams with questions, manage results</p></div>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Exam</button>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : exams.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No exams yet. Create your first exam!</p></div>
        ) : (
          <Table headers={['Exam', 'Batch', 'Course', 'Date', 'Type', 'Questions', 'Status', 'Actions']}>
            {exams.map(ex => (
              <TableRow key={ex._id}>
                <TableCell><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /><span className="font-medium">{ex.name}</span></div></TableCell>
                <TableCell>{ex.batchId?.name || 'N/A'}</TableCell>
                <TableCell>{ex.courseId?.name || 'N/A'}</TableCell>
                <TableCell>{new Date(ex.date).toLocaleDateString()}</TableCell>
                <TableCell className="capitalize">{ex.examType}</TableCell>
                <TableCell><span className="badge badge-info">{ex.questions?.length || 0}</span></TableCell>
                <TableCell><span className={`badge ${ex.status === 'result_declared' ? 'badge-success' : ex.status === 'ongoing' ? 'badge-info' : ex.status === 'completed' ? 'badge-warning' : 'badge-warning'}`}>{ex.status.replace('_', ' ')}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewExam(ex)} className="text-blue-600 hover:text-blue-800" title="View"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => startEdit(ex)} className="text-indigo-600 hover:text-indigo-800" title="Edit"><Pencil className="w-4 h-4" /></button>
                    {ex.status !== 'result_declared' && <button onClick={() => { setShowResults(ex); const init = {}; ex.batchId?.enrolledStudents?.forEach(s => init[s._id] = ''); setResults(init); }} className="text-green-600 hover:text-green-800" title="Enter Results"><Award className="w-4 h-4" /></button>}
                    <button onClick={() => handleDelete(ex._id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {/* Create Exam Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create New Exam" size="xl">
        {renderExamForm(false)}
      </Modal>

      {/* Edit Exam Modal */}
      <Modal isOpen={!!editingExam} onClose={() => { setEditingExam(null); resetForm(); }} title={`Edit: ${editingExam?.name || ''}`} size="xl">
        {renderExamForm(true)}
      </Modal>

      {/* View Exam Modal */}
      {viewExam && (
        <Modal isOpen={true} onClose={() => setViewExam(null)} title={viewExam.name} size="lg">
          <ExamDetailView examId={viewExam._id} />
        </Modal>
      )}

      {/* Results Modal */}
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

function ExamDetailView({ examId }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExam(examId).then(res => { setExam(res.data.exam); setLoading(false); }).catch(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="text-center py-6 text-gray-400">Loading...</div>;
  if (!exam) return <div className="text-center py-6 text-gray-400">Exam not found</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Type</p><p className="font-medium capitalize">{exam.examType}</p></div>
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Date</p><p className="font-medium">{new Date(exam.date).toLocaleDateString()}</p></div>
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Max Marks</p><p className="font-medium">{exam.maxMarks}</p></div>
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Passing Marks</p><p className="font-medium">{exam.passingMarks}</p></div>
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Duration</p><p className="font-medium">{exam.examSettings?.durationMinutes || 60} min</p></div>
        <div className="bg-slate-50 p-3 rounded-lg"><p className="text-xs text-slate-400">Questions</p><p className="font-medium">{exam.questions?.length || 0}</p></div>
      </div>

      {exam.examSettings?.instructions && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">{exam.examSettings.instructions}</p>
        </div>
      )}

      <div className="border-t pt-3">
        <h4 className="font-semibold text-sm mb-3">Questions Preview</h4>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {(exam.questions || []).map((q, i) => (
            <div key={q._id || i} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600">Q{i + 1} · {q.type.replace('_', ' ')}</span>
                <span className="text-xs text-slate-400">{q.marks} marks</span>
              </div>
              <p className="text-sm font-medium mb-2 whitespace-pre-wrap">{q.questionText}</p>
              {q.type === 'mcq' && q.options?.map((opt, oi) => (
                <div key={oi} className={`text-sm pl-3 ${oi === q.correctOptionIndex ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                  {String.fromCharCode(65 + oi)}. {opt} {oi === q.correctOptionIndex && <CheckCircle className="w-3 h-3 inline ml-1" />}
                </div>
              ))}
              {q.type === 'true_false' && (
                <div className="text-sm pl-3">
                  <span className={q.correctOptionIndex === 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>True</span>
                  {' | '}
                  <span className={q.correctOptionIndex === 1 ? 'text-green-600 font-medium' : 'text-slate-400'}>False</span>
                </div>
              )}
              {q.explanation && <p className="text-xs text-slate-400 italic mt-2">Explanation: {q.explanation}</p>}
            </div>
          ))}
        </div>
      </div>

      {exam.submissions?.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="font-semibold text-sm mb-3">Student Submissions ({exam.submissions.length})</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {exam.submissions.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm">
                <span className="font-medium">{s.studentId?.fullName || 'Student'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{s.totalMarksAwarded}/{exam.maxMarks}</span>
                  <span className={`badge ${s.status === 'pass' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span>
                  <span className="text-xs text-slate-400">{s.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
