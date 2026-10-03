import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPartnerContributionOrder, getMe, getPartnerMembershipConfig, verifyPartnerContribution } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  Award, BadgeCheck, Building2, Check, CheckCircle2, CreditCard,
  Headphones, Loader2, ShieldCheck, Sparkles, Users, Briefcase,
  GraduationCap, Target, BookOpen
} from 'lucide-react';

const benefits = [
  { icon: BadgeCheck, title: 'Contributor recognition', description: 'Show your institute as an organization contributor after the contribution is verified.' },
  { icon: Users, title: 'Stronger organization connection', description: 'Support the organization’s education and community-development initiatives through your contribution.' },
  { icon: Users, title: 'Network collaboration', description: 'Stay connected with the organization and its growing institute network for coordinated opportunities.' },
  { icon: Headphones, title: 'Priority coordination', description: 'Receive focused coordination from the organization team for contributor membership matters.' },
  { icon: ShieldCheck, title: 'Verified payment record', description: 'Your contribution is securely processed through Razorpay and recorded against your institute profile.' },
  { icon: Sparkles, title: 'Future member benefits', description: 'Your contributor membership status is retained for organization-led initiatives and benefit announcements.' },
];

export default function MembershipUpgrade() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    getPartnerMembershipConfig()
      .then((res) => setConfig(res.data))
      .catch((error) => showError(error.response?.data?.message || 'Could not load membership details'))
      .finally(() => setLoading(false));
  }, []);

  const membership = user?.partner?.organizationMembership;
  const isContributor = membership?.type === 'contributor' && membership?.paymentStatus === 'paid';
  const isApproved = user?.partner?.status === 'active';

  const handleUpgrade = async () => {
    if (!config?.fee) return showError('The organization has not configured the contribution fee yet');
    if (!window.Razorpay) return showError('Payment service is loading. Please try again.');
    setUpgrading(true);
    try {
      const { data: order } = await createPartnerContributionOrder();
      const razorpay = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(order.fee * 100),
        currency: 'INR',
        name: user?.partner?.instituteName || 'Organization Membership',
        description: order.label || 'Organization Contribution',
        order_id: order.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: user?.partner?.themeColor || '#4f46e5' },
        handler: async (response) => {
          try {
            await verifyPartnerContribution(response);
            const me = await getMe();
            setUser(me.data.user);
            showSuccess('Your institute is now an organization contributor');
          } catch (error) {
            showError(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setUpgrading(false);
          }
        },
        modal: { ondismiss: () => setUpgrading(false) },
      });
      razorpay.open();
    } catch (error) {
      showError(error.response?.data?.message || 'Could not start contribution payment');
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white px-6 sm:px-10 py-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.42),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.25),_transparent_38%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-5"><Award className="w-4 h-4" /> Organization membership</div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Upgrade your institute to contributor membership</h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">Strengthen your institute’s association with the organization through a one-time contribution. Your contribution is separate from student, admission and course fees.</p>
        </div>
      </section>

      {isContributor ? (
        <section className="card p-7 border border-emerald-200 bg-emerald-50 flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><CheckCircle2 className="w-8 h-8" /></div>
          <div>
            <h2 className="font-black text-xl text-emerald-950">Contributor membership is active</h2>
            <p className="text-sm text-emerald-800 mt-1">Your institute’s organization contribution has been verified{membership?.upgradedAt ? ` on ${new Date(membership.upgradedAt).toLocaleDateString('en-IN')}` : ''}.</p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="card p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-6"><div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Building2 className="w-6 h-6" /></div><div><h2 className="font-black text-xl text-slate-900">What contributor membership includes</h2><p className="text-sm text-slate-500 mt-1">A transparent overview before making the organization contribution.</p></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <Icon className="w-5 h-5 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-sm text-slate-900">{title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600 mt-1.5">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="card p-6 lg:sticky lg:top-6 border border-indigo-200 shadow-lg shadow-indigo-100/50">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">One-time contribution</p>
            <h2 className="font-black text-xl text-slate-900 mt-2">{config?.label || 'Organization Contribution'}</h2>
            <p className="text-4xl font-black text-indigo-700 mt-5">₹{Number(config?.fee || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-2">Contribution is non-refundable and is not adjustable against student, admission or course fees.</p>
            <div className="border-t border-slate-100 mt-5 pt-4 space-y-2 text-xs text-slate-600">
              <p className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Secure Razorpay payment</p>
              <p className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Institute-wise verification record</p>
              <p className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Contributor status after verification</p>
            </div>
            {!isApproved && <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Your institute must be approved by the organization before you can upgrade.</p>}
            {!config?.fee && <p className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">The organization has not set a contribution fee yet.</p>}
            <button type="button" onClick={handleUpgrade} disabled={upgrading || !isApproved || !config?.fee} className="btn-primary w-full mt-5 py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {upgrading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening payment...</> : <><CreditCard className="w-4 h-4" /> Pay & upgrade</>}
            </button>
          </aside>
        </section>
      )}

      {/* Skill Development Funding Projects & TOT Information Boxes */}
      <section className="space-y-6 pt-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Special Institutional Opportunities
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5">
            Skill Development Projects & Training of Trainers (TOT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            भागीदार संस्थानों के लिए सरकारी एवं कॉर्पोरेट सीएसआर अनुदानित परियोजनाएं (Funding Projects) और शिक्षकों के आधिकारिक मास्टर ट्रेनर (TOT) सर्टिफिकेशन से जुड़ी संपूर्ण मार्गदर्शिका।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Box 1: Skill Development Funding Projects */}
          <div className="card p-6 sm:p-8 border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/30 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
                  Funding & CSR Projects
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Target Allocation
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  Skill Development Funding Projects
                </h3>
                <p className="text-xs font-bold text-indigo-700 mt-0.5">
                  कौशल विकास अनुदान व सरकारी/सीएसआर परियोजनाएं
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  केंद्र व राज्य सरकारों (Central & State Govts) तथा प्रमुख औद्योगिक घरानों के CSR फंड्स द्वारा प्रायोजित कौशल विकास योजनाओं में भागीदार संस्थानों का चयन एवं बैच आवंटन।
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-white rounded-2xl border border-indigo-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Govt Schemes & CSR Batch Allotment (योजनाएं एवं बैच आवंटन)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    PMKVY, DDU-GKY, State Skill Missions (SSDM), Samarth और प्रमुख कॉर्पोरेट CSR योजनाओं के तहत केंद्रों को निःशुल्क ट्रेनिंग बैचेस आवंटित किए जाते हैं।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-indigo-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Target Allocation Priority (लक्ष्य आवंटन में पहली प्राथमिकता)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    कंट्रीब्यूटर व सक्रिय पार्टनर संस्थानों को उनके जिले व तहसील स्तर पर छात्र नामांकन लक्ष्य (Targets) सबसे पहले आवंटित किए जाते हैं।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-indigo-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Reimbursement & Grants (प्रति छात्र प्रशिक्षण अनुदान)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    सफल प्रशिक्षण, बायोमेट्रिक अटेंडेंस व असेसमेंट पूरा होने पर सरकारी/सीएसआर नियमों के अनुसार प्रति छात्र निर्धारित अनुदान संस्था खाते में प्राप्त होता है।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-indigo-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Center Audit & Compliance (सेंटर ऑडिट व एक्रिडिटेशन सपोर्ट)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    लैब उपकरण, सीसीटीवी, बायोमेट्रिक व क्लासरूम मानकों को सरकारी पोर्टल के अनुरूप तैयार करने और फिजिकल इंस्पेक्शन पास कराने में संस्था का पूर्ण मार्गदर्शन।
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-indigo-100/80 flex items-center justify-between gap-3 text-xs bg-indigo-50/60 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 rounded-b-3xl">
              <span className="text-[11px] text-indigo-950 font-semibold flex items-center gap-1.5">
                💡 <span className="font-bold">नोट:</span> Contributor सेंटर्स को प्रोजेक्ट एलोकेशन और सेंटर एक्रिडिटेशन में टॉप प्रायोरिटी दी जाती है।
              </span>
            </div>
          </div>

          {/* Box 2: Training of Trainers (TOT) Program */}
          <div className="card p-6 sm:p-8 border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                  TOT Certification
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                  NSDC / SSC Standards
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  Training of Trainers (TOT) Program
                </h3>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  प्रशिक्षकों का प्रशिक्षण एवं मास्टर ट्रेनर प्रमाणन
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  राष्ट्रीय कौशल विकास मानकों (NSDC / Sector Skill Councils) के अनुरूप आपके संस्थान के फैकल्टी व इंस्ट्रक्टर्स का आधिकारिक मूल्यांकन व मास्टर ट्रेनर एक्रिडिटेशन।
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Official Master Trainer Credential (आधिकारिक मास्टर ट्रेनर प्रमाणन)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    संबंधित Sector Skill Council (SSC) के तहत ट्रेनर का औपचारिक मूल्यांकन, आधिकारिक TOT सर्टिफिकेट, डिजिटल बैज और यूनिक ट्रेनर आईडी प्राप्त होती है।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Mandatory for Funded Projects (फंडेड प्रोजेक्ट्स हेतु अनिवार्य पात्रता)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    सरकारी व सीएसआर कौशल योजनाओं में क्लासेस केवल TOT प्रमाणित ट्रेनर द्वारा ही मान्य होती हैं, जिससे आपका केंद्र प्रोजेक्ट्स के लिए तुरंत पात्र बनता है।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Pedagogy & Digital Lab Training (आधुनिक अध्यापन तकनीक व हैंड्स-ऑन लैब)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    आउटकम-बेस्ड एजुकेशन (OBE), इंडस्ट्री प्रोजेक्ट सिमुलेशन, डिजिटल स्मार्ट क्लासरूम डिलीवरी और स्टूडेंट इवैल्यूएशन पर विशेष प्रैक्टिकल मॉड्यूल।
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-emerald-100/80 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800">
                      Continuous Faculty Development (वार्षिक फैकल्टी अपस्किलिंग FDP)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    AI टूल्स, उभरती तकनीकों, जीएसटी/टैली, हार्डवेयर और हेल्थकेयर के नए सिलेबस के अनुसार संस्थान के शिक्षकों का वर्षभर निरंतर अपग्रेडेशन वर्कशॉप।
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-emerald-100/80 flex items-center justify-between gap-3 text-xs bg-emerald-50/60 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 rounded-b-3xl">
              <span className="text-[11px] text-emerald-950 font-semibold flex items-center gap-1.5">
                🏆 <span className="font-bold">मानक:</span> TOT प्रमाणित फैकल्टी आपके संस्थान को A-ग्रेड सेंटर एक्रिडिटेशन और 100% ऑडिट अनुपालन दिलाती है।
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
