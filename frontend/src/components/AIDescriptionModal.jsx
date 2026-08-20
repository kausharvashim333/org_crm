import { useState } from 'react';
import Modal from './Modal';
import { Sparkles, Wand2, Check, ArrowRight, RefreshCw, BookOpen, Target, Award, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIDescriptionModal({ isOpen, onClose, courseTitle = '', category = '', onGenerated }) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  const [answers, setAnswers] = useState({
    topic: courseTitle || '',
    targetAudience: 'Beginners & 10th/12th Pass Students',
    keySkills: '',
    careerScope: '',
    tone: 'Professional & Detailed',
  });

  const handleGenerate = () => {
    if (!answers.topic.trim()) {
      return toast.error('Please enter the Course Subject / Topic');
    }

    setGenerating(true);
    setStep(2);

    setTimeout(() => {
      const topic = answers.topic.trim();
      const audience = answers.targetAudience.trim();
      const skills = answers.keySkills.trim() || 'practical hands-on skills, industry standard tools, and real-world projects';
      const career = answers.careerScope.trim() || 'job-ready certification, career growth, and self-employment opportunities';
      const tone = answers.tone;

      let description = '';

      if (tone.includes('Short')) {
        description = `Master ${topic} with our comprehensive training program tailored for ${audience}. Learn ${skills} and prepare for exciting opportunities in ${career}. Includes ISO-certified course material, hands-on lab practice, and job placement guidance.`;
      } else if (tone.includes('Simple')) {
        description = `Welcome to the ${topic} course! Designed specially for ${audience}, this step-by-step course will help you easily learn ${skills}. By the end of this course, you will be well prepared for ${career}. No prior experience needed – start learning today with expert mentors and flexible batch timings!`;
      } else {
        description = `The ${topic} course is a complete career-oriented training module designed for ${audience}. 

Key Learning Outcomes & Skills Covered:
• Hands-on mastery of ${skills}
• Real-world practical lab sessions and project assignments
• Industry-recognized ISO-certified diploma & certification
• Prepares students for ${career}

Whether you are looking to build a strong IT foundation, upgrade your technical skills, or secure job opportunities, this course provides expert mentorship and comprehensive study material.`;
      }

      setGeneratedText(description);
      setGenerating(false);
    }, 800);
  };

  const handleApply = () => {
    onGenerated(generatedText);
    toast.success('AI Generated Description Applied!');
    onClose();
  };

  const setPresetTopic = (preset) => {
    setAnswers(prev => ({
      ...prev,
      topic: preset.topic,
      keySkills: preset.keySkills,
      careerScope: preset.careerScope,
    }));
  };

  const presets = [
    { label: 'DCA / Computer Basics', topic: 'Diploma in Computer Applications (DCA)', keySkills: 'MS Office, Tally Prime, Internet & Email, Windows OS', careerScope: 'Office Assistant, Data Entry Operator, Computer Teacher' },
    { label: 'Web Development', topic: 'Full Stack Web Development', keySkills: 'HTML5, CSS3, JavaScript, React.js, Node.js, MongoDB', careerScope: 'Frontend Developer, Web Designer, Freelance Web Developer' },
    { label: 'Tally with GST', topic: 'Tally Prime with GST & Taxation', keySkills: 'Tally Prime, GST Filing, Voucher Entry, Payroll, Balance Sheet', careerScope: 'Accountant, Accounts Executive, GST Practitioner' },
    { label: 'Graphic Designing', topic: 'Graphic Design & Digital Illustration', keySkills: 'Photoshop, CorelDRAW, Illustrator, Logo & Banner Design', careerScope: 'Graphic Designer, DTP Operator, Creative Assistant' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ AI Course Description Generator" size="lg">
      <div className="space-y-5">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 animate-spin" />
              <span>Answer a few quick questions below and AI will craft a professional course description for you.</span>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPresetTopic(p)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs rounded-lg transition-all font-medium border"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> 1. Course Name / Primary Subject *
                </label>
                <input
                  type="text"
                  value={answers.topic}
                  onChange={(e) => setAnswers({ ...answers, topic: e.target.value })}
                  placeholder="e.g. Advanced Diploma in Web Development"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" /> 2. Target Student Audience
                </label>
                <select
                  value={answers.targetAudience}
                  onChange={(e) => setAnswers({ ...answers, targetAudience: e.target.value })}
                  className="input-field"
                >
                  <option value="Beginners & 10th/12th Pass Students">Beginners & 10th/12th Pass Students</option>
                  <option value="College Graduates & IT Aspirants">College Graduates & IT Aspirants</option>
                  <option value="Job Seekers & Working Professionals">Job Seekers & Working Professionals</option>
                  <option value="School Students & Hobbyists">School Students & Hobbyists</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> 3. Key Skills / Topics Taught
                </label>
                <input
                  type="text"
                  value={answers.keySkills}
                  onChange={(e) => setAnswers({ ...answers, keySkills: e.target.value })}
                  placeholder="e.g. HTML, CSS, JavaScript, React, Database"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600" /> 4. Career Opportunities / Job Roles
                </label>
                <input
                  type="text"
                  value={answers.careerScope}
                  onChange={(e) => setAnswers({ ...answers, careerScope: e.target.value })}
                  placeholder="e.g. Web Developer, Freelancer, IT Assistant"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Description Style & Tone
                </label>
                <select
                  value={answers.tone}
                  onChange={(e) => setAnswers({ ...answers, tone: e.target.value })}
                  className="input-field"
                >
                  <option value="Professional & Detailed">Professional & Detailed (Bullet Points + Outcomes)</option>
                  <option value="Simple & Engaging">Simple & Engaging (Easy & Friendly)</option>
                  <option value="Short & Catchy">Short & Catchy (Concise 2-3 Sentences)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={handleGenerate}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <Wand2 className="w-4 h-4" /> Generate Description with AI
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Generated Result Review */
          <div className="space-y-4">
            {generating ? (
              <div className="py-12 text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm font-semibold text-slate-700">AI is crafting your course description...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Generated Description Preview</h4>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>

                <textarea
                  rows="8"
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="input-field font-normal text-xs leading-relaxed text-slate-800 p-4 border-indigo-200"
                />

                <div className="flex justify-between items-center pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    &larr; Change Answers
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 font-bold text-sm bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4" /> Apply Description to Course
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
