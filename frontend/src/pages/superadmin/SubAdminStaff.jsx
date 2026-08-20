import { useState, useEffect } from 'react';
import { getStaffUsers, createStaffUser, getRoles } from '../../api';
import toast from 'react-hot-toast';
import { UserCheck, UserPlus, Shield, Mail, Phone, Lock, Search } from 'lucide-react';

export default function SubAdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    roleName: 'Super Admin',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStaff, resRoles] = await Promise.all([getStaffUsers(), getRoles()]);
      setStaffList(resStaff.data.staffUsers || []);
      setRoles(resRoles.data.roles || []);
      if (resRoles.data.roles && resRoles.data.roles.length > 0) {
        setFormData(prev => ({
          ...prev,
          roleId: resRoles.data.roles[0]._id,
          roleName: resRoles.data.roles[0].name,
        }));
      }
    } catch (err) {
      toast.error('Failed to load staff users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createStaffUser(formData);
      toast.success('Sub-Admin user created successfully');
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        roleId: roles[0]?._id || '',
        roleName: roles[0]?.name || 'Super Admin',
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-primary-600" />
            Sub-Admin & Staff Delegation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage internal administrative users and assign delegated permissions.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5">
          <UserPlus className="w-4 h-4" /> Add Sub-Admin Staff
        </button>
      </div>

      {/* Filter & Table */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-9"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">Total Staff: {filteredStaff.length}</span>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading staff...</td></tr>
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">No admin staff found</td></tr>
              ) : (
                filteredStaff.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </div>
                      {user.name}
                    </td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.phone || '-'}</td>
                    <td className="p-4">
                      <span className="badge badge-info uppercase text-[10px] tracking-wider font-bold">
                        🛡️ {user.roleId?.name || user.assignedRoleName || 'Super Admin'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="badge badge-success">Active</span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <UserPlus className="w-5 h-5 text-primary-600" /> Create Sub-Admin User
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin.staff@skillindia.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assign Permission Role *</label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selRole = roles.find(r => r._id === selId);
                    setFormData({
                      ...formData,
                      roleId: selId,
                      roleName: selRole?.name || 'Super Admin',
                    });
                  }}
                  className="input-field font-semibold text-indigo-950"
                >
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>
                      🛡️ {r.name} {r.description ? `(${r.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-bold">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
