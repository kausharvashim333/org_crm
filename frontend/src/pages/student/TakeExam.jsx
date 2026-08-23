import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamQuestions, submitExamAnswers } from '../../api';
import { Clock, AlertCircle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Flag, Award } from 'lucide-react';

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [flagged, setFlagged] = useState(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    getExamQuestions(examId).then(res => {
      setExam(res.data.exam);
      setQuestions(res.data.questions);
      setStartedAt(new Date().toISOString());
      setTimeLeft((res.data.exam.durationMinutes || 60) * 60);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load exam');
      setLoading(false);
    });
  }, [examId]);

  const submitExam = useCallback(async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const answerArr = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptionIndex: typeof ans === 'number' ? ans : -1,
        textAnswer: typeof ans === 'string' ? ans : '',
      }));
      const res = await submitExamAnswers(examId, { answers: answerArr, startedAt });
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  }, [answers, examId, startedAt, submitting]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft === null, result, submitExam]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const selectAnswer = (qId, optionIndex) => setAnswers(a => ({ ...a, [qId]: optionIndex }));
  const setTextAnswer = (qId, text) => setAnswers(a => ({ ...a, [qId]: text }));
  const toggleFlag = (qId) => setFlagged(prev => { const n = new Set(prev); n.has(qId) ? n.delete(qId) : n.add(qId); return n; });

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length;
  const isLowTime = timeLeft !== null && timeLeft < 60;

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Cannot Start Exam</h2>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button onClick={() => navigate('/student/dashboard')} className="btn-primary w-full">Back to Dashboard</button>
      </div>
    </div>
  );

  if (result) {
    const isPass = result.status === 'pass';
    const isSubmitted = result.status === 'submitted';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {isSubmitted ? (
            <>
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">Exam Submitted!</h2>
              <p className="text-slate-500 mb-6">{result.message || 'Your answers have been recorded.'}</p>
            </>
          ) : (
            <>
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isPass ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {isPass ? <CheckCircle className="w-12 h-12 text-emerald-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">{isPass ? 'Passed!' : 'Failed'}</h2>
              <p className="text-sm text-slate-400 mb-6">{exam.name}</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-bold uppercase">Score</p>
                  <p className="text-2xl font-black text-indigo-600">{result.totalMarksAwarded}/{result.maxMarks}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-bold uppercase">Grade</p>
                  <p className="text-2xl font-black text-slate-700">{result.grade}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-bold uppercase">Percentage</p>
                  <p className="text-2xl font-black text-slate-700">{result.percentage}%</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-6">
                <span>Correct: {result.correctCount}/{result.totalQuestions}</span>
                <span>·</span>
                <span>Time: {result.timeSpentMinutes} min</span>
              </div>
            </>
          )}
          <button onClick={() => navigate('/student/dashboard')} className="btn-primary w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const qId = q?._id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (confirm('Leave exam? Your progress will be lost.')) navigate('/student/dashboard'); }} className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-800">{exam.name}</h1>
            <p className="text-xs text-slate-400">{exam.courseName} · {exam.totalQuestions} questions</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-sm ${isLowTime ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
          <Clock className="w-4 h-4" />
          {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      {/* Instructions */}
      {exam.instructions && currentQ === 0 && !answeredCount && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">{exam.instructions}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full gap-4 p-4">
        {/* Question Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">Question {currentQ + 1} of {questions.length}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{q?.marks} mark{(q?.marks || 0) > 1 ? 's' : ''}</span>
              <button onClick={() => toggleFlag(qId)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${flagged.has(qId) ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600'}`}>
                <Flag className="w-3.5 h-3.5" /> {flagged.has(qId) ? 'Flagged' : 'Flag'}
              </button>
            </div>
          </div>

          <p className="text-base font-medium text-slate-800 mb-6 whitespace-pre-wrap">{q?.questionText}</p>

          {/* MCQ */}
          {q?.type === 'mcq' && (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => selectAnswer(qId, oi)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    answers[qId] === oi ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    answers[qId] === oi ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-slate-400'
                  }`}>{String.fromCharCode(65 + oi)}</span>
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {q?.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((label, oi) => (
                <button key={oi} onClick={() => selectAnswer(qId, oi)}
                  className={`px-4 py-4 rounded-xl border-2 font-bold text-sm transition-all ${
                    answers[qId] === oi ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Subjective */}
          {q?.type === 'subjective' && (
            <textarea rows="6" placeholder="Type your answer here..." value={answers[qId] || ''}
              onChange={(e) => setTextAnswer(qId, e.target.value)} className="input-field w-full" />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 disabled:opacity-30 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(c => c + 1)} className="btn-primary flex items-center gap-2 text-sm">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-500">
                <Award className="w-4 h-4" /> Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="lg:w-56 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Questions</h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 mb-4">
            {questions.map((qq, i) => {
              const isAnswered = answers[qq._id] !== undefined && answers[qq._id] !== '';
              const isFlagged = flagged.has(qq._id);
              const isCurrent = i === currentQ;
              return (
                <button key={qq._id} onClick={() => setCurrentQ(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all relative ${
                    isCurrent ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                  } ${
                    isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {i + 1}
                  {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-100" /> Not Answered ({questions.length - answeredCount})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-400" /> Flagged ({flagged.size})</div>
          </div>
          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary w-full text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500">
            <Award className="w-4 h-4" /> Submit
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Submit Exam?</h3>
            <p className="text-sm text-slate-500 mb-4">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ' Unanswered questions will get 0 marks.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => submitExam(false)} disabled={submitting} className="btn-primary flex-1 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
