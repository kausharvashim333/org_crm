import { useState, useEffect } from 'react';
import { getExams, getExam, createExam, updateExam, deleteExam, submitExamResults, getExamAnalytics, gradeSubmission, getQuestionBank, createQuestion, bulkCreateQuestions, deleteQuestion } from '../../api';
import { getBatches, getCourses } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import RichTextEditor from '../../components/RichTextEditor';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Plus, FileText, Award, Trash2, Pencil, Settings, Eye, ChevronUp, ChevronDown, ListChecks, Clock, AlertCircle, CheckCircle, X, BarChart3, ShieldAlert, Search, Upload, BookMarked, GraduationCap, Flag } from 'lucide-react';

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
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankFilter, setBankFilter] = useState({ type: '', category: '', difficulty: '' });
  const [showAddToBank, setShowAddToBank] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [showGradeModal, setShowGradeModal] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
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

  // Question Bank functions
  const loadBankQuestions = () => {
    setBankLoading(true);
    const params = {};
    if (bankSearch) params.search = bankSearch;
    if (bankFilter.type) params.type = bankFilter.type;
    if (bankFilter.difficulty) params.difficulty = bankFilter.difficulty;
    getQuestionBank(params).then(res => { setBankQuestions(res.data.questions); setBankLoading(false); }).catch(() => setBankLoading(false));
  };

  const addFromBank = (bankQ) => {
    setFormData(d => ({
      ...d,
      questions: [...d.questions, {
        type: bankQ.type,
        questionText: bankQ.questionText,
        options: bankQ.options?.length ? [...bankQ.options] : ['', '', '', ''],
        correctOptionIndex: bankQ.correctOptionIndex ?? 0,
        marks: bankQ.marks || 1,
        negativeMarks: bankQ.negativeMarks || 0,
        explanation: bankQ.explanation || '',
      }],
    }));
    showSuccess('Question added from bank');
  };

  const saveToBank = (q) => {
    createQuestion({
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      explanation: q.explanation,
      category: 'General',
      difficulty: 'medium',
    }).then(() => showSuccess('Saved to Question Bank')).catch(() => showError('Failed to save'));
  };

  const handleImportCSV = async () => {
    try {
      const lines = csvText.trim().split('\n');
      const questions = lines.map(line => {
        const parts = line.split('\t');
        return {
          type: parts[0] || 'mcq',
          questionText: parts[1] || '',
          options: parts[2] ? parts[2].split('|') : ['', '', '', ''],
          correctOptionIndex: parseInt(parts[3]) || 0,
          marks: parseInt(parts[4]) || 1,
          category: parts[5] || 'General',
          difficulty: parts[6] || 'medium',
          explanation: parts[7] || '',
        };
      }).filter(q => q.questionText);
      if (!questions.length) { showError('No valid questions found'); return; }
      await bulkCreateQuestions(questions);
      showSuccess(`${questions.length} questions imported`);
      setShowImportCSV(false); setCsvText(''); loadBankQuestions();
    } catch (error) { showError('Import failed'); }
  };

  const handleDeleteBankQuestion = async (id) => {
    if (!confirm('Delete this question from bank?')) return;
    try { await deleteQuestion(id); showSuccess('Deleted'); loadBankQuestions(); }
    catch (error) { showError('Failed'); }
  };

  const handleManualGrade = async (studentId, grades) => {
    try {
      await gradeSubmission(showGradeModal.exam._id, studentId, grades);
      showSuccess('Grades updated');
      setShowGradeModal(null); load();
    } catch (error) { showError('Failed to grade'); }
  };

  const totalMarks = formData.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const renderQuestionEditor = (q, i) => (
    <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Q{i + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
          <button type="button" onClick={() => moveQuestion(i, 1)} disabled={i === formData.questions.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
          <button type="button" onClick={() => saveToBank(q)} className="text-indigo-400 hover:text-indigo-600 ml-1" title="Save to Question Bank"><BookMarked className="w-4 h-4" /></button>
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
      <RichTextEditor value={q.questionText} onChange={(val) => updateQuestion(i, 'questionText', val)} placeholder="Enter question text (supports bold, italic, lists, images, code blocks)..." rows={3} />

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
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={addQuestion} className="flex-1 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button type="button" onClick={() => { loadBankQuestions(); setShowQuestionBank(true); }} className="px-4 py-2.5 border-2 border-dashed border-indigo-200 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
            <BookMarked className="w-4 h-4" /> From Bank
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-all"><Eye className="w-4 h-4" /> Preview Exam</button>
        <button type="submit" className="btn-primary flex items-center gap-2">{isEdit ? 'Update Exam' : 'Create Exam'}</button>
      </div>
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
                    <button onClick={() => setShowAnalytics(ex)} className="text-purple-600 hover:text-purple-800" title="Analytics"><BarChart3 className="w-4 h-4" /></button>
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

      {/* Question Bank Modal */}
      <Modal isOpen={showQuestionBank} onClose={() => setShowQuestionBank(false)} title="Question Bank - Pick Questions" size="xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search questions..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadBankQuestions()} className="input-field text-sm pl-9" />
            </div>
            <select value={bankFilter.type} onChange={(e) => setBankFilter({ ...bankFilter, type: e.target.value })} className="input-field text-sm w-auto">
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="true_false">True/False</option>
              <option value="subjective">Subjective</option>
            </select>
            <select value={bankFilter.difficulty} onChange={(e) => setBankFilter({ ...bankFilter, difficulty: e.target.value })} className="input-field text-sm w-auto">
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button onClick={loadBankQuestions} className="btn-primary text-sm px-4">Search</button>
            <button onClick={() => { setShowQuestionBank(false); setShowImportCSV(true); }} className="flex items-center gap-1 text-sm px-3 py-2 border rounded-lg text-indigo-600 hover:bg-indigo-50"><Upload className="w-4 h-4" /> Import CSV</button>
          </div>

          {bankLoading ? <div className="text-center py-8 text-slate-400">Loading...</div> : bankQuestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><BookMarked className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No questions in bank yet</p></div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {bankQuestions.map(bq => (
                <div key={bq._id} className="border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{bq.type.replace('_', '/')}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">{bq.difficulty}</span>
                      <span className="text-[10px] text-slate-400">{bq.marks} marks</span>
                      {bq.category && <span className="text-[10px] text-slate-400">· {bq.category}</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: bq.questionText }} />
                    {bq.type === 'mcq' && bq.options?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">Correct: {bq.options[bq.correctOptionIndex] || 'N/A'}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => addFromBank(bq)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50">+ Add</button>
                    <button onClick={() => handleDeleteBankQuestion(bq._id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal isOpen={showImportCSV} onClose={() => setShowImportCSV(false)} title="Import Questions via CSV/TSV" size="lg">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            <p className="font-bold mb-1">Format (tab-separated, one question per line):</p>
            <p>type \t questionText \t options (pipe-separated) \t correctIndex \t marks \t category \t difficulty \t explanation</p>
            <p className="mt-1 text-blue-500">Example: mcq \t What is 2+2? \t 3|4|5|6 \t 1 \t 1 \t Math \t easy \t Basic addition</p>
          </div>
          <textarea rows="8" placeholder="Paste TSV data here..." value={csvText} onChange={(e) => setCsvText(e.target.value)} className="input-field text-sm font-mono" />
          <button onClick={handleImportCSV} className="btn-primary w-full flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import Questions</button>
        </div>
      </Modal>

      {/* Analytics Modal */}
      {showAnalytics && (
        <Modal isOpen={true} onClose={() => setShowAnalytics(null)} title={`Analytics: ${showAnalytics.name}`} size="xl">
          <ExamAnalytics examId={showAnalytics._id} onGrade={(exam) => setShowGradeModal({ exam })} />
        </Modal>
      )}

      {/* Manual Grading Modal */}
      {showGradeModal && (
        <Modal isOpen={true} onClose={() => setShowGradeModal(null)} title="Manual Grading - Subjective Answers" size="lg">
          <ManualGrading examId={showGradeModal.exam._id} onGrade={handleManualGrade} />
        </Modal>
      )}

      {/* Exam Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Student Exam Preview" size="xl">
        <ExamPreview formData={formData} />
      </Modal>
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

function ExamAnalytics({ examId, onGrade }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    getExamAnalytics(examId).then(res => { setData(res.data.analytics); setLoading(false); }).catch(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="text-center py-6 text-slate-400">Loading analytics...</div>;
  if (!data) return <div className="text-center py-6 text-slate-400">No data</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('overview')} className={`px-3 py-2 text-sm font-medium ${tab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Overview</button>
        <button onClick={() => setTab('questions')} className={`px-3 py-2 text-sm font-medium ${tab === 'questions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Question Analysis</button>
        <button onClick={() => setTab('students')} className={`px-3 py-2 text-sm font-medium ${tab === 'students' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Students</button>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Submissions</p>
              <p className="text-xl font-black text-slate-700">{data.totalSubmissions}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pass Rate</p>
              <p className="text-xl font-black text-emerald-600">{data.passRate}%</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</p>
              <p className="text-xl font-black text-indigo-600">{data.avgScore}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Time</p>
              <p className="text-xl font-black text-amber-600">{data.avgTimeSpent}m</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Passed</p>
              <p className="text-lg font-bold text-emerald-600">{data.passedCount}</p>
            </div>
            <div className="bg-white border rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Failed</p>
              <p className="text-lg font-bold text-red-500">{data.failedCount}</p>
            </div>
            <div className="bg-white border rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1"><ShieldAlert className="w-3 h-3" /> Tab Switches</p>
              <p className="text-lg font-bold text-red-500">{data.totalTabSwitches}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Highest Score</p>
              <p className="text-lg font-bold text-slate-700">{data.maxScore}</p>
            </div>
            <div className="bg-white border rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Lowest Score</p>
              <p className="text-lg font-bold text-slate-700">{data.minScore}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.questionAnalysis.map((qa, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600">Q{qa.questionIndex + 1} · {qa.type.replace('_', ' ')}</span>
                <span className="text-xs text-slate-400">{qa.marks} marks</span>
              </div>
              <p className="text-sm text-slate-700 mb-2" dangerouslySetInnerHTML={{ __html: qa.questionText }} />
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-600 font-medium">Correct: {qa.correctCount} ({qa.correctPercentage}%)</span>
                <span className="text-slate-500">Attempted: {qa.attemptedCount}</span>
                <span className="text-slate-400">Unattempted: {qa.unattemptedCount}</span>
                <span className="text-indigo-600">Avg: {qa.avgMarks}</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${qa.correctPercentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.studentPerformance.map((sp, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{sp.studentName}</p>
                <p className="text-xs text-slate-400">{sp.studentPhone}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{sp.totalMarksAwarded}/{sp.maxMarks}</p>
                  <p className="text-xs text-slate-400">{sp.percentage}% · {sp.timeSpentMinutes}m</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sp.status === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{sp.status.toUpperCase()}</span>
                {sp.tabSwitchCount > 0 && <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500"><ShieldAlert className="w-3 h-3" />{sp.tabSwitchCount}</span>}
              </div>
            </div>
          ))}
          <button onClick={() => onGrade({ _id: examId })} className="btn-primary w-full text-sm flex items-center justify-center gap-2 mt-3">
            <GraduationCap className="w-4 h-4" /> Grade Subjective Answers
          </button>
        </div>
      )}
    </div>
  );
}

function ManualGrading({ examId, onGrade }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    getExam(examId).then(res => {
      setExam(res.data.exam);
      const subs = res.data.exam.submissions || [];
      if (subs.length > 0) setSelectedStudent(subs[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="text-center py-6 text-slate-400">Loading...</div>;
  if (!exam) return <div className="text-center py-6 text-slate-400">Exam not found</div>;

  const submissions = exam.submissions || [];
  const subjectiveQuestions = (exam.questions || []).filter(q => q.type === 'subjective');

  if (!subjectiveQuestions.length) {
    return <div className="text-center py-6 text-slate-400">No subjective questions in this exam</div>;
  }

  const currentSub = submissions.find(s => s.studentId?._id === selectedStudent?.studentId?._id || s.studentId === selectedStudent?.studentId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {submissions.map((s, i) => {
          const name = s.studentId?.fullName || 'Student';
          return (
            <button key={i} onClick={() => { setSelectedStudent(s); setGrades({}); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${(selectedStudent?.studentId?._id || selectedStudent?.studentId) === (s.studentId?._id || s.studentId) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {name}
            </button>
          );
        })}
      </div>

      {currentSub && (
        <div className="space-y-3">
          {subjectiveQuestions.map((q, qi) => {
            const ans = currentSub.answers?.find(a => a.questionId?.toString() === q._id?.toString());
            return (
              <div key={qi} className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600">Q{exam.questions.indexOf(q) + 1} · Subjective · {q.marks} marks</span>
                </div>
                <p className="text-sm font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-xs text-slate-400 mb-1">Student's Answer:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{ans?.textAnswer || 'No answer provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-600">Award Marks:</label>
                  <input type="number" min="0" max={q.marks} placeholder="0" defaultValue={ans?.marksAwarded || 0}
                    onChange={(e) => setGrades(g => ({ ...g, [q._id]: +e.target.value }))}
                    className="w-20 px-2 py-1 border rounded-lg text-sm" />
                  <span className="text-xs text-slate-400">/ {q.marks}</span>
                </div>
              </div>
            );
          })}
          <button onClick={() => {
            const gradeArr = Object.entries(grades).map(([questionId, marksAwarded]) => ({ questionId, marksAwarded }));
            const sid = currentSub.studentId?._id || currentSub.studentId;
            onGrade(sid, gradeArr);
          }} className="btn-primary w-full">Save Grades</button>
        </div>
      )}
    </div>
  );
}

function ExamPreview({ formData }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const questions = formData.questions || [];
  const settings = formData.examSettings || {};
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  if (!questions.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No questions added yet to preview</p>
        <p className="text-xs mt-1">Add some questions first, then click Preview</p>
      </div>
    );
  }

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length;
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-0 -mt-2">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">This is a preview of how students will see this exam. Answers are not saved.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{formData.name || 'Untitled Exam'}</h3>
          <p className="text-xs text-slate-400">{questions.length} questions · {totalMarks} marks</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
          <Clock className="w-4 h-4" />
          {formatTime((settings.durationMinutes || 60) * 60)}
        </div>
      </div>

      {settings.instructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">{settings.instructions}</p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Question {currentQ + 1} of {questions.length}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{q.marks} mark{(q.marks || 0) > 1 ? 's' : ''}</span>
              <button onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(currentQ) ? n.delete(currentQ) : n.add(currentQ); return n; })}
                className={`p-1.5 rounded-lg ${flagged.has(currentQ) ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:text-amber-500'}`}>
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-4 text-sm font-medium text-slate-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.questionText || 'No question text' }} />

          {q.type === 'mcq' && (
            <div className="space-y-2">
              {q.options?.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${answers[currentQ] === oi ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name={`preview-${currentQ}`} checked={answers[currentQ] === oi} onChange={() => setAnswers(a => ({ ...a, [currentQ]: oi }))} className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-700">{opt || `Option ${oi + 1}`}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'true_false' && (
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${answers[currentQ] === 0 ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="radio" name={`preview-tf-${currentQ}`} checked={answers[currentQ] === 0} onChange={() => setAnswers(a => ({ ...a, [currentQ]: 0 }))} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">True</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${answers[currentQ] === 1 ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                <input type="radio" name={`preview-tf-${currentQ}`} checked={answers[currentQ] === 1} onChange={() => setAnswers(a => ({ ...a, [currentQ]: 1 }))} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">False</span>
              </label>
            </div>
          )}

          {q.type === 'subjective' && (
            <textarea rows={4} placeholder="Student will type their answer here..." value={answers[currentQ] || ''} onChange={(e) => setAnswers(a => ({ ...a, [currentQ]: e.target.value }))} className="input-field text-sm w-full" />
          )}

          {(q.type === 'mcq' || q.type === 'true_false') && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-slate-500">Correct answer: <span className="font-bold text-emerald-600">{q.type === 'true_false' ? (q.correctOptionIndex === 0 ? 'True' : 'False') : (q.options?.[q.correctOptionIndex] || 'N/A')}</span></p>
            </div>
          )}
          {q.explanation && (
            <div className="mt-2 bg-blue-50 rounded-lg p-2 text-xs text-blue-600"><span className="font-bold">Explanation:</span> {q.explanation}</div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30">
              <ChevronUp className="w-4 h-4 rotate-90" /> Previous
            </button>
            <span className="text-xs text-slate-400">{answeredCount} answered</span>
            <button onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))} disabled={currentQ === questions.length - 1} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30">
              Next <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block w-48 bg-white border border-slate-200 rounded-xl p-3 h-fit sticky top-0">
          <p className="text-xs font-bold text-slate-500 mb-2">Navigator</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all
                  ${i === currentQ ? 'bg-indigo-600 text-white' :
                    answers[i] !== undefined && answers[i] !== '' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                    flagged.has(i) ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                    'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Answered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Flagged</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-100" /> Unanswered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
