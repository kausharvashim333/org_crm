import { useState, useEffect } from 'react';
import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Table, TableRow, TableCell } from '../../components/Table';
import Modal from '../../components/Modal';
import {
  Tag, Plus, Trash2, Check, X, Percent, IndianRupee, Sparkles,
  Clock, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 500,
    maxDiscountAmount: 1000,
    usageLimit: 1000,
    validUntil: '',
  });

  const fetchCoupons = () => {
    setLoading(true);
    getAdminCoupons()
      .then((res) => {
        setCoupons(res.data.coupons || []);
        setLoading(false);
      })
      .catch((err) => {
        showError('Failed to load coupons');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return showError('Coupon code is required');

    try {
      await createAdminCoupon(formData);
      showSuccess(`Coupon ${formData.code.toUpperCase()} created successfully!`);
      setShowAddModal(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 500,
        maxDiscountAmount: 1000,
        usageLimit: 1000,
        validUntil: '',
      });
      fetchCoupons();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await updateAdminCoupon(coupon._id, { isActive: !coupon.isActive });
      showSuccess(`Coupon status updated`);
      fetchCoupons();
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteAdminCoupon(id);
      showSuccess('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      showError('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-7 h-7 text-indigo-600" /> Promotional Coupons & Discounts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create discount codes to boost course sales and seasonal marketing campaigns.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Tag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No coupons active</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Code & Description', 'Discount Type', 'Value', 'Min Order / Cap', 'Usage', 'Status', 'Actions']}>
              {coupons.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="font-mono font-black text-sm text-indigo-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-600" /> {c.code}
                    </div>
                    <div className="text-[11px] text-slate-500">{c.description || 'Special Promotion'}</div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs font-semibold text-slate-700">{c.discountType}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-black text-sm text-emerald-600">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">Min: ₹{c.minOrderAmount || 0}</div>
                    {c.maxDiscountAmount && <div className="text-[10px] text-slate-400">Cap: ₹{c.maxDiscountAmount}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-slate-800">{c.usedCount || 0} / {c.usageLimit || '∞'}</div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Create New Promo Coupon"
        >
          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Coupon Code (Uppercase) *</label>
              <input
                type="text"
                required
                placeholder="e.g. DIWALI50, FESTIVE2026"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full uppercase font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Special 50% discount for skill students"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Value *</label>
                <input
                  type="number"
                  required
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valid Until (Date)</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
