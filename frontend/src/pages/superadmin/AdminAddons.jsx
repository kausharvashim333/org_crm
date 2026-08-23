import { useState, useEffect } from 'react';
import { getAdminAddons, createAddon, updateAddon, deleteAddon, getAddonPurchases, adminActivateAddon, adminDeactivateAddon } from '../../api';
import { getPartners } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, ShoppingBag, Users } from 'lucide-react';

export default function AdminAddons() {
  const [addons, setAddons] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('addons');
  const [showAdd, setShowAdd] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [editAddon, setEditAddon] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '', key: '', description: '', features: '',
    price: 0, monthlyPrice: 0, yearlyPrice: 0,
    billingCycle: 'free', icon: 'Package', isDefault: false, isActive: true,
  });
  const [activateData, setActivateData] = useState({ partnerId: '', addonId: '', billingCycle: 'free', pricePaid: 0, adminNote: '' });

  const load = () => {
    getAdminAddons().then(res => { setAddons(res.data.addons); setLoading(false); }).catch(() => setLoading(false));
    getAddonPurchases().then(res => setPurchases(res.data.purchases)).catch(() => {});
    getPartners().then(res => setPartners(res.data.partners)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
        price: Number(formData.price),
        monthlyPrice: Number(formData.monthlyPrice),
        yearlyPrice: Number(formData.yearlyPrice),
      };
      if (editAddon) { await updateAddon(editAddon._id, payload); showSuccess('Add-on updated'); }
      else { await createAddon(payload); showSuccess('Add-on created'); }
      setShowAdd(false); setEditAddon(null);
      setFormData({ name: '', key: '', description: '', features: '', price: 0, monthlyPrice: 0, yearlyPrice: 0, billingCycle: 'free', icon: 'Package', isDefault: false, isActive: true });
      load();
    } catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this add-on? All partner subscriptions will be removed.')) return;
    try { await deleteAddon(id); showSuccess('Add-on deleted'); load(); }
    catch (error) { showError('Failed'); }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    try {
      await adminActivateAddon({
        ...activateData,
        pricePaid: Number(activateData.pricePaid),
      });
      showSuccess('Add-on activated for partner');
      setShowActivate(false);
      setActivateData({ partnerId: '', addonId: '', billingCycle: 'free', pricePaid: 0, adminNote: '' });
      load();
    } catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this add-on subscription?')) return;
    try { await adminDeactivateAddon(id); showSuccess('Add-on deactivated'); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add-on Manager</h1>
          <p className="text-gray-500">Create and manage feature add-ons for partners</p>
        </div>
        <button onClick={() => { setEditAddon(null); setFormData({ name: '', key: '', description: '', features: '', price: 0, monthlyPrice: 0, yearlyPrice: 0, billingCycle: 'free', icon: 'Package', isDefault: false, isActive: true }); setShowAdd(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add New</button>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('addons')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'addons' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Package className="w-4 h-4 inline mr-1" /> Add-ons ({addons.length})
        </button>
        <button onClick={() => setTab('purchases')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'purchases' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <ShoppingBag className="w-4 h-4 inline mr-1" /> Purchases ({purchases.length})
        </button>
        <button onClick={() => setShowActivate(true)} className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
          <Users className="w-4 h-4 inline mr-1" /> Manual Activate
        </button>
      </div>

      {tab === 'addons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : addons.map(a => (
            <div key={a._id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Package className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{a.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{a.key}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditAddon(a); setFormData({ name: a.name, key: a.key, description: a.description, features: a.features.join(', '), price: a.price, monthlyPrice: a.monthlyPrice, yearlyPrice: a.yearlyPrice, billingCycle: a.billingCycle, icon: a.icon, isDefault: a.isDefault, isActive: a.isActive }); setShowAdd(true); }} className="text-primary-600 hover:text-primary-800"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500">{a.description}</p>
              {a.features.length > 0 && (
                <div className="flex flex-wrap gap-1">{a.features.map((f, i) => <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{f}</span>)}</div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs">
                  {a.billingCycle === 'free' ? <span className="text-emerald-600 font-bold">FREE</span> :
                    a.billingCycle === 'monthly' ? <span className="text-indigo-600 font-bold">₹{a.monthlyPrice}/mo</span> :
                    a.billingCycle === 'yearly' ? <span className="text-indigo-600 font-bold">₹{a.yearlyPrice}/yr</span> :
                    <span className="text-indigo-600 font-bold">₹{a.price} one-time</span>}
                </div>
                <div className="flex gap-2">
                  {a.isDefault && <span className="badge badge-info text-[10px]">Default</span>}
                  {a.isActive ? <span className="badge badge-success text-[10px]">Active</span> : <span className="badge badge-warning text-[10px]">Inactive</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'purchases' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Partner</th>
                <th className="px-4 py-3 text-left">Add-on</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Billing</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Activated</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map(p => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div><p className="font-medium">{p.partnerId?.instituteName || 'N/A'}</p><p className="text-xs text-gray-400">{p.partnerId?.franchiseId}</p></div></td>
                  <td className="px-4 py-3">{p.addonName || p.addonId?.name}</td>
                  <td className="px-4 py-3"><span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 capitalize">{p.billingCycle}</td>
                  <td className="px-4 py-3">₹{p.pricePaid}</td>
                  <td className="px-4 py-3 text-xs">{p.activatedAt ? new Date(p.activatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-xs">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Lifetime'}</td>
                  <td className="px-4 py-3">{p.status === 'active' && <button onClick={() => handleDeactivate(p._id)} className="text-red-600 hover:text-red-800 text-xs"><XCircle className="w-4 h-4" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && <div className="text-center py-8 text-gray-400">No purchases yet</div>}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditAddon(null); }} title={editAddon ? 'Edit Add-on' : 'Create Add-on'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Exam & Test System" /></div>
            <div><label className="block text-sm font-medium mb-1">Key *</label><input type="text" required value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="input-field" placeholder="exam_system" disabled={!!editAddon} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={2} placeholder="Create online exams with MCQ, True/False, subjective questions..." /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Features (comma separated)</label><input type="text" value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} className="input-field" placeholder="Question Bank, Anti-Cheat, Auto-Grading, Analytics" /></div>
            <div><label className="block text-sm font-medium mb-1">Billing Cycle</label><select value={formData.billingCycle} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })} className="input-field"><option value="free">Free</option><option value="one_time">One-Time</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Icon (lucide name)</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="input-field" placeholder="Package" /></div>
            {formData.billingCycle === 'one_time' && <div><label className="block text-sm font-medium mb-1">One-Time Price (₹)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" /></div>}
            {formData.billingCycle === 'monthly' && <div><label className="block text-sm font-medium mb-1">Monthly Price (₹)</label><input type="number" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} className="input-field" /></div>}
            {formData.billingCycle === 'yearly' && <div><label className="block text-sm font-medium mb-1">Yearly Price (₹)</label><input type="number" value={formData.yearlyPrice} onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })} className="input-field" /></div>}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="rounded" /> Default (included for all partners)</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded" /> Available for purchase</label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">{editAddon ? 'Update' : 'Create Add-on'}</button>
        </form>
      </Modal>

      <Modal isOpen={showActivate} onClose={() => setShowActivate(false)} title="Manual Activate Add-on" size="md">
        <form onSubmit={handleActivate} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Partner *</label><select required value={activateData.partnerId} onChange={(e) => setActivateData({ ...activateData, partnerId: e.target.value })} className="input-field"><option value="">Select partner...</option>{partners.map(p => <option key={p._id} value={p._id}>{p.instituteName} ({p.franchiseId})</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Add-on *</label><select required value={activateData.addonId} onChange={(e) => setActivateData({ ...activateData, addonId: e.target.value })} className="input-field"><option value="">Select add-on...</option>{addons.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Billing Cycle</label><select value={activateData.billingCycle} onChange={(e) => setActivateData({ ...activateData, billingCycle: e.target.value })} className="input-field"><option value="free">Free</option><option value="one_time">One-Time</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Price Paid (₹)</label><input type="number" value={activateData.pricePaid} onChange={(e) => setActivateData({ ...activateData, pricePaid: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1">Admin Note</label><input type="text" value={activateData.adminNote} onChange={(e) => setActivateData({ ...activateData, adminNote: e.target.value })} className="input-field" placeholder="Payment received via bank transfer..." /></div>
          <button type="submit" className="btn-primary w-full">Activate Add-on</button>
        </form>
      </Modal>
    </div>
  );
}
