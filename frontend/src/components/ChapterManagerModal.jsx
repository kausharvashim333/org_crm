import { useState, useEffect } from 'react';
import Modal from './Modal';
import { updateCourseChapters, updateCourseAssessment, uploadCourseVideo, getCourse } from '../api';
import { useToast } from '../context/ToastContext';
import { Video, Plus, Trash2, Upload, FileText, CheckCircle2, Languages, HelpCircle } from 'lucide-react';

export default function ChapterManagerModal({ isOpen, onClose, courseId, onSaved }) {
  const [activeTab, setActiveTab] = useState('chapters'); // 'chapters' | 'assessment'
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const [chapters, setChapters] = useState([]);
  const [newChapter, setNewChapter] = useState({
    title: '',
    description: '',
    videoType: 'url', // 'url' | 'upload'
    videoUrl: '',
    duration: '',
  });

  const [assessment, setAssessment] = useState({
    passingScore: 50,
    questions: [],
  });

  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionTextHi: '',
    options: [
      { text: '', textHi: '' },
      { text: '', textHi: '' },
      { text: '', textHi: '' },
      { text: '', textHi: '' },
    ],
    correctAnswerIndex: 0,
    points: 1,
  });

  useEffect(() => {
    if (courseId && isOpen) {
      setLoading(true);
      getCourse(courseId)
        .then(res => {
          const c = res.data.course;
          setChapters(c.chapters || []);
          setAssessment(c.assessment || { passingScore: 50, questions: [] });
          setLoading(false);
        })
        .catch(err => {
          showError('Failed to load course details');
          setLoading(false);
        });
    }
  }, [courseId, isOpen]);

  // Video File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await uploadCourseVideo(formData);
      setNewChapter(prev => ({ ...prev, videoUrl: res.data.videoUrl, videoType: 'upload' }));
      showSuccess('Video file uploaded successfully!');
    } catch (error) {
      showError('Failed to upload video file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddChapter = () => {
    if (!newChapter.title || !newChapter.videoUrl) {
      showError('Please provide Chapter Title and Video File/URL');
      return;
    }
    const updated = [...chapters, { ...newChapter, order: chapters.length + 1 }];
    setChapters(updated);
    setNewChapter({ title: '', description: '', videoType: 'url', videoUrl: '', duration: '' });
  };

  const handleRemoveChapter = (index) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSaveChapters = async () => {
    try {
      await updateCourseChapters(courseId, chapters);
      showSuccess('Chapters updated successfully!');
      if (onSaved) onSaved();
    } catch (error) {
      showError('Failed to save chapters');
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.questionText) {
      showError('Please enter Question Text in English');
      return;
    }
    if (newQuestion.options.some(o => !o.text)) {
      showError('Please enter all 4 option texts in English');
      return;
    }
    setAssessment(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setNewQuestion({
      questionText: '',
      questionTextHi: '',
      options: [
        { text: '', textHi: '' },
        { text: '', textHi: '' },
        { text: '', textHi: '' },
        { text: '', textHi: '' },
      ],
      correctAnswerIndex: 0,
      points: 1,
    });
  };

  const handleRemoveQuestion = (index) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleSaveAssessment = async () => {
    try {
      await updateCourseAssessment(courseId, assessment);
      showSuccess('Bilingual Assessment saved successfully!');
      if (onSaved) onSaved();
    } catch (error) {
      showError('Failed to save assessment');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Chapters & Bilingual Assessment" size="2xl">
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading course data...</div>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'chapters' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Video className="w-5 h-5" /> Chapter Videos ({chapters.length})
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === 'assessment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-5 h-5" /> Bilingual Assessment Quiz ({assessment.questions.length})
            </button>
          </div>

          {/* TAB 1: CHAPTER VIDEOS */}
          {activeTab === 'chapters' && (
            <div className="space-y-6">
              {/* Existing Chapters List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Course Chapters</h3>
                {chapters.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">No video chapters added yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {chapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{ch.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">{ch.videoUrl} ({ch.duration || 'N/A'})</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveChapter(idx)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Chapter Form */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" /> Add New Video Chapter
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Chapter Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 1: Introduction to Module"
                      value={newChapter.title}
                      onChange={e => setNewChapter({ ...newChapter, title: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (e.g. 15 mins)</label>
                    <input
                      type="text"
                      placeholder="15 mins"
                      value={newChapter.duration}
                      onChange={e => setNewChapter({ ...newChapter, duration: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Video Source Type</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="videoType"
                        checked={newChapter.videoType === 'url'}
                        onChange={() => setNewChapter({ ...newChapter, videoType: 'url' })}
                      />
                      Video URL / YouTube Embed
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="videoType"
                        checked={newChapter.videoType === 'upload'}
                        onChange={() => setNewChapter({ ...newChapter, videoType: 'upload' })}
                      />
                      Upload Direct MP4 Video File
                    </label>
                  </div>

                  {newChapter.videoType === 'url' ? (
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                      value={newChapter.videoUrl}
                      onChange={e => setNewChapter({ ...newChapter, videoUrl: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploading && <span className="text-xs text-indigo-600 animate-pulse">Uploading video file...</span>}
                      {newChapter.videoUrl && !uploading && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Uploaded!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Chapter Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief outline of what this chapter covers..."
                    value={newChapter.description}
                    onChange={e => setNewChapter({ ...newChapter, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <button onClick={handleAddChapter} type="button" className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Chapter to List
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={handleSaveChapters} className="btn-primary flex items-center gap-2">
                  Save Chapters Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BILINGUAL ASSESSMENT QUIZ */}
          {activeTab === 'assessment' && (
            <div className="space-y-6">
              {/* Passing Score Config */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Passing Score Percentage (%)</h4>
                  <p className="text-xs text-gray-500">Minimum score student must achieve to pass assessment & unlock Certificate</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={assessment.passingScore}
                    onChange={e => setAssessment({ ...assessment, passingScore: +e.target.value })}
                    className="input-field w-20 text-center font-bold"
                  />
                  <span className="font-bold text-gray-700">%</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Configured Questions ({assessment.questions.length})</h3>
                {assessment.questions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg">No questions added yet. Add questions below.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {assessment.questions.map((q, qIdx) => (
                      <div key={qIdx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-800">Q{qIdx + 1}. {q.questionText}</p>
                            {q.questionTextHi && <p className="text-xs text-indigo-700 font-hindi">हिंदी: {q.questionTextHi}</p>}
                          </div>
                          <button onClick={() => handleRemoveQuestion(qIdx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded border ${
                                oIdx === q.correctAnswerIndex ? 'bg-green-50 border-green-300 text-green-800 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'
                              }`}
                            >
                              <div>Opt {oIdx + 1}: {opt.text}</div>
                              {opt.textHi && <div className="text-[10px] text-gray-500">{opt.textHi}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Bilingual Question Form */}
              <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Languages className="w-4 h-4 text-indigo-600" /> Add Bilingual Question (English + हिंदी)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Question (English) *</label>
                    <input
                      type="text"
                      placeholder="e.g. What is the full form of CPU?"
                      value={newQuestion.questionText}
                      onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Question (हिंदी Translation)</label>
                    <input
                      type="text"
                      placeholder="e.g. CPU का पूरा नाम क्या है?"
                      value={newQuestion.questionTextHi}
                      onChange={e => setNewQuestion({ ...newQuestion, questionTextHi: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">4 Multiple Choice Options</label>
                  {newQuestion.options.map((opt, oIdx) => (
                    <div key={oIdx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-center font-bold text-xs text-gray-600">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQuestion.correctAnswerIndex === oIdx}
                          onChange={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: oIdx })}
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder={`Option ${oIdx + 1} (English)`}
                          value={opt.text}
                          onChange={e => {
                            const opts = [...newQuestion.options];
                            opts[oIdx].text = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          className="input-field text-xs"
                        />
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder={`Option ${oIdx + 1} (हिंदी)`}
                          value={opt.textHi}
                          onChange={e => {
                            const opts = [...newQuestion.options];
                            opts[oIdx].textHi = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          className="input-field text-xs"
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-500 italic">* Select radio button next to the correct answer option.</p>
                </div>

                <button onClick={handleAddQuestion} type="button" className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Question to Assessment
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={handleSaveAssessment} className="btn-primary flex items-center gap-2">
                  Save Assessment Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
