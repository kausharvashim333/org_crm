import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicHomepage, getPublicCourses, submitPublicAdmission } from '../../api';
import API from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap, Building2, User, Upload, CheckCircle2, ChevronRight,
  ArrowLeft, Printer, Download, RefreshCw, Award, BookOpen, Check, Phone, Mail, MapPin,
  UploadCloud, FileCheck, FileText, X, Menu
} from 'lucide-react';

const RULES_CHECKLIST = [
  { id: 1, text: 'I declare that all information provided in this admission form is true, correct, and complete.', textHi: 'मैं घोषणा करता/करती हूँ कि इस प्रवेश फॉर्म में दी गई सभी जानकारी सत्य और पूर्ण है।' },
  { id: 2, text: 'I agree to strictly abide by the rules, regulations, and discipline code of the institute.', textHi: 'मैं संस्थान के नियमों, विनियमों और अनुशासन संहिता का सख्ती से पालन करने के लिए सहमत हूँ।' },
  { id: 3, text: 'I understand that course fees once paid are non-refundable and non-transferable under any circumstances.', textHi: 'मैं समझता/समझती हूँ कि एक बार भुगतान की गई पाठ्यक्रम फीस किसी भी परिस्थिति में वापस नहीं होगी।' },
  { id: 4, text: 'I will maintain minimum 75% attendance in theory lectures and practical lab sessions.', textHi: 'मैं थ्योरी कक्षाओं और प्रैक्टिकल लैब सत्रों में न्यूनतम 75% उपस्थिति बनाए रखूँगा/रखूँगी।' },
  { id: 5, text: 'I will appear for all internal assessments, assignments, and final term examinations on time.', textHi: 'मैं समय पर सभी आंतरिक मूल्यांकन, असाइनमेंट और अंतिम परीक्षा में उपस्थित हूँगा/हूँगी।' },
  { id: 6, text: 'I understand that any damage caused to computer lab equipment or institute property will be compensated by me.', textHi: 'प्रयोगशाला उपकरण या संस्थान संपत्ति को होने वाले किसी भी नुकसान की भरपाई मेरे द्वारा की जाएगी।' },
  { id: 7, text: 'I consent to receive official academic notifications, exam schedules, and fee alerts via SMS/WhatsApp.', textHi: 'मैं SMS/WhatsApp के माध्यम से आधिकारिक शैक्षणिक सूचनाएं और परीक्षा कार्यक्रम प्राप्त करने की सहमति देता/देती हूँ।' },
  { id: 8, text: 'I confirm that I possess the minimum required educational qualification for the selected course.', textHi: 'मैं पुष्टि करता/करती हूँ कि मेरे पास चयनित पाठ्यक्रम के लिए न्यूनतम आवश्यक शैक्षणिक योग्यता है।' },
  { id: 9, text: 'I authorize the institute to verify my academic certificates and identity documents from issuing authorities.', textHi: 'मैं संस्थान को अपने शैक्षणिक प्रमाण पत्रों और पहचान दस्तावेजों को सत्यापित करने के लिए अधिकृत करता/करती हूँ।' },
  { id: 10, text: 'I agree that violation of discipline or misconduct may lead to cancellation of my enrollment without refund.', textHi: 'मैं सहमत हूँ कि अनुशासनहीनता के उल्लंघन से मेरा नामांकन रद्द किया जा सकता है।' },
];

