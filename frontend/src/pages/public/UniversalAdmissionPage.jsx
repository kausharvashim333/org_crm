import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPublicPartners, getPublicCourses, submitPublicAdmission, createAdmissionOrder, getOrgHomepagePublic } from '../../api';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Building2, BookOpen, User, GraduationCap, Upload, CheckCircle2,
  ChevronRight, ChevronLeft, ShieldCheck, FileText, FileCheck, Check,
  School, MapPin, Sparkles, CreditCard, QrCode, Shield, Zap, IndianRupee
} from 'lucide-react';

const BOARDS_LIST = [
  'CGBSE Raipur (Chhattisgarh Board)',
  'CBSE Delhi (Central Board)',
  'ICSE Board (CISCE)',
  'UP Board (UPMSP)',
  'MP Board (MPBSE)',
  'RBSE Rajasthan',
  'BSEB Bihar',
  'MHRD Open School (NIOS)',
  'Other State Board'
];

const UNIVERSITIES_LIST = [
  'Sant Gahira Guru Vishwavidyalaya, Ambikapur',
  'Pandit Ravishankar Shukla University, Raipur',
  'Guru Ghasidas Vishwavidyalaya, Bilaspur',
  'Chhattisgarh Swami Vivekanand Technical University (CSVTU), Bhilai',
  'Shaheed Nandkumar Patel Vishwavidyalaya, Raigarh',
  'Hemchand Yadav Vishwavidyalaya (Durg University)',
  'Pandit Sundarlal Sharma Open University, Bilaspur',
  'Dr. C.V. Raman University, Bilaspur',
  'MATS University, Raipur',
  'Kalinga University, Raipur',
  'ITM University, Raipur',
  'Amity University, Raipur',
  'Other Government / Recognized University'
];

const DECLARATION_ITEMS = [
  { id: 1, text: 'Maine jo bhi jaankari di hai wo bilkul sahi aur sacchi hai. (All furnished information is accurate and true.)' },
  { id: 2, text: 'Main institute ke sabhi niyam aur kanoon manne ko taiyaar hun. (I agree to abide by all institute rules.)' },
  { id: 3, text: 'Mujhe pata hai ki ek baar jama ki gayi fees non-refundable hogi. (Admission fees once paid are non-refundable.)' },
  { id: 4, text: 'Main minimum 75% attendance rakhne ka pran karta/karti hun. (I undertake to maintain minimum 75% attendance.)' },
  { id: 5, text: 'Main class aur institute premises mein shant aur vyavasthit rahunga/karungi. (I will maintain decorum and discipline.)' },
  { id: 6, text: 'Main institute ki property (computers, lab, furniture) ka dhyan rakhunga/lungi. (I will take proper care of institute equipment.)' },
  { id: 7, text: 'Main kisi bhi tarah ke ragging ya misconduct mein hissa nahi me lunga/lungi. (I strictly prohibit ragging or misconduct.)' },
  { id: 8, text: 'Main teachers aur staff members ka samman karunga/karungi. (I will respect faculty and staff at all times.)' },
  { id: 9, text: 'Main assignments aur practical lab work samay par submit karunga/karungi. (I will submit lab assignments on time.)' },
  { id: 10, text: 'Main exam rules ka paalan karunga/karungi aur cheating nahi karunga/karungi. (I will follow exam rules without unfair means.)' },
];

