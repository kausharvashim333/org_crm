import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPartnerContributionOrder, getMe, getPartnerMembershipConfig, verifyPartnerContribution } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Award, BadgeCheck, Building2, Check, CheckCircle2, CreditCard, Headphones, Loader2, ShieldCheck, Sparkles, Users } from 'lucide-react';

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
    </div>
  );
}
