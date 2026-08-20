import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStoreCourse, getPublicPartners, getOrgHomepagePublic } from '../../api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen, Star, Clock, Users, Award, ShieldCheck, CheckCircle2,
  PlayCircle, ChevronDown, ChevronUp, Lock, Share2, Tag, ArrowRight,
  FileText, Sparkles, AlertCircle, HelpCircle, MapPin, Globe, Check,
  X, ExternalLink, MessageSquare
} from 'lucide-react';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [course, setCourse] = useState(null);
  const [partners, setPartners] = useState([]);
  const [hp, setHp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({ 0: true });
  const [previewVideo, setPreviewVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'certificate' | 'instructor' | 'faqs'

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      getStoreCourse(id),
      getPublicPartners().catch(() => ({ data: { partners: [] } })),
      getOrgHomepagePublic().catch(() => ({ data: { homepage: {} } })),
    ])
      .then(([courseRes, partnersRes, hpRes]) => {
        setCourse(courseRes.data.course);
        setPartners(partnersRes.data?.partners || []);
        setHp(hpRes.data?.homepage || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showError('Could not load course details');
        setLoading(false);
      });
  }, [id]);

  const toggleModule = (idx) => {
    setExpandedModules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Course link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Course Not Found</h2>
        <p className="text-slate-500 mb-6">The course you are looking for might have been removed or updated.</p>
        <Link to="/courses" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium">
          Browse All Courses
        </Link>
      </div>
    );
  }

  const original = course.originalPrice || course.fee || 0;
  const sale = course.salePrice || course.fee || 0;
  const discountPercent = original > sale ? Math.round(((original - sale) / original) * 100) : 0;
  const chapters = course.chapters || [];
  const syllabus = course.syllabus || [];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <Navbar activePage="courses" />

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full overflow-hidden border border-white/20 shadow-2xl relative">
            <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <PlayCircle className="w-4 h-4 text-indigo-400" />
                <span>Free Preview: {previewVideo.title}</span>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {previewVideo.videoUrl?.includes('youtube') || previewVideo.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={previewVideo.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="p-4 bg-slate-800 text-slate-300 text-xs flex items-center justify-between">
              <span>Enjoy this free sample lesson. Full course includes all masterclass videos.</span>
              <Link
                to={`/checkout/${course._id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
              >
                Unlock All Lessons
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-10 pb-16 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Main Course Info (Left 7 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium flex-wrap">
              <Link to="/courses" className="hover:text-white">Courses</Link>
              <span>/</span>
              <span className="text-indigo-400">{course.category || 'Certification'}</span>
              <span>/</span>
              <span className="text-slate-400 truncate max-w-xs">{course.code || course.name}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold shadow-sm">
                ★ {course.badge || 'Govt Certified'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium border border-white/15">
                ISO 9001:2015 Recognized
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                100% Practical
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              {course.name}
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl">
              {course.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-6 text-sm text-slate-300 flex-wrap pt-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-5 h-5 fill-amber-400" />
                <span className="text-white">{course.rating || '4.9'}</span>
                <span className="text-slate-400 font-normal">({course.ratingCount || 240}+ ratings)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{course.enrolledCount || 850}+ Students Enrolled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Language: {course.language || 'Hindi + English'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Duration: {course.duration || '3 Months'}</span>
              </div>
            </div>

            {/* Instructor Quick line */}
            {course.instructor && (
              <div className="flex items-center gap-3 pt-2 text-sm text-slate-300">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {course.instructor.name?.charAt(0) || 'I'}
                </div>
                <div>
                  Created by <span className="font-semibold text-white">{course.instructor.name}</span>
                  <span className="text-xs text-slate-400 block">{course.instructor.title}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Pricing Card (Right 4 Cols) */}
          <div className="lg:col-span-4 relative">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl sticky top-24 text-slate-900">
              
              {/* Preview Thumbnail / Video trigger */}
              <div
                onClick={() => {
                  const freeCh = chapters.find(c => c.isPreviewFree) || chapters[0];
                  if (freeCh && (freeCh.videoUrl || course.previewVideoUrl)) {
                    setPreviewVideo({
                      title: freeCh.title || 'Course Preview Trailer',
                      videoUrl: freeCh.videoUrl || course.previewVideoUrl,
                    });
                  }
                }}
                className="aspect-video bg-slate-900 rounded-2xl mb-5 relative overflow-hidden cursor-pointer group flex items-center justify-center border border-slate-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative z-10">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <div className="absolute bottom-3 left-3 text-white text-xs font-semibold z-10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Watch Free Demo Lecture
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-4">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Special Student Price</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{sale.toLocaleString('en-IN')}
                  </span>
                  {original > sale && (
                    <span className="text-base text-slate-400 line-through">
                      ₹{original.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Special promotional fee valid today!
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2.5 mb-6">
                <Link
                  to={`/checkout/${course._id}`}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Enroll Now & Get Instant Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-enquiry', { detail: { service: course.name } }))}
                  className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-center font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Have Questions? Enquire Now
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-center font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Course
                </button>
              </div>

              {/* Guarantees list */}
              <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  This certification course includes:
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ISO & Govt Recognized QR-Verified Digital Certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Lifetime Access to Online LMS Video Lectures</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Downloadable PDF Notes & Practical Exercise Files</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Option to practice in 50+ Franchise Computer Labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant GST Tax Invoice & Student ID Card</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Main Content Sections (What you'll learn, Syllabus, Certificate, Reviews, FAQs) */}
      <section className="max-w-7xl mx-auto px-4 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">

          {/* What You Will Learn Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" /> What You Will Learn & Master
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(course.whatYouWillLearn && course.whatYouWillLearn.length > 0 ? course.whatYouWillLearn : [
                'Master all core fundamentals and practical concepts with step-by-step guidance.',
                'Work on real-world industrial projects and assignment tasks.',
                'Learn professional industry best practices, shortcuts, and troubleshooting.',
                'Prepare for job interviews with resume building tips and certification proof.',
              ]).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1 bg-emerald-50 rounded-full p-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Curriculum / Syllabus Accordion */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  Course Content & Curriculum
                </h3>
                <p className="text-xs text-slate-500">
                  {syllabus.length > 0 ? `${syllabus.length} Modules` : `${chapters.length} Video Lessons`} • Comprehensive Step-by-Step Practical Training
                </p>
              </div>
              <button
                onClick={() => {
                  const allExpanded = Object.keys(expandedModules).length === (syllabus.length || chapters.length);
                  if (allExpanded) setExpandedModules({});
                  else {
                    const obj = {};
                    (syllabus.length ? syllabus : chapters).forEach((_, i) => { obj[i] = true; });
                    setExpandedModules(obj);
                  }
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {Object.keys(expandedModules).length > 0 ? 'Collapse All' : 'Expand All Modules'}
              </button>
            </div>

            {/* Video Chapters List */}
            {chapters.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video Lectures & Demos</div>
                {chapters.map((ch, chIdx) => (
                  <div
                    key={ch._id || chIdx}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-100 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm">
                        {chIdx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{ch.title}</div>
                        {ch.description && (
                          <div className="text-xs text-slate-500 line-clamp-1">{ch.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {ch.duration || '20m'}
                      </span>
                      {ch.isPreviewFree ? (
                        <button
                          onClick={() => setPreviewVideo(ch)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Free Demo
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-500 rounded-lg text-xs font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modules Syllabus Accordion */}
            {syllabus.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Module Breakdown</div>
                {syllabus.map((mod, modIdx) => {
                  const isOpen = !!expandedModules[modIdx];
                  return (
                    <div
                      key={modIdx}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleModule(modIdx)}
                        className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left font-semibold text-slate-900 text-sm transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <span>{mod.module}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{mod.topics?.length || 0} topics</span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white space-y-2 border-t border-slate-100">
                          {(mod.topics || []).map((topic, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2.5 text-xs text-slate-600 py-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{topic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Verifiable Certificate Showcase */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="px-3.5 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                Recognized Credential
              </span>
              <h3 className="text-2xl font-bold mb-2">
                Get an ISO 9001:2015 & Govt Recognized Certificate
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Upon course completion and passing the online quiz, you will receive a unique verifiable digital certificate with a tamper-proof QR code that employers can verify instantly at <span className="text-indigo-300 underline font-mono">/verify-certificate</span>.
              </p>

              {/* Certificate Mockup Visual */}
              <div className="bg-white text-slate-900 p-6 rounded-2xl border-4 border-amber-400 shadow-2xl relative">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-500" />
                    <div>
                      <div className="font-extrabold text-xs tracking-wider uppercase text-slate-800">
                        {hp?.settings?.orgName || 'Skill India Computer Education'}
                      </div>
                      <div className="text-[10px] text-slate-500">Government Registered • ISO Certified</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                      VERIFIED CERTIFICATE
                    </span>
                  </div>
                </div>

                <div className="text-center py-3">
                  <div className="text-xs text-slate-500 font-serif italic mb-1">This is to certify that</div>
                  <div className="font-black text-lg text-indigo-950 underline decoration-amber-400">
                    [ Your Full Name Here ]
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    has successfully completed the comprehensive certification program in
                  </div>
                  <div className="font-bold text-sm text-slate-900 mt-1">
                    {course.name} ({course.code})
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t mt-4 text-[10px] text-slate-500">
                  <div>
                    <div>Grade: <span className="font-bold text-emerald-600">A+ (Exemplary)</span></div>
                    <div>Duration: <span className="font-semibold">{course.duration}</span></div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[8px] font-mono text-slate-400 mx-auto mb-0.5">
                      [QR CODE]
                    </div>
                    <span className="text-[8px] text-slate-400">Scan to Verify</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Instructor Card */}
          {course.instructor && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">About Your Trainer</h3>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {course.instructor.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{course.instructor.name}</h4>
                  <div className="text-sm font-semibold text-indigo-600 mb-2">{course.instructor.title}</div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{course.instructor.bio}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span>⭐ 4.9 Trainer Rating</span>
                    <span>•</span>
                    <span>👨‍🎓 15,000+ Students Mentored</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hybrid Learning / Franchise Centers Option */}
          {partners.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    Available Franchise Practice Centers
                  </h3>
                  <p className="text-xs text-slate-500">
                    You can visit any of these authorized centers for practical computer lab sessions.
                  </p>
                </div>
                <Link to="/franchises" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  View All Centers <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {partners.slice(0, 4).map((p) => (
                  <div key={p._id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.instituteName}</div>
                      <div className="text-[11px] text-slate-500">{p.city}, {p.state} • Code: {p.centerCode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-600" /> Frequently Asked Questions
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">How will I get access to the course after payment?</div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Access is instantaneous! As soon as payment is confirmed, your student account is created and you are automatically logged into your Student LMS portal to start watching lectures.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">Is the certificate valid for government and private jobs?</div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Yes, our certificates are ISO 9001:2015 certified and recognized across public and private sector job applications with instant QR code verification.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-900 mb-1">Can I ask doubts if I get stuck in any lesson?</div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Yes, every student gets direct access to our doubt clearing support and discussion forum within the LMS portal.
                </p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Bottom Sticky Mobile Enroll Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Total Price</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">₹{sale.toLocaleString('en-IN')}</span>
            {original > sale && <span className="text-xs text-slate-400 line-through">₹{original}</span>}
          </div>
        </div>
        <Link
          to={`/checkout/${course._id}`}
          className="py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30"
        >
          Enroll Now
        </Link>
      </div>

      <Footer homepageData={hp} />
    </div>
  );
}
