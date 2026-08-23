import { useState, useEffect } from 'react';
import { getAddons, getMyAddons, purchaseAddonOrder, verifyAddonPayment } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Package, CheckCircle, Loader2, Sparkles, Calendar, IndianRupee, BadgeCheck } from 'lucide-react';

export default function PartnerAddons() {
  const [addons, setAddons] = useState([]);
  const [myAddons, setMyAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [billingCycle, setBillingCycle] = useState('one_time');
  const [showCheckout, setShowCheckout] = useState(null);
  const { showSuccess, showError } = useToast();

  const load = () => {
    getAddons().then(res => { setAddons(res.data.addons); setLoading(false); }).catch(() => setLoading(false));
    getMyAddons().then(res => setMyAddons(res.data.addons)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const myAddonKeys = myAddons.map(a => a.addonKey);

  const handlePurchase = async (addon) => {
    if (addon.billingCycle === 'free' || addon.price === 0 && addon.monthlyPrice === 0 && addon.yearlyPrice === 0) {
      try {
        setPurchasing(addon._id);
        const res = await purchaseAddonOrder({ addonId: addon._id, billingCycle: 'free' });
        if (res.data.free) { showSuccess(`${addon.name} activated successfully!`); load(); }
      } catch (error) { showError(error.response?.data?.message || 'Failed'); }
      finally { setPurchasing(null); }
    } else {
      setBillingCycle(addon.billingCycle);
      setShowCheckout(addon);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      setPurchasing(showCheckout._id);
      const orderRes = await purchaseAddonOrder({ addonId: showCheckout._id, billingCycle });
      if (orderRes.data.free) {
        showSuccess('Add-on activated!'); setShowCheckout(null); load(); return;
      }
      const { razorpayOrderId, razorpayKeyId, amount, partnerAddonId } = orderRes.data;

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Add-on Purchase',
        description: showCheckout.name,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await verifyAddonPayment({
              partnerAddonId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showSuccess(`${showCheckout.name} purchased and activated!`);
            setShowCheckout(null); load();
          } catch (err) {
            showError('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: function() { showError('Payment cancelled'); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        showError(resp.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (error) { showError(error.response?.data?.message || 'Failed to initiate payment'); }
    finally { setPurchasing(null); }
  };

  const getPriceDisplay = (addon) => {
    if (addon.billingCycle === 'free') return 'FREE';
    if (addon.billingCycle === 'monthly') return `₹${addon.monthlyPrice}/mo`;
    if (addon.billingCycle === 'yearly') return `₹${addon.yearlyPrice}/yr`;
    return `₹${addon.price}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Add-on Store</h1>
        <p className="text-gray-500">Purchase premium features to enhance your portal</p>
      </div>

      {/* My Active Add-ons */}
      {myAddons.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /> Your Active Add-ons ({myAddons.length})</h2>
          <div className="flex flex-wrap gap-2">
            {myAddons.map(a => (
              <span key={a._id} className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> {a.addonName || a.addonId?.name}
                {a.expiresAt && <span className="text-[10px] text-emerald-500">· expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="text-center py-8 text-gray-400 col-span-full">Loading...</div> : addons.map(a => {
          const owned = myAddonKeys.includes(a.key) || a.isDefault;
          return (
            <div key={a._id} className={`card p-5 space-y-3 relative ${owned ? 'ring-2 ring-emerald-200' : ''}`}>
              {owned && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{a.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{a.description}</p>
              </div>
              {a.features?.length > 0 && (
                <div className="space-y-1">
                  {a.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> {f}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <span className="text-lg font-bold text-indigo-600">{getPriceDisplay(a)}</span>
                  {a.billingCycle === 'one_time' && <span className="text-xs text-gray-400 ml-1">one-time</span>}
                </div>
                {owned ? (
                  <span className="text-xs text-emerald-600 font-medium">Included</span>
                ) : (
                  <button
                    onClick={() => handlePurchase(a)}
                    disabled={purchasing === a._id}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    {purchasing === a._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {a.billingCycle === 'free' ? 'Activate Free' : 'Purchase'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!loading && addons.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No add-ons available yet</p>
            <p className="text-xs mt-1">Check back later for new features</p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <Modal isOpen={true} onClose={() => setShowCheckout(null)} title={`Purchase: ${showCheckout.name}`} size="md">
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-600">{showCheckout.description}</p>
              {showCheckout.features?.length > 0 && (
                <div className="space-y-1">{showCheckout.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {f}</div>
                ))}</div>
              )}
            </div>
            {showCheckout.billingCycle !== 'one_time' && showCheckout.billingCycle !== 'free' && (
              <div>
                <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  {showCheckout.monthlyPrice > 0 && (
                    <button type="button" onClick={() => setBillingCycle('monthly')} className={`p-3 rounded-xl border text-left transition-all ${billingCycle === 'monthly' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-600" /><span className="text-sm font-medium">Monthly</span></div>
                      <p className="text-lg font-bold text-indigo-600 mt-1">₹{showCheckout.monthlyPrice}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                    </button>
                  )}
                  {showCheckout.yearlyPrice > 0 && (
                    <button type="button" onClick={() => setBillingCycle('yearly')} className={`p-3 rounded-xl border text-left transition-all ${billingCycle === 'yearly' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-indigo-600" /><span className="text-sm font-medium">Yearly</span></div>
                      <p className="text-lg font-bold text-indigo-600 mt-1">₹{showCheckout.yearlyPrice}<span className="text-xs font-normal text-gray-400">/yr</span></p>
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-indigo-600">
                ₹{billingCycle === 'monthly' ? showCheckout.monthlyPrice : billingCycle === 'yearly' ? showCheckout.yearlyPrice : showCheckout.price}
              </span>
            </div>
            <button onClick={handleRazorpayPayment} disabled={purchasing === showCheckout._id} className="btn-primary w-full flex items-center justify-center gap-2">
              {purchasing === showCheckout._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
              Pay & Activate
            </button>
            <p className="text-xs text-gray-400 text-center">Secure payment via Razorpay. Add-on will be activated instantly after payment.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
