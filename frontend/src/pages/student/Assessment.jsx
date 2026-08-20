import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStudentLmsCourse, submitStudentAssessment } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Languages, CheckCircle2, XCircle, Award, ArrowLeft, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function StudentAssessment() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState(null);

  // Quiz state
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'both'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [quizResult, setQuizResult] = useState(null); // Result after submission

  useEffect(() => {
    getStudentLmsCourse(courseId)
      .then(res => {
        setCourse(res.data.course);
        setLoading(false);
      })
      .catch(err => {
        showError('Failed to load assessment questions');
        setLoading(false);
      });
  }, [courseId]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Assessment Questions...</div>;
  }

  const questions = (course && course.assessment && course.assessment.questions) || [];
  const passingScore = (course && course.assessment && course.assessment.passingScore) || 50;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <HelpCircle className="w-16 h-16 text-indigo-400" />
        <h2 className="text-2xl font-bold">No Assessment Questions Configured</h2>
        <p className="text-slate-400 text-sm">Please contact course administrator to publish assessment questions for this course.</p>
        <Link to={`/student/course/${courseId}`} className="btn-primary text-xs px-6 py-3">Back to Course</Link>
      </div>
    );
  }

  const handleSelectOption = (optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm(`You have answered ${Object.keys(answers).length} out of ${questions.length} questions. Submit assessment anyway?`)) {
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await submitStudentAssessment({ courseId, answers });
      setQuizResult(res.data.result);
      if (res.data.result.passed) {
        showSuccess('🎉 Congratulations! You passed the assessment exam!');
      } else {
        showError('Assessment not passed. You can review and retake the test.');
      }
    } catch (error) {
      showError('Failed to submit assessment answers');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const selectedOpt = answers[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/student/course/${courseId}`} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-base text-white">{course.name} - Assessment Exam</h1>
              <p className="text-xs text-indigo-400">Passing Requirement: {passingScore}%</p>
            </div>
          </div>

          {/* Bilingual Language Switcher Toggle */}
          {!quizResult && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  language === 'en' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  language === 'hi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('both')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  language === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Both (द्विभाषी)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        {/* RESULT SCREEN IF SUBMITTED */}
        {quizResult ? (
          <div className="bg-slate-900/90 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700">
              {quizResult.passed ? (
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white">
                {quizResult.passed ? 'Assessment Passed! 🎉' : 'Assessment Not Passed'}
              </h2>
              <p className="text-slate-400 text-sm">
                {quizResult.passed
                  ? 'Congratulations! You have successfully passed the course assessment.'
                  : `You scored ${quizResult.percentage}%. Minimum required passing score is ${passingScore}%.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-xl font-bold text-white">{quizResult.score} / {quizResult.totalQuestions}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Percentage</p>
                <p className={`text-xl font-bold ${quizResult.passed ? 'text-green-400' : 'text-red-400'}`}>{quizResult.percentage}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Required</p>
                <p className="text-xl font-bold text-indigo-400">{passingScore}%</p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {quizResult.passed && quizResult.certificateId && (
                <Link
                  to={`/student/certificate/${quizResult.certificateId}`}
                  className="btn-primary py-3.5 px-8 text-sm font-bold flex items-center justify-center gap-2 shadow-xl mirror-shine"
                >
                  <Award className="w-5 h-5" /> View & Download Certificate PDF
                </Link>
              )}
              <button
                onClick={() => {
                  setQuizResult(null);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="btn-secondary py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2"
              >
                Retake Assessment
              </button>
            </div>
          </div>
        ) : (
          /* QUIZ QUESTIONS DISPLAY */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
            {/* Progress Counter */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Answered: {Object.keys(answers).length}/{questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className="space-y-4">
              {/* English Question */}
              {(language === 'en' || language === 'both') && (
                <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                  {currentQuestionIndex + 1}. {currentQ.questionText}
                </h3>
              )}
              {/* Hindi Question */}
              {(language === 'hi' || language === 'both') && currentQ.questionTextHi && (
                <h3 className="text-lg sm:text-xl font-bold text-indigo-300 font-hindi leading-relaxed">
                  प्रश्न {currentQuestionIndex + 1}: {currentQ.questionTextHi}
                </h3>
              )}
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOpt === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 shadow-lg text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1">
                      {(language === 'en' || language === 'both') && (
                        <p className="font-semibold text-sm">{opt.text}</p>
                      )}
                      {(language === 'hi' || language === 'both') && opt.textHi && (
                        <p className="font-semibold text-sm text-indigo-300 font-hindi">{opt.textHi}</p>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-1 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={handleSubmitQuiz}
                  className="btn-primary text-xs py-3 px-6 flex items-center gap-2 bg-green-600 hover:bg-green-500 shadow-lg mirror-shine"
                >
                  {submitting ? 'Evaluating Test...' : <>Submit Assessment Exam <CheckCircle2 className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
