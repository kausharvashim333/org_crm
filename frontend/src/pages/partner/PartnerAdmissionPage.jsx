import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getCourses, createStudent, createAdmissionOrder } from '../../api';
import API from '../../api/axios';
import {
  GraduationCap, Check, User, FileText, Upload, Award, CheckCircle2,
  AlertCircle, Sparkles, Building2, ChevronRight, ArrowLeft, Printer, RefreshCw,
  CreditCard, Zap, IndianRupee
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

export default function PartnerAdmissionPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const partnerId = user?.partnerId || user?.partner?._id;
  const partnerName = user?.partner?.instituteName || 'Partner Center';
  const centerType = user?.partner?.centerType || 'Computer & IT Training';

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    fatherPhone: '',
    familyIncome: '',
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
    partnerId: partnerId || '',
    courseId: '',
    referenceSource: 'Direct Center Admission',
    tenthDetails: { board: '', rollNo: '', year: '', obtMarks: '', maxMarks: '', percentage: '', division: '' },
    twelfthDetails: { board: '', rollNo: '', year: '', obtMarks: '', maxMarks: '', percentage: '', division: '' },
    graduationDetails: { degreeName: '', university: '', year: '', obtMarks: '', maxMarks: '', percentage: '', cgpa: '' },
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
    if (partnerId) {
      setFormData(prev => ({ ...prev, partnerId }));
    }
    // Fetch courses available for this partner
    getCourses()
      .then(res => {
        setCourses(res.data.courses || []);
        setLoadingCourses(false);
      })
      .catch(err => {
        showError('Failed to load courses for center');
        setLoadingCourses(false);
      });
  }, [partnerId]);

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
      if (field === 'cgpa' && val) {
        const cg = parseFloat(val);
        if (cg && cg > 0) {
          updated.percentage = (cg * 9.5).toFixed(2);
        }
      } else if (field === 'obtMarks' || field === 'maxMarks') {
        const { percentage } = calcMarks(
          field === 'obtMarks' ? val : updated.obtMarks,
          field === 'maxMarks' ? val : updated.maxMarks
        );
        updated.percentage = percentage;
      }
      return { ...prev, graduationDetails: updated };
    });
  };

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
      return showError('Kripya Name, Phone aur Date of Birth bharein');
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

  const [paymentMode, setPaymentMode] = useState('pay_at_center'); // 'online_razorpay' | 'pay_at_center'

  const selectedCourse = courses.find(c => c._id === formData.courseId);
  const registrationFee = selectedCourse?.registrationFee > 0 ? selectedCourse.registrationFee : 500;

  const performSubmission = async (paymentDetails = {}) => {
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null) {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });

      // Pass payment details
      data.append('paymentMode', paymentDetails.paymentMode || paymentMode);
      data.append('paidAmount', paymentDetails.paidAmount !== undefined ? paymentDetails.paidAmount : (paymentMode === 'online_razorpay' ? registrationFee : 0));
      if (paymentDetails.razorpayOrderId) data.append('razorpayOrderId', paymentDetails.razorpayOrderId);
      if (paymentDetails.razorpayPaymentId) data.append('razorpayPaymentId', paymentDetails.razorpayPaymentId);
      if (paymentDetails.razorpaySignature) data.append('razorpaySignature', paymentDetails.razorpaySignature);

      if (photoFile) data.append('photo', photoFile);
      if (sigFile) data.append('signature', sigFile);
      if (idProofFile) data.append('idProof', idProofFile);
      if (tenthFile) data.append('tenthMarksheet', tenthFile);
      if (twelfthFile) data.append('twelfthMarksheet', twelfthFile);
      if (gradFile) data.append('gradMarksheet', gradFile);

      // Call public apply endpoint
      const res = await API.post('/students/public/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showSuccess(res.data.message || 'Student Admission Form submitted successfully!');
      setSubmittedData({
        ...formData,
        applicationNo: res.data.applicationNo,
        studentIdNo: res.data.studentId,
        paymentStatus: res.data.paymentStatus,
      });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit admission form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    if (!allRulesAgreed) {
      return showError('Kripya sabhi 10 niyamo par tick lagayein');
    }

    if (paymentMode === 'online_razorpay' && window.Razorpay && registrationFee > 0) {
      setSubmitting(true);
      try {
        const orderRes = await createAdmissionOrder({
          courseId: formData.courseId,
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          feeAmount: registrationFee,
        });

        const rzpData = orderRes.data;

        const options = {
          key: rzpData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
          amount: Math.round(registrationFee * 100),
          currency: 'INR',
          name: partnerName || 'Franchise Center Admission',
          description: `Admission Registration: ${selectedCourse?.name || 'Course'}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response) {
            await performSubmission({
              paymentMode: 'online_razorpay',
              paidAmount: registrationFee,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              showError('Online payment window closed. You can choose Pay at Center or retry.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.error(err);
        showError('Could not initialize online payment. Submitting with Center Cash option.');
        await performSubmission({ paymentMode: 'pay_at_center' });
      }
    } else {
      await performSubmission({ paymentMode: 'pay_at_center' });
    }
  };

  // If successfully submitted, show receipt preview card
  if (submittedData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black">Admission Application Successful!</h2>
          <p className="text-emerald-100 text-sm max-w-lg mx-auto">
            Student <strong>{submittedData.name}</strong> has been registered under <strong>{partnerName}</strong>.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl max-w-sm mx-auto text-xs font-mono tracking-wider space-y-1">
            <p>Application No: <span className="font-bold text-yellow-300">{submittedData.applicationNo}</span></p>
            <p>Student Roll/ID: <span className="font-bold text-yellow-300">{submittedData.studentIdNo || 'Auto Generated'}</span></p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href={`/admission/receipt/${submittedData.applicationNo}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 bg-white text-emerald-800 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
            >
              <Printer className="w-5 h-5" /> Print Admission Receipt
            </a>

            <button
              onClick={() => {
                setSubmittedData(null);
                setStep(1);
                setFormData(prev => ({
                  ...prev,
                  name: '', fatherName: '', motherName: '', email: '', phone: '', whatsappPhone: '',
                  dob: '', aadharNumber: '', courseId: ''
                }));
                setPhotoFile(null); setPhotoPreview('');
                setSigFile(null); setSigPreview('');
              }}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Register Another Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-extrabold mb-2 border border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5" /> {partnerName}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">New Student Admission Portal</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Official student enrollment form with auto percentage calculation & instant printable receipt.
          </p>
        </div>

        {/* Center Type Badge */}
        <div className="bg-slate-800 px-4 py-3 rounded-2xl border border-slate-700/80 text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Center Specialization</p>
          <span className="text-xs md:text-sm font-extrabold text-indigo-400">{centerType}</span>
        </div>
      </div>

      {/* Progress Wizard Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold">
        {[
          { num: 1, label: 'Personal & Family' },
          { num: 2, label: 'Academic & Course' },
          { num: 3, label: 'Document Uploads' },
          { num: 4, label: 'Rules & Submit' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              step === s.num ? 'text-indigo-600 font-black' : step > s.num ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              step === s.num ? 'bg-indigo-600 text-white' : step > s.num ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Form Content Steps */}
      <form onSubmit={handleSubmitAdmission} className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6">
        
        {/* STEP 1: Personal & Family Information */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Step 1: Candidate Personal & Parent Details
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit phone"
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
                    placeholder="e.g. Agriculture / Business"
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
                className="btn-primary py-2.5 px-8 text-xs font-bold flex items-center gap-2"
              >
                Proceed to Academic Info <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Course & Qualifications */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Step 2: Course Selection & Marks Details
            </h3>

            {/* Course Filtered by Center Type Banner */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider">
                  Select Course (Filtered for {centerType}) *
                </label>
                <span className="text-[11px] font-extrabold text-indigo-600 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                  {courses.length} Courses Available
                </span>
              </div>

              <select
                required
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.duration || '6 Months'}) — Fee: ₹{c.fee}
                  </option>
                ))}
              </select>
            </div>

            {/* 10th Standard Details */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                10th (High School) Details *
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Board / University *</label>
                  <input
                    type="text"
                    required
                    value={formData.tenthDetails.board}
                    onChange={(e) => handleTenthChange('board', e.target.value)}
                    placeholder="e.g. CGBSE / CBSE"
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
                    placeholder="e.g. 2020"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Obtained Marks</label>
                  <input
                    type="number"
                    value={formData.tenthDetails.obtMarks}
                    onChange={(e) => handleTenthChange('obtMarks', e.target.value)}
                    placeholder="e.g. 385"
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

                {/* Auto Calculated Percentage & Division */}
                {formData.tenthDetails.percentage && (
                  <div className="col-span-2 bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center gap-3">
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

            {/* 12th Details */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                12th (Higher Secondary) Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Board / University</label>
                  <input
                    type="text"
                    value={formData.twelfthDetails.board}
                    onChange={(e) => handleTwelfthChange('board', e.target.value)}
                    placeholder="e.g. CGBSE"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={formData.twelfthDetails.rollNo}
                    onChange={(e) => handleTwelfthChange('rollNo', e.target.value)}
                    placeholder="Roll No"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Passing Year</label>
                  <input
                    type="number"
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
              </div>
            </div>

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
                className="btn-primary py-2.5 px-8 text-xs font-bold flex items-center gap-2"
              >
                Proceed to Document Uploads <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Document Uploads */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" /> Step 3: Photo, Signature & Document Uploads
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate Photo */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="w-24 h-28 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Candidate Photo *</label>
                  <p className="text-[11px] text-slate-500">Upload passport size photo (JPG/PNG)</p>
                  <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs">
                    Choose Photo File
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Candidate Signature */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="w-28 h-20 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                  {sigPreview ? (
                    <img src={sigPreview} alt="Signature" className="w-full h-full object-contain p-1" />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Candidate Signature</label>
                  <p className="text-[11px] text-slate-500">Upload specimen signature image</p>
                  <label className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs">
                    Choose Signature File
                    <input type="file" accept="image/*" onChange={handleSigSelect} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Marksheet Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">10th Marksheet (JPG/PDF)</label>
                <input
                  type="file"
                  onChange={(e) => setTenthFile(e.target.files[0])}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">12th Marksheet (JPG/PDF)</label>
                <input
                  type="file"
                  onChange={(e) => setTwelfthFile(e.target.files[0])}
                  className="input-field text-xs"
                />
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
                className="btn-primary py-2.5 px-8 text-xs font-bold flex items-center gap-2"
              >
                Proceed to Final Undertaking <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Bilingual Declarations & Final Submission */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" /> Step 4: Rules Undertaking & Submission
            </h3>

            {/* Select All Button */}
            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div>
                <p className="font-bold text-indigo-900 text-sm">Rules & Regulation Undertaking (10 Points)</p>
                <p className="text-xs text-indigo-700">Please review and check all undertaking points below</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllRules}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
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
                    <p className="text-[11px] opacity-80 mt-0.5 font-sans">{r.textHi}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Registration Fee & Payment Mode Selection Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-blue-50/70 to-slate-50 border border-indigo-100 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Admission Registration Fee (प्रवेश शुल्क)
                    </h4>
                    <p className="text-[11px] text-slate-500">Collect fee via Online Razorpay or Center Counter Cash</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-semibold block">Payable Amount</span>
                  <strong className="text-lg font-black text-indigo-700">₹{registrationFee}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Razorpay Online Payment */}
                <label
                  onClick={() => setPaymentMode('online_razorpay')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'online_razorpay'
                      ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMode === 'online_razorpay' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                      }`}>
                        {paymentMode === 'online_razorpay' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <strong className="text-xs font-bold text-slate-900">⚡ Online Payment (Razorpay)</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                      UPI / QR / Cards
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug pl-6">
                    Student pays via Google Pay, PhonePe, Paytm QR code or Card. Instant verified receipt.
                  </p>
                </label>

                {/* Option B: Direct Cash / Center Counter */}
                <label
                  onClick={() => setPaymentMode('pay_at_center')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMode === 'pay_at_center'
                      ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMode === 'pay_at_center' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                      }`}>
                        {paymentMode === 'pay_at_center' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <strong className="text-xs font-bold text-slate-900">🏢 Direct Cash (Center Desk)</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug pl-6">
                    Collect ₹{registrationFee} directly at your center counter in Cash or personal UPI.
                  </p>
                </label>
              </div>
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
                className="btn-primary py-3 px-10 text-sm font-black flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Admission...
                  </>
                ) : paymentMode === 'online_razorpay' ? (
                  <>
                    <Zap className="w-5 h-5" /> Pay ₹{registrationFee} Online & Register Student
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Register Student (Cash at Center)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