export default function PublicPartnerAdmissionPage() {
  const { slug } = useParams();
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    familyIncome: 'Below ₹1 Lakh',
    email: '',
    phone: '',
    whatsappPhone: '',
    gender: 'male',
    dob: '',
    category: 'General',
    bloodGroup: 'O+',
    aadharNumber: '',
    address: '',
    district: '',
    tehsil: '',
    partnerId: '',
    courseId: '',
    referenceSource: 'Institute Website Admission',
    tenthDetails: { board: 'CGBSE Raipur', rollNo: '', year: '2022', obtMarks: '', maxMarks: '', percentage: '', division: '' },
    twelfthDetails: { board: 'CGBSE Raipur', rollNo: '', year: '2024', obtMarks: '', maxMarks: '', percentage: '', division: '' },
    graduationDetails: { degreeName: 'B.Sc / B.A / B.Com', university: 'Sant Gahira Guru University', year: '2025', obtMarks: '', maxMarks: '', percentage: '', cgpa: '' },
  });

  // Files
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState('');
  const [idProofFile, setIdProofFile] = useState(null);
  const [tenthFile, setTenthFile] = useState(null);
  const [twelfthFile, setTwelfthFile] = useState(null);
  const [gradFile, setGradFile] = useState(null);

  // Rules checkboxes
  const [agreedRules, setAgreedRules] = useState({});

  useEffect(() => {
    getPublicHomepage(slug)
      .then(res => {
        setData(res.data);
        const partnerObj = res.data.partner;
        setFormData(prev => ({ ...prev, partnerId: partnerObj._id }));

        getPublicCourses({ partnerId: partnerObj._id })
          .then(cRes => {
            const courseList = cRes.data.courses || [];
            setCourses(courseList);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!data || !data.partner) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white space-y-4">
        <p className="text-gray-400">Institute not found</p>
        <Link to="/" className="btn-primary text-xs px-6 py-3">Go to Home</Link>
      </div>
    );
  }

  const { partner, homepage } = data;
  const themeColor = partner.themeColor || homepage?.settings?.themeColor || '#2563eb';
  const centerType = partner.centerType || 'Training Center';
  const fontClass = homepage?.settings?.fontChoice === 'poppins' ? 'font-poppins' : homepage?.settings?.fontChoice === 'roboto' ? 'font-roboto' : 'font-inter';
  const fixUrl = (url) => { if (!url) return ''; if (url.startsWith('/uploads/')) return `/api${url}`; return url; };

  const navLinks = [
    { label: 'Home', to: `/institute/${slug}` },
    { label: 'Courses', to: `/institute/${slug}/courses` },
    { label: 'About', to: `/institute/${slug}/about` },
    { label: 'Faculty', to: `/institute/${slug}/faculty` },
    { label: 'Gallery', to: `/institute/${slug}/gallery` },
    { label: 'Notices', to: `/institute/${slug}/notices` },
    { label: 'Contact', to: `/institute/${slug}/contact` },
  ];

  // Calc Percentage & Division
  const calcMarks = (obt, max) => {
    const o = parseFloat(obt);
    const m = parseFloat(max);
    if (!o || !m || m <= 0) return { percentage: '', division: '' };
    const pct = ((o / m) * 100).toFixed(2);
    let div = '3rd Division';
    if (pct >= 60) div = '1st Division';
    else if (pct >= 45) div = '2nd Division';
    return { percentage: pct, division: div };
  };

  const handleTenthChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev.tenthDetails, [field]: val };
      if (field === 'obtMarks' || field === 'maxMarks') {
        const { percentage, division } = calcMarks(
          field === 'obtMarks' ? val : updated.obtMarks,
          field === 'maxMarks' ? val : updated.maxMarks
        );
        updated.percentage = percentage;
        updated.division = division;
      }
      return { ...prev, tenthDetails: updated };
    });
  };

  const handleTwelfthChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev.twelfthDetails, [field]: val };
      if (field === 'obtMarks' || field === 'maxMarks') {
        const { percentage, division } = calcMarks(
          field === 'obtMarks' ? val : updated.obtMarks,
          field === 'maxMarks' ? val : updated.maxMarks
        );
        updated.percentage = percentage;
        updated.division = division;
      }
      return { ...prev, twelfthDetails: updated };
    });
  };

  const handleGradChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev.graduationDetails, [field]: val };
      if (field === 'obtMarks' || field === 'maxMarks') {
        const { percentage, division } = calcMarks(
          field === 'obtMarks' ? val : updated.obtMarks,
          field === 'maxMarks' ? val : updated.maxMarks
        );
        updated.percentage = percentage;
        updated.division = division;
      }
      return { ...prev, graduationDetails: updated };
    });
  };

  const selectedCourse = courses.find(c => c._id === formData.courseId);
  const reqEligibility = (selectedCourse?.eligibility || selectedCourse?.qualification || '').toUpperCase();
  const courseNameUpper = (selectedCourse?.name || '').toUpperCase();

  const is12thRequired = reqEligibility.includes('12') || reqEligibility.includes('GRADUAT') || courseNameUpper.includes('DCA') || courseNameUpper.includes('PGDCA') || courseNameUpper.includes('ADCA') || courseNameUpper.includes('DIPLOMA');
  const isGraduationRequired = reqEligibility.includes('GRADUAT') || reqEligibility.includes('DEGREE') || courseNameUpper.includes('PGDCA') || courseNameUpper.includes('POST GRADUATE');

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSigSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSigFile(file);
      setSigPreview(URL.createObjectURL(file));
    }
  };

  const handleRuleToggle = (id) => {
    setAgreedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAllRules = () => {
    const all = {};
    RULES_CHECKLIST.forEach(r => all[r.id] = true);
    setAgreedRules(all);
  };

  const allRulesAgreed = RULES_CHECKLIST.every(r => agreedRules[r.id]);

  const handleNextStep1 = () => {
    if (!formData.name || !formData.phone || !formData.dob) {
      return showError('Kripya Full Name, Phone Number aur Date of Birth bharein');
    }
    if (!formData.fatherName) {
      return showError('Father Name zaroori hai');
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!formData.courseId) return showError('Kripya Course select karein');
    if (!formData.tenthDetails.board || !formData.tenthDetails.rollNo) {
      return showError('10th Board aur Roll Number zaroori hain');
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    if (!allRulesAgreed) {
      return showError('Kripya sabhi 10 niyamo par tick lagayein');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      const payload = {
        ...formData,
        fullName: formData.name || formData.fullName,
        dateOfBirth: formData.dob || formData.dateOfBirth,
        idProofNumber: formData.aadharNumber || formData.idProofNumber,
        declarationsAgreed: 'true'
      };
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'object' && payload[key] !== null) {
          fd.append(key, JSON.stringify(payload[key]));
        } else if (payload[key] !== undefined && payload[key] !== null) {
          fd.append(key, payload[key]);
        }
      });

      if (photoFile) fd.append('photo', photoFile);
      if (sigFile) fd.append('signature', sigFile);
      if (idProofFile) fd.append('idProof', idProofFile);
      if (tenthFile) fd.append('tenthMarksheet', tenthFile);
      if (twelfthFile) fd.append('twelfthMarksheet', twelfthFile);
      if (gradFile) fd.append('gradMarksheet', gradFile);

      const res = await API.post('/students/public/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showSuccess('Student Admission Form submitted successfully!');
      setSubmittedData(res.data.student);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit admission form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-slate-50 min-h-screen flex flex-col justify-between ${fontClass}`}>
      <div>
        {/* Institute Branding Header Navbar */}
        <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to={`/institute/${slug}`} className="flex items-center gap-2.5">
              {partner.logo ? <img src={fixUrl(partner.logo)} alt="logo" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { const img = e.target; if (!img.dataset.retried && partner.logo.includes('/uploads/')) { img.dataset.retried = 'true'; const path = partner.logo.substring(partner.logo.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeColor }}><GraduationCap className="w-6 h-6 text-white" /></div>}
              <div>
                <span className="font-black text-slate-900 text-lg tracking-tight block">{partner.instituteName}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{centerType}</span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {navLinks.map(l => <Link key={l.to} to={l.to} className="text-sm text-slate-600 hover:text-slate-900 hidden md:block px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">{l.label}</Link>)}
              <Link to={`/institute/${slug}/login`} className="text-sm px-4 py-2 rounded-xl text-white font-bold transition-all hover:scale-105 hidden sm:block" style={{ backgroundColor: themeColor }}>Login</Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 bg-white">
              <div className="px-4 py-3 space-y-1">
                {navLinks.map(l => <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium">{l.label}</Link>)}
                <Link to={`/institute/${slug}/login`} className="block px-3 py-2.5 rounded-lg text-sm text-white font-bold text-center mt-2" style={{ backgroundColor: themeColor }}>Login</Link>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Title Banner */}
        <section className="relative py-12 px-4 text-white text-center shadow-lg" style={{ backgroundColor: themeColor }}>
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
              <Building2 className="w-3.5 h-3.5" /> Official Online Admission Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{partner.instituteName}</h1>
            <p className="text-sm md:text-base text-white/90 font-medium max-w-2xl mx-auto">
              Apne pasandida Course ke liye online admission form bharein aur instant Printable Application Slip & Verification QR Code praapt karein.
            </p>
          </div>
        </section>

        {/* Form Container Container */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          
          {submittedData ? (
            /* Success Receipt Card */
            <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">Admission Form Submitted Successfully!</h2>
              <p className="text-emerald-100 text-sm max-w-lg mx-auto">
                Aapka admission form <strong>{partner.instituteName}</strong> mein praapt ho gaya hai.
              </p>
              
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl max-w-sm mx-auto text-xs font-mono tracking-wider space-y-1">
                <p>Application Registration No: <span className="font-bold text-yellow-300">{submittedData.applicationNo}</span></p>
                <p>Student Roll / ID No: <span className="font-bold text-yellow-300">{submittedData.studentIdNo || 'Generated'}</span></p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href={`/admission/receipt/${submittedData.applicationNo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-white text-emerald-950 font-black rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <Printer className="w-5 h-5 text-emerald-700" /> Print Application Slip
                </a>

                <a
                  href={`/admission/receipt/${submittedData.applicationNo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-indigo-950 text-white font-black rounded-xl shadow-lg hover:bg-indigo-900 transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5 text-indigo-300" /> Download PDF Receipt
                </a>

                <Link
                  to={`/institute/${slug}`}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  Back to Center Website
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Wizard Step Navigation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold">
                {[
                  { num: 1, label: 'Candidate Personal' },
                  { num: 2, label: 'Course & Marks' },
                  { num: 3, label: 'Document Uploads' },
                  { num: 4, label: 'Rules & Submit' },
                ].map((s) => (
                  <div
                    key={s.num}
                    onClick={() => s.num < step && setStep(s.num)}
                    className={`flex items-center gap-2 cursor-pointer transition-colors ${
                      step === s.num ? 'font-black' : step > s.num ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                    style={step === s.num ? { color: themeColor } : {}}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        step > s.num ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                      style={step === s.num ? { backgroundColor: themeColor, color: '#fff' } : {}}
                    >
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Form Card */}
              <form onSubmit={handleSubmitAdmission} className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6">
                
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                      <User className="w-5 h-5" style={{ color: themeColor }} /> Step 1: Candidate & Parent Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Candidate Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rahul Kumar Verma"
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="10-digit number"
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={formData.whatsappPhone}
                          onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                          placeholder="WhatsApp number"
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="student@example.com"
                          className="input-field text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender *</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="input-field text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="input-field text-sm"
                        >
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Aadhaar Card Number</label>
                        <input
                          type="text"
                          maxLength="12"
                          value={formData.aadharNumber}
                          onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                          placeholder="12-digit Aadhaar"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="font-bold text-slate-700 text-sm">Father & Mother Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Father's Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            placeholder="Father's full name"
                            className="input-field text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Father's Occupation</label>
                          <input
                            type="text"
                            value={formData.fatherOccupation}
                            onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                            placeholder="e.g. Business / Service"
                            className="input-field text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Mother's Name</label>
                          <input
                            type="text"
                            value={formData.motherName}
                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                            placeholder="Mother's full name"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="font-bold text-slate-700 text-sm">Residential Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Permanent Address *</label>
                          <textarea
                            rows="2"
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Village / Ward / Street address..."
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">District</label>
                          <input
                            type="text"
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            placeholder="District name"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Tehsil / Block</label>
                          <input
                            type="text"
                            value={formData.tehsil}
                            onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
                            placeholder="Tehsil name"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={handleNextStep1}
                        className="py-2.5 px-8 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 hover:opacity-90 transition-all"
                        style={{ backgroundColor: themeColor }}
                      >
                        Proceed to Step 2 <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Course & Qualification */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" style={{ color: themeColor }} /> Step 2: Course Selection & Marks Details
                    </h3>

                    {/* Fixed Institute Header */}
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                          Enrolling Direct To Center
                        </span>
                        <h4 className="text-base font-black text-indigo-950 mt-0.5">{partner.instituteName}</h4>
                        <p className="text-xs text-indigo-600">{partner.city}, {partner.state} — Specialization: {centerType}</p>
                      </div>
                    </div>

                    {/* Course Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Select Course *
                      </label>
                      <select
                        required
                        value={formData.courseId}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.duration || '6 Months'}) — Required Eligibility: {c.eligibility || '10th / 12th Pass'} — Fee: ₹{c.fee}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Eligibility Requirement Badge */}
                    {selectedCourse && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Course Qualification Requirement
                            </span>
                            <h4 className="text-sm font-black text-amber-950 mt-0.5">{selectedCourse.name}</h4>
                            <p className="text-xs text-amber-800 font-medium">
                              Required Minimum Eligibility: <strong className="text-amber-950 font-bold underline">{selectedCourse.eligibility || (isGraduationRequired ? 'Graduation (Bachelor Degree)' : is12thRequired ? '12th Pass (Higher Secondary)' : '10th Pass (High School)')}</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 10th Standard Details (Mandatory) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" /> 10th (High School) Qualification Details *
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Mandatory</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Board / University *</label>
                          <input
                            type="text"
                            required
                            value={formData.tenthDetails.board}
                            onChange={(e) => handleTenthChange('board', e.target.value)}
                            placeholder="e.g. CGBSE"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Roll Number *</label>
                          <input
                            type="text"
                            required
                            value={formData.tenthDetails.rollNo}
                            onChange={(e) => handleTenthChange('rollNo', e.target.value)}
                            placeholder="Roll No"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Passing Year *</label>
                          <input
                            type="number"
                            required
                            value={formData.tenthDetails.year}
                            onChange={(e) => handleTenthChange('year', e.target.value)}
                            placeholder="Year"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Obtained Marks</label>
                          <input
                            type="number"
                            value={formData.tenthDetails.obtMarks}
                            onChange={(e) => handleTenthChange('obtMarks', e.target.value)}
                            placeholder="Marks"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Marks</label>
                          <input
                            type="number"
                            value={formData.tenthDetails.maxMarks}
                            onChange={(e) => handleTenthChange('maxMarks', e.target.value)}
                            placeholder="e.g. 500"
                            className="input-field text-sm"
                          />
                        </div>

                        {formData.tenthDetails.percentage && (
                          <div className="col-span-2 bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Percentage</span>
                              <span className="text-sm font-black text-indigo-600">{formData.tenthDetails.percentage}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Division</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {formData.tenthDetails.division}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 12th Standard Details (Conditional based on course requirement) */}
                    {(is12thRequired || isGraduationRequired) && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-600" /> 12th (Higher Secondary / Intermediate) Details *
                          </h4>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Required for {selectedCourse?.name || 'this Course'}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Board / University *</label>
                            <input
                              type="text"
                              required={is12thRequired}
                              value={formData.twelfthDetails.board}
                              onChange={(e) => handleTwelfthChange('board', e.target.value)}
                              placeholder="e.g. CGBSE / CBSE"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Roll Number *</label>
                            <input
                              type="text"
                              required={is12thRequired}
                              value={formData.twelfthDetails.rollNo}
                              onChange={(e) => handleTwelfthChange('rollNo', e.target.value)}
                              placeholder="Roll No"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Passing Year *</label>
                            <input
                              type="number"
                              required={is12thRequired}
                              value={formData.twelfthDetails.year}
                              onChange={(e) => handleTwelfthChange('year', e.target.value)}
                              placeholder="Year"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Obtained Marks</label>
                            <input
                              type="number"
                              value={formData.twelfthDetails.obtMarks}
                              onChange={(e) => handleTwelfthChange('obtMarks', e.target.value)}
                              placeholder="Marks"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Marks</label>
                            <input
                              type="number"
                              value={formData.twelfthDetails.maxMarks}
                              onChange={(e) => handleTwelfthChange('maxMarks', e.target.value)}
                              placeholder="e.g. 500"
                              className="input-field text-sm"
                            />
                          </div>

                          {formData.twelfthDetails.percentage && (
                            <div className="col-span-2 bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center gap-4">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Percentage</span>
                                <span className="text-sm font-black text-emerald-600">{formData.twelfthDetails.percentage}%</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Division</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  {formData.twelfthDetails.division}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Graduation Details (Conditional based on course requirement e.g. PGDCA) */}
                    {isGraduationRequired && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-purple-600" /> Graduation (Bachelor Degree) Qualification Details *
                          </h4>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">Mandatory for PGDCA / Degree Courses</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-200">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Degree Name *</label>
                            <input
                              type="text"
                              required={isGraduationRequired}
                              value={formData.graduationDetails.degreeName}
                              onChange={(e) => handleGradChange('degreeName', e.target.value)}
                              placeholder="e.g. B.Sc / B.A / B.Com"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">University Name *</label>
                            <input
                              type="text"
                              required={isGraduationRequired}
                              value={formData.graduationDetails.university}
                              onChange={(e) => handleGradChange('university', e.target.value)}
                              placeholder="e.g. Sarguja University"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Passing Year *</label>
                            <input
                              type="number"
                              required={isGraduationRequired}
                              value={formData.graduationDetails.year}
                              onChange={(e) => handleGradChange('year', e.target.value)}
                              placeholder="Year"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Obtained Marks</label>
                            <input
                              type="number"
                              value={formData.graduationDetails.obtMarks}
                              onChange={(e) => handleGradChange('obtMarks', e.target.value)}
                              placeholder="Marks"
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Marks / CGPA</label>
                            <input
                              type="number"
                              value={formData.graduationDetails.maxMarks}
                              onChange={(e) => handleGradChange('maxMarks', e.target.value)}
                              placeholder="Max Marks"
                              className="input-field text-sm"
                            />
                          </div>

                          {formData.graduationDetails.percentage && (
                            <div className="col-span-2 bg-white p-2.5 rounded-xl border border-purple-200 flex items-center gap-4">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Percentage</span>
                                <span className="text-sm font-black text-purple-600">{formData.graduationDetails.percentage}%</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Division</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                  {formData.graduationDetails.division}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-secondary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Step 1
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep2}
                        className="py-2.5 px-8 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 hover:opacity-90 transition-all"
                        style={{ backgroundColor: themeColor }}
                      >
                        Proceed to Uploads <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Document Uploads */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                          <UploadCloud className="w-5 h-5" style={{ color: themeColor }} /> Step 3: Photo, Signature & Document Uploads
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Official documents upload karein (JPG, PNG, PDF formats allowed)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Candidate Photo */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4 transition-all hover:border-slate-300">
                        <div className="w-24 h-28 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 relative">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-9 h-9 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Candidate Passport Photo *</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Required</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">Clear passport size photo with light background (Max 5MB)</p>
                          
                          <label
                            className="inline-flex items-center gap-2 px-4 py-2 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: themeColor }}
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>{photoFile ? 'Change Photo' : 'Choose Photo File'}</span>
                            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                          </label>
                          {photoFile && (
                            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {photoFile.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Specimen Signature */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4 transition-all hover:border-slate-300">
                        <div className="w-28 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 relative">
                          {sigPreview ? (
                            <img src={sigPreview} alt="Signature" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Award className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Specimen Signature</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">Optional</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">Signature on white paper (JPG/PNG format)</p>
                          
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all active:scale-95">
                            <UploadCloud className="w-4 h-4" />
                            <span>{sigFile ? 'Change Signature' : 'Choose Signature File'}</span>
                            <input type="file" accept="image/*" onChange={handleSigSelect} className="hidden" />
                          </label>
                          {sigFile && (
                            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {sigFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Marksheets & Certificates Grid */}
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-600" /> Marksheets & Educational Certificates
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 10th Marksheet Card */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 shadow-xs transition-all hover:border-indigo-200">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800">10th Marksheet / Certificate *</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Mandatory</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Scan or photo of 10th mark sheet (PDF, JPG, PNG)</p>
                            
                            <div className="flex items-center gap-3 pt-1">
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all">
                                <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                <span>{tenthFile ? 'Change File' : 'Choose 10th Marksheet'}</span>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setTenthFile(e.target.files[0])} className="hidden" />
                              </label>
                            </div>
                            {tenthFile && (
                              <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200 text-[11px] font-bold">
                                <span className="truncate max-w-[200px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {tenthFile.name}
                                </span>
                                <button type="button" onClick={() => setTenthFile(null)} className="text-emerald-700 hover:text-emerald-900 p-0.5">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 12th Marksheet Card */}
                        {(is12thRequired || isGraduationRequired) && (
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 shadow-xs transition-all hover:border-emerald-200">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-slate-800">12th Marksheet / Certificate *</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Required</span>
                              </div>
                              <p className="text-[11px] text-slate-500">Scan or photo of 12th mark sheet (PDF, JPG, PNG)</p>
                              
                              <div className="flex items-center gap-3 pt-1">
                                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all">
                                  <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{twelfthFile ? 'Change File' : 'Choose 12th Marksheet'}</span>
                                  <input type="file" accept="image/*,.pdf" onChange={(e) => setTwelfthFile(e.target.files[0])} className="hidden" />
                                </label>
                              </div>
                              {twelfthFile && (
                                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200 text-[11px] font-bold">
                                  <span className="truncate max-w-[200px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> {twelfthFile.name}
                                  </span>
                                  <button type="button" onClick={() => setTwelfthFile(null)} className="text-emerald-700 hover:text-emerald-900 p-0.5">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Graduation Marksheet Card */}
                        {isGraduationRequired && (
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 shadow-xs transition-all hover:border-purple-200">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-slate-800">Graduation Degree / Marksheet *</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Required</span>
                              </div>
                              <p className="text-[11px] text-slate-500">Degree certificate or final mark sheet (PDF, JPG, PNG)</p>
                              
                              <div className="flex items-center gap-3 pt-1">
                                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all">
                                  <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{gradFile ? 'Change File' : 'Choose Degree File'}</span>
                                  <input type="file" accept="image/*,.pdf" onChange={(e) => setGradFile(e.target.files[0])} className="hidden" />
                                </label>
                              </div>
                              {gradFile && (
                                <div className="flex items-center justify-between bg-purple-50 text-purple-800 p-2 rounded-xl border border-purple-200 text-[11px] font-bold">
                                  <span className="truncate max-w-[200px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" /> {gradFile.name}
                                  </span>
                                  <button type="button" onClick={() => setGradFile(null)} className="text-purple-700 hover:text-purple-900 p-0.5">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Aadhaar / ID Proof Card */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5 shadow-xs transition-all hover:border-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800">Aadhaar Card / ID Proof</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">Optional</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Scan of Aadhaar card front & back (PDF, JPG, PNG)</p>
                            
                            <div className="flex items-center gap-3 pt-1">
                              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all">
                                <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                <span>{idProofFile ? 'Change File' : 'Choose ID Proof'}</span>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setIdProofFile(e.target.files[0])} className="hidden" />
                              </label>
                            </div>
                            {idProofFile && (
                              <div className="flex items-center justify-between bg-slate-100 text-slate-800 p-2 rounded-xl border border-slate-200 text-[11px] font-bold">
                                <span className="truncate max-w-[200px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" /> {idProofFile.name}
                                </span>
                                <button type="button" onClick={() => setIdProofFile(null)} className="text-slate-700 hover:text-slate-900 p-0.5">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-secondary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Step 2
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep3}
                        className="py-2.5 px-8 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 hover:opacity-90 transition-all"
                        style={{ backgroundColor: themeColor }}
                      >
                        Proceed to Undertaking <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Bilingual Rules Undertaking */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Award className="w-5 h-5" style={{ color: themeColor }} /> Step 4: Rules Undertaking & Final Submit
                    </h3>

                    <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <div>
                        <p className="font-bold text-indigo-900 text-sm">Rules & Discipline Undertaking</p>
                        <p className="text-xs text-indigo-700">Check all 10 points below to agree</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAllRules}
                        className="px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                        style={{ backgroundColor: themeColor }}
                      >
                        Select All 10 Rules
                      </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {RULES_CHECKLIST.map((r) => (
                        <label
                          key={r.id}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                            agreedRules[r.id]
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!agreedRules[r.id]}
                            onChange={() => handleRuleToggle(r.id)}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold">{r.id}. {r.text}</p>
                            <p className="text-[11px] opacity-80 mt-0.5">{r.textHi}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-secondary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Documents
                      </button>

                      <button
                        type="submit"
                        disabled={submitting || !allRulesAgreed}
                        className="py-3 px-10 text-sm font-black text-white rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#059669' }}
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" /> Submit Admission & Get Receipt
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>

      {/* Center Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {partner.instituteName}. All rights reserved.</p>
          <p className="text-xs opacity-50">Powered by {data.orgName || 'Skill India'}</p>
        </div>
      </footer>
    </div>
  );
}