export default function UniversalAdmissionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramPartnerId = searchParams.get('partnerId');
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [partners, setPartners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [hp, setHp] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    partnerId: paramPartnerId || '',
    courseId: '',
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    whatsappPhone: '',
    email: '',
    category: 'General',
    bloodGroup: '',
    address: '',
    city: '',
    tehsil: '',
    district: '',
    state: 'Chhattisgarh',
    pincode: '',
    idProofType: 'aadhaar',
    idProofNumber: '',
    qualification: '12th',
    
    // Parent Details
    fatherOccupation: '',
    fatherPhone: '',
    familyIncome: 'Below ₹1 Lakh',
    referenceSource: 'Friend / Student',

    // 10th Academic Details
    tenthBoard: 'CGBSE Raipur (Chhattisgarh Board)',
    tenthSchool: '',
    tenthYear: '2022',
    tenthRoll: '',
    tenthMarksType: 'marks',
    tenthTotal: '',
    tenthObtained: '',
    tenthPercentage: '',
    tenthDivision: '',

    // 12th Academic Details
    twelfthBoard: 'CGBSE Raipur (Chhattisgarh Board)',
    twelfthStream: 'Science',
    twelfthSchool: '',
    twelfthYear: '2024',
    twelfthRoll: '',
    twelfthMarksType: 'marks',
    twelfthTotal: '',
    twelfthObtained: '',
    twelfthPercentage: '',
    twelfthDivision: '',

    // Graduation Details (Conditional)
    gradDegree: 'B.Sc. / B.A. / B.Com',
    gradUniversity: 'Sant Gahira Guru Vishwavidyalaya, Ambikapur',
    gradCollege: '',
    gradStream: 'Computer Science',
    gradYear: '2025',
    gradRoll: '',
    gradMarksType: 'percentage', // 'percentage' or 'cgpa'
    gradTotal: '',
    gradObtained: '',
    gradCGPA: '',
  });

  // Checkboxes State (Declarations)
  const [agreedDeclarations, setAgreedDeclarations] = useState(
    DECLARATION_ITEMS.map(item => item.id) // Default all checked
  );

  // Uploaded Files State
  const [files, setFiles] = useState({
    photo: null,
    signature: null,
    idProof: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
    gradMarksheet: null,
  });

  const [previews, setPreviews] = useState({
    photo: null,
    signature: null,
  });

  const [paymentMode, setPaymentMode] = useState('online_razorpay'); // 'online_razorpay' | 'pay_at_center'

  useEffect(() => {
    Promise.all([getPublicPartners(), getPublicCourses(), getOrgHomepagePublic()])
      .then(([partnersRes, coursesRes, hpRes]) => {
        const allPartners = partnersRes.data.partners || [];
        const activePartners = allPartners.filter(p => p.status === 'active' && p.showInAdmissionForm !== false);
        
        // If paramPartnerId is passed, find target partner
        const targetPartner = paramPartnerId ? allPartners.find(p => p._id === paramPartnerId) : null;
        if (targetPartner) {
          if (!activePartners.some(p => p._id === targetPartner._id)) {
            activePartners.unshift(targetPartner);
          }
          setPartners(activePartners);
          setFormData(prev => ({ ...prev, partnerId: targetPartner._id }));

          // Filter courses for target partner
          const pType = targetPartner.centerType || 'Computer & IT Training';
          const filteredCourses = (coursesRes.data.courses || []).filter(c => {
            if (!c.isActive) return false;
            if (c.partnerId === targetPartner._id) return true;
            if (c.isStandard) {
              return !c.centerType || c.centerType === 'All' || c.centerType === pType;
            }
            return false;
          });
          setCourses(filteredCourses);
        } else {
          setPartners(activePartners);
          const activeCourses = (coursesRes.data.courses || []).filter(c => c.isActive);
          setCourses(activeCourses);
        }

        setHp(hpRes.data.homepage);
        setLoading(false);
      })
      .catch(() => {
        showError('Failed to load centers and courses');
        setLoading(false);
      });
  }, [paramPartnerId]);

  // Filter courses when partnerId changes manually
  useEffect(() => {
    if (!paramPartnerId && formData.partnerId && partners.length > 0) {
      const selected = partners.find(p => p._id === formData.partnerId);
      if (selected) {
        getPublicCourses().then(res => {
          const pType = selected.centerType || 'Computer & IT Training';
          const filtered = (res.data.courses || []).filter(c => {
            if (!c.isActive) return false;
            if (c.partnerId === selected._id) return true;
            if (c.isStandard) {
              return !c.centerType || c.centerType === 'All' || c.centerType === pType;
            }
            return false;
          });
          setCourses(filtered);
        }).catch(() => {});
      }
    }
  }, [formData.partnerId, partners, paramPartnerId]);

  const themeColor = hp?.settings?.themeColor || '#2563eb';

  const selectedPartner = partners.find(p => p._id === formData.partnerId);
  const selectedCourse = courses.find(c => c._id === formData.courseId);
  const registrationFee = selectedCourse?.registrationFee > 0 ? selectedCourse.registrationFee : 500;

  // Determine if Graduation section is required
  const isGraduationRequired = () => {
    if (!selectedCourse) return false;
    const name = (selectedCourse.name || '').toUpperCase();
    const code = (selectedCourse.code || '').toUpperCase();
    return name.includes('PGDCA') || name.includes('POST GRADUATE') || name.includes('MASTER') || code.includes('PGDCA');
  };

  // Helper for Percentage & Division Calculation
  const calcPctAndDiv = (obtained, total) => {
    const obt = parseFloat(obtained);
    const tot = parseFloat(total);
    if (!obt || !tot || tot <= 0) return { pct: null, div: '—', badgeClass: 'bg-slate-100 text-slate-500' };
    const pct = ((obt / tot) * 100).toFixed(2);
    let div = '3rd Division';
    let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    if (pct >= 60) {
      div = '1st Division';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (pct >= 45) {
      div = '2nd Division';
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return { pct, div, badgeClass };
  };

  // Helper for CGPA Conversion
  const calcCGPAStats = (cgpaVal) => {
    const cg = parseFloat(cgpaVal);
    if (!cg || cg < 0 || cg > 10) return { pct: null, div: '—', badgeClass: 'bg-slate-100 text-slate-500' };
    const pct = (cg * 9.5).toFixed(2);
    let div = '3rd Division';
    let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    if (pct >= 60) {
      div = '1st Division';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (pct >= 45) {
      div = '2nd Division';
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return { pct, div, badgeClass };
  };

  const tenthStats = calcPctAndDiv(formData.tenthObtained, formData.tenthTotal);
  const twelfthStats = calcPctAndDiv(formData.twelfthObtained, formData.twelfthTotal);
  const gradStats = formData.gradMarksType === 'cgpa' 
    ? calcCGPAStats(formData.gradCGPA)
    : calcPctAndDiv(formData.gradObtained, formData.gradTotal);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    setFiles(prev => ({ ...prev, [field]: file }));
    if (field === 'photo' || field === 'signature') {
      setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const toggleDeclaration = (id) => {
    setAgreedDeclarations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllDeclarations = () => {
    if (agreedDeclarations.length === DECLARATION_ITEMS.length) {
      setAgreedDeclarations([]);
    } else {
      setAgreedDeclarations(DECLARATION_ITEMS.map(i => i.id));
    }
  };

  const handleNextStep1 = () => {
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      return showError('Full Name aur Mobile Number zaroori hain');
    }
    if (formData.phone.length < 10) {
      return showError('Mobile Number 10 digits ka hona chahiye');
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    if (!formData.partnerId) return showError('Kripya Institute Center select karein');
    if (!formData.courseId) return showError('Kripya Course select karein');
    if (!formData.tenthBoard || !formData.tenthRoll) {
      return showError('10th Board aur Roll Number zaroori hain');
    }
    if (isGraduationRequired()) {
      if (!formData.gradUniv || !formData.gradDegree) {
        return showError('Is Course ke liye Graduation Details zaroori hain');
      }
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep3 = () => {
    if (!files.photo) return showError('Passport Photo upload karna zaroori hai');
    if (!files.signature) return showError('Student Signature upload karna zaroori hai');
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const performSubmission = async (paymentDetails = {}) => {
    setSubmitting(true);
    try {
      const data = new FormData();
      
      // Append main form fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Append payment details
      data.append('paymentMode', paymentDetails.paymentMode || paymentMode);
      data.append('paidAmount', paymentDetails.paidAmount !== undefined ? paymentDetails.paidAmount : (paymentMode === 'online_razorpay' ? registrationFee : 0));
      if (paymentDetails.razorpayOrderId) data.append('razorpayOrderId', paymentDetails.razorpayOrderId);
      if (paymentDetails.razorpayPaymentId) data.append('razorpayPaymentId', paymentDetails.razorpayPaymentId);
      if (paymentDetails.razorpaySignature) data.append('razorpaySignature', paymentDetails.razorpaySignature);

      // Construct structured JSON objects for backend
      const tenthObj = {
        board: formData.tenthBoard,
        schoolName: formData.tenthSchool,
        passingYear: formData.tenthYear,
        rollNo: formData.tenthRoll,
        totalMarks: Number(formData.tenthTotal) || 0,
        obtainedMarks: Number(formData.tenthObtained) || 0,
        percentage: tenthStats.pct ? Number(tenthStats.pct) : undefined,
        division: tenthStats.div,
      };
      data.append('tenthDetails', JSON.stringify(tenthObj));

      const twelfthObj = {
        board: formData.twelfthBoard,
        stream: formData.twelfthStream,
        schoolName: formData.twelfthSchool,
        passingYear: formData.twelfthYear,
        rollNo: formData.twelfthRoll,
        totalMarks: Number(formData.twelfthTotal) || 0,
        obtainedMarks: Number(formData.twelfthObtained) || 0,
        percentage: twelfthStats.pct ? Number(twelfthStats.pct) : undefined,
        division: twelfthStats.div,
      };
      data.append('twelfthDetails', JSON.stringify(twelfthObj));

      if (isGraduationRequired() || formData.gradDegree) {
        const gradObj = {
          university: formData.gradUniv,
          collegeName: formData.gradCollege,
          degree: formData.gradDegree,
          stream: formData.gradStream,
          passingYear: formData.gradYear,
          rollNo: formData.gradRoll,
          marksType: formData.gradMarksType,
          totalMarks: Number(formData.gradTotal) || 0,
          obtainedMarks: Number(formData.gradObtained) || 0,
          cgpa: Number(formData.gradCGPA) || 0,
          percentage: gradStats.pct ? Number(gradStats.pct) : undefined,
          division: gradStats.div,
        };
        data.append('graduationDetails', JSON.stringify(gradObj));
      }

      data.append('declarationsAgreed', 'true');

      // Append files
      if (files.photo) data.append('photo', files.photo);
      if (files.signature) data.append('signature', files.signature);
      if (files.idProof) data.append('idProof', files.idProof);
      if (files.tenthMarksheet) data.append('tenthMarksheet', files.tenthMarksheet);
      if (files.twelfthMarksheet) data.append('twelfthMarksheet', files.twelfthMarksheet);
      if (files.gradMarksheet) data.append('gradMarksheet', files.gradMarksheet);

      const res = await submitPublicAdmission(data);
      showSuccess(res.data.message || 'Admission Application Submitted!');
      
      // Redirect to receipt page
      navigate(`/admission/receipt/${res.data.applicationNo}`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit admission application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (agreedDeclarations.length < DECLARATION_ITEMS.length) {
      return showError('Please agree to all 10 declaration rules before submitting.');
    }

    if (paymentMode === 'online_razorpay' && window.Razorpay && registrationFee > 0) {
      setSubmitting(true);
      try {
        const orderRes = await createAdmissionOrder({
          courseId: formData.courseId,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          feeAmount: registrationFee,
        });

        const rzpData = orderRes.data;

        const options = {
          key: rzpData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TQKFK8UhmFxMt1',
          amount: Math.round(registrationFee * 100),
          currency: 'INR',
          name: 'Skill India Institute Network',
          description: `Admission Registration: ${selectedCourse?.name || 'Course Registration'}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: themeColor || '#4f46e5',
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
              showError('Payment window closed. You can retry online or choose Pay at Center.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.error(err);
        showError('Could not initialize online payment. Submitting with Pay at Center option.');
        await performSubmission({ paymentMode: 'pay_at_center' });
      }
    } else {
      await performSubmission({ paymentMode: 'pay_at_center' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <Navbar activePage="services" />

      {/* Header Banner - Matching Site Theme */}
      <div 
        className="relative py-12 px-6 text-white overflow-hidden shadow-md"
        style={{ backgroundColor: themeColor }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,white_2px,transparent_2px)] [background-size:24px_24px]"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Online Student Registration
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Institute Network Admission Portal
          </h1>
          <p className="text-sm md:text-base text-white/90 max-w-2xl mx-auto font-medium">
            Apne pasandida Center aur Course ke liye online admission form bharein aur instant Printable Application Slip praapt karein.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        
        {/* Step Progress Bar */}
        <div className="mb-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold mb-3 text-slate-500">
            <span className={step >= 1 ? 'text-blue-600 font-extrabold' : ''}>1. Personal & Address</span>
            <span className={step >= 2 ? 'text-blue-600 font-extrabold' : ''}>2. Course & Qualification</span>
            <span className={step >= 3 ? 'text-blue-600 font-extrabold' : ''}>3. Document Upload</span>
            <span className={step >= 4 ? 'text-blue-600 font-extrabold' : ''}>4. Declaration & Submit</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: s < step ? '#10b981' : s === step ? themeColor : '#e2e8f0'
                }}
              />
            ))}
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
          
          {/* STEP 1: PERSONAL & ADDRESS DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Step 1: Personal & Family Information
                </h2>
                <p className="text-xs text-slate-500 mt-1">Student ki personal jaankari aur parivaar details bharein</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Student Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Student ka poora naam"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select (Optional)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    required
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp Number</label>
                  <input
                    type="tel"
                    name="whatsappPhone"
                    value={formData.whatsappPhone}
                    onChange={handleInputChange}
                    maxLength={10}
                    placeholder="WhatsApp (if different)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@domain.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Identity & Address Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Identity Proof & Full Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Proof Type</label>
                    <select
                      name="idProofType"
                      value={formData.idProofType}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="voter">Voter ID</option>
                      <option value="pan">PAN Card</option>
                      <option value="driving_license">Driving License</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Proof Number</label>
                    <input
                      type="text"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleInputChange}
                      placeholder="12-digit Aadhaar ya ID Number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">House No. / Street / Village</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ghar no, street, mohalla"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">City / Village Name</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City ya gaon"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tehsil</label>
                    <input
                      type="text"
                      name="tehsil"
                      value={formData.tehsil}
                      onChange={handleInputChange}
                      placeholder="Tehsil name"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="District name"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State name"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      maxLength={6}
                      placeholder="6-digit PIN"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Details Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Parent / Guardian Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Father's Name</label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      placeholder="Father ka naam"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Father's Occupation</label>
                    <input
                      type="text"
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleInputChange}
                      placeholder="Kheti / Job / Business"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Father's Mobile</label>
                    <input
                      type="tel"
                      name="fatherPhone"
                      value={formData.fatherPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="10-digit number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mother's Name</label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      placeholder="Mother ka naam"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Annual Family Income</label>
                    <select
                      name="familyIncome"
                      value={formData.familyIncome}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option>Below ₹1 Lakh</option>
                      <option>₹1 Lakh - ₹2.5 Lakh</option>
                      <option>₹2.5 Lakh - ₹5 Lakh</option>
                      <option>Above ₹5 Lakh</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  style={{ backgroundColor: themeColor }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:opacity-90"
                >
                  Next Step: Course & Qualification <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COURSE & QUALIFICATION DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Step 2: Course & Educational Qualification
                </h2>
                <p className="text-xs text-slate-500 mt-1">Center, Course select karein aur 10th/12th/Graduation marks daalein</p>
              </div>

              {/* Center & Course Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                {paramPartnerId && selectedPartner ? (
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-4.5 rounded-2xl shadow-lg border border-indigo-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {selectedPartner.logo ? (
                        <img src={selectedPartner.logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover bg-white p-0.5" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                            Applying Direct To Center
                          </span>
                          <span className="text-[10px] font-bold text-emerald-300">✓ Verified Center</span>
                        </div>
                        <h3 className="text-base font-black text-white mt-0.5">{selectedPartner.instituteName}</h3>
                        <p className="text-xs text-indigo-200">{selectedPartner.city}, {selectedPartner.state} • Specialization: {selectedPartner.centerType || 'Training Center'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1.5">Select Institute Center *</label>
                    <select
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                    >
                      <option value="">-- Choose Institute Center --</option>
                      {partners.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.instituteName || p.centerName} ({p.city || p.district || 'Center'}) — {p.centerType || 'Center'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1.5">Select Course *</label>
                  <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.duration || 'Diploma'}) — ₹{c.fee || c.courseFee || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-blue-900 mb-1.5">How did you hear about us?</label>
                  <select
                    name="referenceSource"
                    value={formData.referenceSource}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                  >
                    <option>Friend / Existing Student</option>
                    <option>Social Media (Facebook / Instagram)</option>
                    <option>Newspaper / Pamphlet</option>
                    <option>Banner / Poster</option>
                    <option>Google Search / Website</option>
                    <option>Direct Visit</option>
                  </select>
                </div>
              </div>

              {/* 10th Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <School className="w-4 h-4 text-blue-600" /> 10th / High School Details
                  </h3>
                  {tenthStats.pct && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">Percentage: <strong className="text-blue-700">{tenthStats.pct}%</strong></span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${tenthStats.badgeClass}`}>
                        {tenthStats.div}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Board *</label>
                    <select
                      name="tenthBoard"
                      value={formData.tenthBoard}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {BOARDS_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">School Name</label>
                    <input
                      type="text"
                      name="tenthSchool"
                      value={formData.tenthSchool}
                      onChange={handleInputChange}
                      placeholder="School ka naam"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Passing Year *</label>
                    <input
                      type="number"
                      name="tenthYear"
                      value={formData.tenthYear}
                      onChange={handleInputChange}
                      placeholder="2022"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                    <input
                      type="text"
                      name="tenthRoll"
                      value={formData.tenthRoll}
                      onChange={handleInputChange}
                      placeholder="10th Roll No."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks *</label>
                    <input
                      type="number"
                      name="tenthTotal"
                      value={formData.tenthTotal}
                      onChange={handleInputChange}
                      placeholder="e.g. 500"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Obtained Marks *</label>
                    <input
                      type="number"
                      name="tenthObtained"
                      value={formData.tenthObtained}
                      onChange={handleInputChange}
                      placeholder="e.g. 385"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 12th Section */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <School className="w-4 h-4 text-blue-600" /> 12th / Intermediate Details
                  </h3>
                  {twelfthStats.pct && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">Percentage: <strong className="text-blue-700">{twelfthStats.pct}%</strong></span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${twelfthStats.badgeClass}`}>
                        {twelfthStats.div}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Board</label>
                    <select
                      name="twelfthBoard"
                      value={formData.twelfthBoard}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {BOARDS_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stream</label>
                    <select
                      name="twelfthStream"
                      value={formData.twelfthStream}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="Science">Science (PCM / PCB)</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts / Humanities</option>
                      <option value="Vocational">Vocational / IT</option>
                      <option value="Agriculture">Agriculture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">School / College Name</label>
                    <input
                      type="text"
                      name="twelfthSchool"
                      value={formData.twelfthSchool}
                      onChange={handleInputChange}
                      placeholder="School ya college ka naam"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Passing Year</label>
                    <input
                      type="number"
                      name="twelfthYear"
                      value={formData.twelfthYear}
                      onChange={handleInputChange}
                      placeholder="2024"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      name="twelfthRoll"
                      value={formData.twelfthRoll}
                      onChange={handleInputChange}
                      placeholder="12th Roll No."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      name="twelfthTotal"
                      value={formData.twelfthTotal}
                      onChange={handleInputChange}
                      placeholder="e.g. 500"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Obtained Marks</label>
                    <input
                      type="number"
                      name="twelfthObtained"
                      value={formData.twelfthObtained}
                      onChange={handleInputChange}
                      placeholder="e.g. 410"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Graduation Section (Conditional or Optional) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isGraduationRequired() 
                  ? 'bg-purple-50/60 border-purple-200 ring-2 ring-purple-400/30' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-purple-600" /> Graduation Details {isGraduationRequired() ? '(Required for PGDCA)' : '(Optional)'}
                    </h3>
                    <p className="text-[11px] text-slate-500">UG Degree info (BA, B.Sc, B.Com, BCA, B.Tech)</p>
                  </div>
                  {gradStats.pct && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">Equivalent: <strong className="text-purple-700">{gradStats.pct}%</strong></span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${gradStats.badgeClass}`}>
                        {gradStats.div}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">University Name</label>
                    <select
                      name="gradUniv"
                      value={formData.gradUniv}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      {UNIVERSITIES_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">College Name</label>
                    <input
                      type="text"
                      name="gradCollege"
                      value={formData.gradCollege}
                      onChange={handleInputChange}
                      placeholder="College Name"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Degree Name</label>
                    <select
                      name="gradDegree"
                      value={formData.gradDegree}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="B.Sc">B.Sc</option>
                      <option value="BA">BA</option>
                      <option value="B.Com">B.Com</option>
                      <option value="BCA">BCA</option>
                      <option value="BBA">BBA</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stream / Subject</label>
                    <input
                      type="text"
                      name="gradStream"
                      value={formData.gradStream}
                      onChange={handleInputChange}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Passing Year</label>
                    <input
                      type="number"
                      name="gradYear"
                      value={formData.gradYear}
                      onChange={handleInputChange}
                      placeholder="2025"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Marks Format Radio Toggle */}
                  <div className="md:col-span-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Marks Mode:</label>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="radio"
                          name="gradMarksType"
                          value="percentage"
                          checked={formData.gradMarksType === 'percentage'}
                          onChange={handleInputChange}
                          className="accent-blue-600"
                        />
                        Percentage Mode
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="radio"
                          name="gradMarksType"
                          value="cgpa"
                          checked={formData.gradMarksType === 'cgpa'}
                          onChange={handleInputChange}
                          className="accent-blue-600"
                        />
                        CGPA Mode (Out of 10)
                      </label>
                    </div>
                  </div>

                  {formData.gradMarksType === 'percentage' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                        <input
                          type="number"
                          name="gradTotal"
                          value={formData.gradTotal}
                          onChange={handleInputChange}
                          placeholder="e.g. 1800"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Obtained Marks</label>
                        <input
                          type="number"
                          name="gradObtained"
                          value={formData.gradObtained}
                          onChange={handleInputChange}
                          placeholder="e.g. 1250"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CGPA (Out of 10)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="gradCGPA"
                        value={formData.gradCGPA}
                        onChange={handleInputChange}
                        placeholder="e.g. 7.85"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back: Personal Info
                </button>

                <button
                  type="button"
                  onClick={handleNextStep2}
                  style={{ backgroundColor: themeColor }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:opacity-90"
                >
                  Next Step: Document Upload <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENT UPLOADS & PREVIEWS */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" /> Step 3: Document & Photo Uploads
                </h2>
                <p className="text-xs text-slate-500 mt-1">Student Photo, Signature aur Educational Certificates Upload karein</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Student Passport Photo *</label>
                  <div className="w-32 h-40 rounded-xl bg-white border-2 border-dashed border-blue-400 overflow-hidden flex items-center justify-center relative group shadow-sm">
                    {previews.photo ? (
                      <img src={previews.photo} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 p-2">
                        <User className="w-10 h-10 mx-auto mb-1" />
                        <span className="text-[10px] block">Click to upload photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('photo', e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">Format: JPG/PNG, Max 2MB</span>
                </div>

                {/* Signature Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-3">
                  <label className="block text-xs font-bold text-slate-800">Student Signature *</label>
                  <div className="w-48 h-24 rounded-xl bg-white border-2 border-dashed border-blue-400 overflow-hidden flex items-center justify-center relative group shadow-sm">
                    {previews.signature ? (
                      <img src={previews.signature} alt="Signature" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-slate-400 p-2">
                        <FileText className="w-8 h-8 mx-auto mb-1" />
                        <span className="text-[10px] block">Click to upload signature</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('signature', e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">White paper par signature image</span>
                </div>

                {/* Aadhar / ID Proof */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Aadhaar Card Document</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange('idProof', e.target.files[0])}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {files.idProof && <span className="text-[11px] text-emerald-600 font-bold block">✓ {files.idProof.name}</span>}
                </div>

                {/* 10th Marksheet */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">10th Marksheet Document</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange('tenthMarksheet', e.target.files[0])}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {files.tenthMarksheet && <span className="text-[11px] text-emerald-600 font-bold block">✓ {files.tenthMarksheet.name}</span>}
                </div>

                {/* 12th Marksheet */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">12th Marksheet Document</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange('twelfthMarksheet', e.target.files[0])}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {files.twelfthMarksheet && <span className="text-[11px] text-emerald-600 font-bold block">✓ {files.twelfthMarksheet.name}</span>}
                </div>

                {/* Graduation Marksheet */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">Graduation Marksheet (If applicable)</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange('gradMarksheet', e.target.files[0])}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {files.gradMarksheet && <span className="text-[11px] text-emerald-600 font-bold block">✓ {files.gradMarksheet.name}</span>}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back: Course Details
                </button>

                <button
                  type="button"
                  onClick={handleNextStep3}
                  style={{ backgroundColor: themeColor }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:opacity-90"
                >
                  Next Step: Review & Declaration <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DECLARATION & APPLICATION SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Step 4: Undertaking & Final Submission
                </h2>
                <p className="text-xs text-slate-500 mt-1">Application Summary review karein aur 10-Point Rules Declaration ko agree karein</p>
              </div>

              {/* Summary Review Box */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-3">
                <h3 className="font-bold text-sm text-blue-900 border-b border-blue-200 pb-2">
                  Application Summary Preview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
                  <div><span className="text-slate-500 block">Student Name:</span> <strong className="text-slate-900">{formData.fullName}</strong></div>
                  <div><span className="text-slate-500 block">Mobile No:</span> <strong className="text-slate-900">{formData.phone}</strong></div>
                  <div><span className="text-slate-500 block">Center:</span> <strong className="text-slate-900">{selectedPartner?.instituteName || 'Selected Center'}</strong></div>
                  <div><span className="text-slate-500 block">Course:</span> <strong className="text-slate-900">{selectedCourse?.name || 'Selected Course'}</strong></div>
                  <div><span className="text-slate-500 block">10th %:</span> <strong className="text-slate-900">{tenthStats.pct ? `${tenthStats.pct}% (${tenthStats.div})` : '—'}</strong></div>
                  <div><span className="text-slate-500 block">12th %:</span> <strong className="text-slate-900">{twelfthStats.pct ? `${twelfthStats.pct}% (${twelfthStats.div})` : '—'}</strong></div>
                  <div><span className="text-slate-500 block">Graduation:</span> <strong className="text-slate-900">{gradStats.pct ? `${gradStats.pct}% (${gradStats.div})` : 'N/A'}</strong></div>
                  <div><span className="text-slate-500 block">Photo & Sign:</span> <strong className="text-emerald-700">Ready</strong></div>
                </div>
              </div>

              {/* 10-Point Bilingual Declaration Checklist */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Institute Declaration & Rules Undertaking (घोषणा-पत्र)
                  </h3>

                  <button
                    type="button"
                    onClick={toggleSelectAllDeclarations}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {agreedDeclarations.length === DECLARATION_ITEMS.length ? 'Deselect All' : 'Select All 10 Rules'}
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {DECLARATION_ITEMS.map((item) => {
                    const isChecked = agreedDeclarations.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        onClick={() => toggleDeclaration(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-blue-50/70 border-blue-200 text-slate-900' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs leading-relaxed">
                          <strong>Rule #{item.id}:</strong> {item.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Registration Fee & Online Payment Mode Selection */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/60 to-purple-50/50 border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Admission Registration Fee (प्रवेश शुल्क)
                      </h3>
                      <p className="text-[11px] text-slate-500">Choose your preferred fee payment mode</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold block">Payable Fee</span>
                    <strong className="text-lg font-black text-indigo-700">₹{registrationFee}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Razorpay Online Payment */}
                  <label
                    onClick={() => setPaymentMode('online_razorpay')}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMode === 'online_razorpay'
                        ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMode === 'online_razorpay' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                        }`}>
                          {paymentMode === 'online_razorpay' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <strong className="text-xs font-bold text-slate-900">⚡ Online Payment (Instant)</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug pl-6">
                      UPI (Google Pay, PhonePe, Paytm), QR Code, Debit/Credit Card, Net Banking. Instant Roll No allotment.
                    </p>
                  </label>

                  {/* Option 2: Pay Offline at Center */}
                  <label
                    onClick={() => setPaymentMode('pay_at_center')}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMode === 'pay_at_center'
                        ? 'border-indigo-600 bg-white shadow-md shadow-indigo-600/10 ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentMode === 'pay_at_center' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                        }`}>
                          {paymentMode === 'pay_at_center' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <strong className="text-xs font-bold text-slate-900">🏢 Pay at Center Desk</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Offline
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug pl-6">
                      Submit application online now and pay registration fee in Cash/UPI at the institute counter.
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back: Upload Documents
                </button>

                <button
                  type="submit"
                  disabled={submitting || agreedDeclarations.length < DECLARATION_ITEMS.length}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : paymentMode === 'online_razorpay' ? (
                    <>
                      <Zap className="w-5 h-5" /> Pay ₹{registrationFee} & Complete Admission
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Submit Admission Form
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

      <Footer />
    </div>
  );
}
