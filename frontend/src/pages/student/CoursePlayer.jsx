import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStudentLmsCourse, markChapterWatched } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  PlayCircle, CheckCircle2, ArrowLeft, Lock, FileText, Award,
  Video, ChevronRight, Shield, Download, Gauge, Sparkles, BookOpen
} from 'lucide-react';

export default function StudentCoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth ? useAuth() : { user: null };

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'resources'
  const videoRef = useRef(null);

  const loadData = () => {
    getStudentLmsCourse(courseId)
      .then(res => {
        setCourse(res.data.course);
        setProgress(res.data.progress);
        setLoading(false);
      })
      .catch(err => {
        showError('Failed to load course details');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleMarkWatched = async (chapterId) => {
    try {
      const res = await markChapterWatched({ courseId, chapterId });
      showSuccess('Chapter marked as completed!');
      setProgress(prev => ({
        ...prev,
        watchedChapters: res.data.watchedChapters,
        progressPercent: res.data.progressPercent,
        isAllWatched: res.data.isAllWatched,
      }));
    } catch (error) {
      showError('Failed to update watch status');
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Loading student player...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 mb-4">Course not found or access pending.</p>
        <Link to="/student/dashboard" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const chapters = course.chapters || [];
  const currentChapter = chapters[activeChapterIndex] || null;
  const isCurrentWatched = currentChapter && progress?.watchedChapters?.includes(currentChapter._id || `${activeChapterIndex}`);

  // Helper to format video embed vs direct video with anti-piracy watermark
  const renderVideoPlayer = (chapter) => {
    if (!chapter || !chapter.videoUrl) {
      return (
        <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-slate-500 rounded-2xl border border-slate-800">
          <Video className="w-12 h-12 mb-2 text-slate-600" />
          <p className="text-sm">No video source uploaded for this chapter.</p>
        </div>
      );
    }

    const url = chapter.videoUrl;
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    return (
      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group">
        
        {/* Anti-Piracy Floating Watermark (Student Email / Phone ID) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none opacity-30 select-none bg-slate-900/60 px-3 py-1 rounded text-[10px] text-white font-mono border border-white/10 backdrop-blur-xs">
          🛡️ Licensed to: {user?.email || 'Student Access'} • {user?.phone || 'Verified'}
        </div>

        {isYouTube ? (
          <iframe
            src={url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url.replace('youtu.be/', 'youtube.com/embed/')}
            title={chapter.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            controls
            controlsList="nodownload"
            src={url}
            className="w-full h-full object-contain"
          >
            Your browser does not support HTML5 video playback.
          </video>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/student/dashboard" className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-sm md:text-base text-white line-clamp-1">{course.name}</h1>
              <p className="text-xs text-indigo-400">Chapter {activeChapterIndex + 1} of {chapters.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-xs text-slate-400 font-medium">Progress: {progress?.progressPercent || 0}%</div>
              <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress?.progressPercent || 0}%` }}></div>
              </div>
            </div>

            {progress?.certificateId ? (
              <Link
                to={`/student/certificate/${progress.certificateId}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                <Award className="w-4 h-4" /> Download Certificate
              </Link>
            ) : (
              <Link
                to={`/student/course/${courseId}/assessment`}
                className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                  progress?.isAllWatched
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
                onClick={(e) => {
                  if (!progress?.isAllWatched) {
                    e.preventDefault();
                    showError('Please complete all video chapters to unlock the final certification exam!');
                  }
                }}
              >
                {progress?.isAllWatched ? <FileText className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-slate-500" />}
                Take Final Exam
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: Video Player, Speed Controls & Notes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {renderVideoPlayer(currentChapter)}

          {/* Player Toolbar: Speed controls & Complete button */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            
            {/* Playback Speed selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Speed:
              </span>
              {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                    playbackSpeed === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Mark as watched button */}
            {currentChapter && (
              <button
                onClick={() => handleMarkWatched(currentChapter._id || `${activeChapterIndex}`)}
                className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition ${
                  isCurrentWatched
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCurrentWatched ? 'Completed ✓' : 'Mark Lesson as Watched'}
              </button>
            )}
          </div>

          {/* Chapter Overview & Study Materials Tabs */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800">
                Lesson {activeChapterIndex + 1}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">
                {currentChapter?.title || 'Chapter Video'}
              </h2>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed border-b border-slate-800 pb-4">
              {currentChapter?.description || 'Watch this video lesson carefully. Practice the concepts in your local editor or visit your assigned franchise lab.'}
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Learning Tips & Resources
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take notes during playback. Upon watching 100% of the lessons, the "Take Final Exam" button above will activate, allowing you to generate your QR-verified certificate.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chapters Playlist & Assessment Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Playlist Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" /> Course Chapters ({chapters.length})
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {progress?.watchedChapters?.length || 0}/{chapters.length} Done
              </span>
            </div>

            <div className="divide-y divide-slate-800 max-h-[480px] overflow-y-auto">
              {chapters.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No chapters uploaded yet.</div>
              ) : (
                chapters.map((ch, idx) => {
                  const isWatched = progress?.watchedChapters?.includes(ch._id || `${idx}`);
                  const isActive = idx === activeChapterIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`w-full text-left p-4 flex items-center justify-between transition ${
                        isActive ? 'bg-indigo-950/60 border-l-4 border-indigo-500' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isWatched ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isWatched ? '✓' : idx + 1}
                        </span>
                        <div>
                          <p className={`text-sm font-semibold line-clamp-1 ${isActive ? 'text-indigo-400' : 'text-slate-200'}`}>
                            {ch.title}
                          </p>
                          <p className="text-[11px] text-slate-500">{ch.duration || 'Video Lesson'}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Assessment Unlock Box */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900 p-5 rounded-2xl border border-indigo-900/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">QR-Verified Certificate</h4>
                <p className="text-xs text-slate-400">Complete all lessons to unlock</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {progress?.isAllWatched
                ? '🎉 Great job! You have watched all chapter videos. Click below to take your bilingual assessment exam!'
                : '🔒 Watch all chapter videos to unlock the final bilingual exam and obtain your official QR-verified certificate.'}
            </p>

            {progress?.isAllWatched && !progress?.certificateId && (
              <Link
                to={`/student/course/${courseId}/assessment`}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                Start Final Exam Now <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
