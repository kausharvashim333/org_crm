import { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '../../api';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Trash2, Edit3, CheckCircle2, Lock, Save, RefreshCw } from 'lucide-react';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard & Analytics', actions: ['view'] },
  { key: 'partners', label: 'Partner Centers', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'students', label: 'Student Desk', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'courses', label: 'Course Catalog', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'certificates', label: 'Certificate Approvals', actions: ['view', 'approve', 'delete'] },
  { key: 'royalty', label: 'Royalty & Finance', actions: ['view', 'generate', 'pay'] },
  { key: 'website', label: 'Website CMS', actions: ['view', 'edit'] },
  { key: 'inquiries', label: 'Lead Enquiries', actions: ['view', 'edit', 'delete'] },
  { key: 'projects', label: 'Skill Projects', actions: ['view', 'create', 'assign', 'approve'] },
  { key: 'settings', label: 'System Settings', actions: ['view', 'edit'] },
  { key: 'security', label: 'Security & Backup', actions: ['view', 'export'] },
];

export default function RolesAndPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {},
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await getRoles();
      setRoles(res.data.roles);
      if (res.data.roles.length > 0) {
        selectRole(res.data.roles[0]);
      }
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setIsNew(false);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || {},
    });
  };

  const startNewRole = () => {
    setSelectedRole(null);
    setIsNew(true);
    const initialPermissions = {};
    MODULES.forEach(m => {
      initialPermissions[m.key] = {};
      m.actions.forEach(act => {
        initialPermissions[m.key][act] = false;
      });
    });
    setFormData({
      name: '',
      description: '',
      permissions: initialPermissions,
    });
  };

  const togglePermission = (modKey, act) => {
    if (selectedRole?.isSystem && selectedRole.name === 'Super Admin') return;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [modKey]: {
          ...(prev.permissions[modKey] || {}),
          [act]: !prev.permissions[modKey]?.[act],
        },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Role name is required');
    try {
      if (isNew) {
        await createRole(formData);
        toast.success('Role created successfully');
      } else {
        await updateRole(selectedRole._id, formData);
        toast.success('Role updated successfully');
      }
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteRole(roleId);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary-600" />
            Roles & Permission Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure access control policies and specify granular permissions per module.
          </p>
        </div>
        <button onClick={startNewRole} className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5">
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b">
            <span className="font-semibold text-slate-800 text-sm">System Roles</span>
            <button onClick={fetchRoles} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading roles...</div>
          ) : (
            <div className="space-y-1.5">
              {roles.map(r => {
                const active = selectedRole?._id === r._id && !isNew;
                return (
                  <div
                    key={r._id}
                    onClick={() => selectRole(r)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                      active
                        ? 'bg-primary-50 border-primary-300 text-primary-900 font-semibold'
                        : 'border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm">{r.name}</p>
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-[150px]">
                        {r.description || 'No description'}
                      </p>
                    </div>
                    {r.isSystem ? (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Matrix & Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl border shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  disabled={selectedRole?.isSystem}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Accounts Manager, Content Officer"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  disabled={selectedRole?.isSystem}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short role explanation"
                  className="input-field"
                />
              </div>
            </div>

            {/* Matrix Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Module Permission Settings</h3>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 border-b text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 font-bold">Module Name</th>
                      <th className="p-3.5 text-center font-bold">View</th>
                      <th className="p-3.5 text-center font-bold">Create / Add</th>
                      <th className="p-3.5 text-center font-bold">Edit / Update</th>
                      <th className="p-3.5 text-center font-bold">Delete</th>
                      <th className="p-3.5 text-center font-bold">Approve / Special</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MODULES.map(m => {
                      const modPerms = formData.permissions[m.key] || {};
                      return (
                        <tr key={m.key} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-medium text-slate-800">{m.label}</td>
                          {['view', 'create', 'edit', 'delete', 'approve'].map(act => {
                            const supported = m.actions.includes(act) || (act === 'approve' && (m.actions.includes('generate') || m.actions.includes('assign') || m.actions.includes('export')));
                            const actualAct = m.actions.includes(act) ? act : m.actions.find(a => ['generate', 'assign', 'export', 'pay'].includes(a)) || act;
                            const isChecked = !!modPerms[actualAct];
                            
                            return (
                              <td key={act} className="p-3.5 text-center">
                                {supported ? (
                                  <input
                                    type="checkbox"
                                    disabled={selectedRole?.isSystem && selectedRole.name === 'Super Admin'}
                                    checked={isChecked}
                                    onChange={() => togglePermission(m.key, actualAct)}
                                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={selectedRole?.isSystem && selectedRole.name === 'Super Admin'}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                <Save className="w-4 h-4" /> Save Role & Permissions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
