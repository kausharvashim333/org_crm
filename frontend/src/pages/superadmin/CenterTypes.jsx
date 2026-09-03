import { useState, useEffect } from 'react';
import { getAllCenterTypes, createCenterType, updateCenterType, deleteCenterType } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Plus, Edit, Trash2, Building2, ArrowUp, ArrowDown } from 'lucide-react';

export default function CenterTypes() {
  const [centerTypes, setCenterTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCT, setEditCT] = useState(null);
  const [ctForm, setCtForm] = useState({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 });
  const { showSuccess, showError } = useToast();

  const load = () => {
    setLoading(true);
    getAllCenterTypes()
      .then(res => setCenterTypes(res.data.centerTypes || []))
      .catch(() => showError('Failed to load center types'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleOpenAdd = () => {
    setEditCT(null);
    setCtForm({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 });
    setShowModal(true);
  };

  const handleEdit = (ct) => {
    setEditCT(ct);
    setCtForm({ name: ct.name, description: ct.description || '', icon: ct.icon || 'Building2', color: ct.color || '#2563eb', order: ct.order || 0 });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCT) {
        await updateCenterType(editCT._id, ctForm);
        showSuccess('Center type updated');
      } else {
        await createCenterType(ctForm);
        showSuccess('Center type created');
      }
      setShowModal(false);
      setEditCT(null);
      setCtForm({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 });
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save center type');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this center type? Courses using it will keep their text value.')) return;
    try {
      await deleteCenterType(id);
      showSuccess('Center type deleted');
      load();
    } catch {
      showError('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Center Types</h1>
          <p className="text-gray-500">Manage training center verticals — create, edit, delete, and reorder</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Add Center Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Center Types</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{centerTypes.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{centerTypes.filter(ct => ct.isActive).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-black text-red-500 mt-1">{centerTypes.filter(ct => !ct.isActive).length}</p>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading center types...</div>
        ) : centerTypes.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No center types yet. Create one to get started.</p>
            <button onClick={handleOpenAdd} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Center Type
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {centerTypes.map((ct, idx) => (
              <div key={ct._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: ct.color || '#2563eb' }}>
                    {ct.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{ct.name}</p>
                      {!ct.isActive && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">INACTIVE</span>}
                    </div>
                    {ct.description && <p className="text-xs text-slate-500 mt-0.5">{ct.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400">Order: {ct.order}</span>
                      <span className="text-[10px] text-slate-400">Icon: {ct.icon}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(ct)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(ct._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditCT(null); }} title={editCT ? 'Edit Center Type' : 'Add New Center Type'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Center Type Name *</label>
              <input type="text" required value={ctForm.name} onChange={(e) => setCtForm({ ...ctForm, name: e.target.value })} className="input-field" placeholder="e.g. Computer & IT Training, Paramedical Training" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input type="text" value={ctForm.description} onChange={(e) => setCtForm({ ...ctForm, description: e.target.value })} className="input-field" placeholder="Short description (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon Name</label>
              <input type="text" value={ctForm.icon} onChange={(e) => setCtForm({ ...ctForm, icon: e.target.value })} className="input-field" placeholder="Building2, Monitor, Heart..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input type="color" value={ctForm.color} onChange={(e) => setCtForm({ ...ctForm, color: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input type="number" value={ctForm.order} onChange={(e) => setCtForm({ ...ctForm, order: +e.target.value })} className="input-field" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" checked={ctForm.isActive !== false} onChange={(e) => setCtForm({ ...ctForm, isActive: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                Active
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditCT(null); }} className="btn-secondary flex-1 py-2.5 text-sm font-bold">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm font-bold">
              {editCT ? 'Update Center Type' : 'Create Center Type'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
