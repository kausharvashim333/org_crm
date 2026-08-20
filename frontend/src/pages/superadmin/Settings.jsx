import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateProfile } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleProfile = async (e) => {
    e.preventDefault();
    try { const res = await updateProfile({ name, phone }); setUser({ ...user, name, phone }); showSuccess('Profile updated'); }
    catch (error) { showError('Failed'); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try { await changePassword({ currentPassword, newPassword }); showSuccess('Password changed'); setCurrentPassword(''); setNewPassword(''); }
    catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Settings</h1><p className="text-gray-500">Manage your account</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Profile</h3>
          <form onSubmit={handleProfile} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Email (read-only)</label><input type="email" disabled value={user?.email} className="input-field bg-gray-100" /></div>
            <button type="submit" className="btn-primary">Update Profile</button>
          </form>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePassword} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Current Password</label><input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">New Password</label><input type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" /></div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
