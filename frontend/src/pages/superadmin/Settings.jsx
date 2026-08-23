import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateProfile, getOrgHomepage, updateOrgHomepage, uploadOrgLogo, uploadOrgFavicon } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Building2, Palette, Globe, Lock, User, Save, Upload, Check } from 'lucide-react';

export default function AdminSettings() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [orgData, setOrgData] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ orgName: '', shortName: '', tagline: '', browserTitle: '', themeColor: '#2563eb', fontChoice: 'inter' });
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    getOrgHomepage().then(res => {
      setOrgData(res.data);
      const s = res.data.settings || {};
      setOrgForm({
        orgName: s.orgName || '',
        shortName: s.shortName || '',
        tagline: s.tagline || '',
        browserTitle: s.browserTitle || '',
        themeColor: s.themeColor || '#2563eb',
        fontChoice: s.fontChoice || 'inter',
      });
      setOrgLoading(false);
    }).catch(() => setOrgLoading(false));
  }, []);

  const handleProfile = async (e) => {
    e.preventDefault();
    try { await updateProfile({ name, phone }); setUser({ ...user, name, phone }); showSuccess('Profile updated'); }
    catch (error) { showError('Failed'); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try { await changePassword({ currentPassword, newPassword }); showSuccess('Password changed'); setCurrentPassword(''); setNewPassword(''); }
    catch (error) { showError(error.response?.data?.message || 'Failed'); }
  };

  const handleOrgSave = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await updateOrgHomepage({ settings: orgForm });
      showSuccess('Organization branding updated successfully');
    } catch (error) {
      showError('Failed to update organization settings');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await uploadOrgLogo(fd);
      showSuccess('Logo uploaded successfully');
      setLogoFile(null);
      const res = await getOrgHomepage();
      setOrgData(res.data);
    } catch (error) {
      showError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e) => {
    e.preventDefault();
    if (!faviconFile) return;
    setUploadingFavicon(true);
    try {
      const fd = new FormData();
      fd.append('favicon', faviconFile);
      await uploadOrgFavicon(fd);
      showSuccess('Favicon uploaded successfully');
      setFaviconFile(null);
      const res = await getOrgHomepage();
      setOrgData(res.data);
    } catch (error) {
      showError('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Settings</h1><p className="text-gray-500">Manage account & organization branding</p></div>

      {/* Organization Branding & Configuration */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="font-semibold text-gray-800">Organization Branding & Configuration</h3><p className="text-xs text-gray-500">Customize your organization identity, logo, and theme</p></div>
        </div>

        {orgLoading ? <div className="text-center py-6 text-gray-400">Loading organization settings...</div> : (
          <div className="space-y-6">
            {/* Logo & Favicon Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Organization Logo</label>
                <div className="flex items-center gap-3">
                  {orgData?.settings?.logo ? <img src={orgData.settings.logo} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-slate-200" /> : <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400"><Building2 className="w-6 h-6" /></div>}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="text-xs mb-2 block w-full" />
                    <button onClick={handleLogoUpload} disabled={!logoFile || uploadingLogo} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                      <Upload className="w-3.5 h-3.5" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Favicon</label>
                <div className="flex items-center gap-3">
                  {orgData?.settings?.favicon ? <img src={orgData.settings.favicon} alt="Favicon" className="w-10 h-10 rounded-lg object-cover border border-slate-200" /> : <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400"><Globe className="w-5 h-5" /></div>}
                  <div className="flex-1">
                    <input type="file" accept="image/x-icon,image/png" onChange={(e) => setFaviconFile(e.target.files[0])} className="text-xs mb-2 block w-full" />
                    <button onClick={handleFaviconUpload} disabled={!faviconFile || uploadingFavicon} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                      <Upload className="w-3.5 h-3.5" /> {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Branding Form */}
            <form onSubmit={handleOrgSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name</label>
                  <input type="text" value={orgForm.orgName} onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })} className="input-field" placeholder="e.g. Skill India" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Short Name (for navbar)</label>
                  <input type="text" value={orgForm.shortName} onChange={(e) => setOrgForm({ ...orgForm, shortName: e.target.value })} className="input-field" placeholder="e.g. SkillIndia" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <input type="text" value={orgForm.tagline} onChange={(e) => setOrgForm({ ...orgForm, tagline: e.target.value })} className="input-field" placeholder="e.g. ISO 9001:2015 Certified Educational Network" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Browser Title (SEO)</label>
                  <input type="text" value={orgForm.browserTitle} onChange={(e) => setOrgForm({ ...orgForm, browserTitle: e.target.value })} className="input-field" placeholder="e.g. Skill India - Training Institute" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Choice</label>
                  <select value={orgForm.fontChoice} onChange={(e) => setOrgForm({ ...orgForm, fontChoice: e.target.value })} className="input-field">
                    <option value="inter">Inter (Default)</option>
                    <option value="poppins">Poppins</option>
                    <option value="roboto">Roboto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={orgForm.themeColor} onChange={(e) => setOrgForm({ ...orgForm, themeColor: e.target.value })} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <input type="text" value={orgForm.themeColor} onChange={(e) => setOrgForm({ ...orgForm, themeColor: e.target.value })} className="input-field flex-1" placeholder="#2563eb" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={savingOrg} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {savingOrg ? <><Check className="w-4 h-4" /> Saving...</> : <><Save className="w-4 h-4" /> Save Branding Settings</>}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Account Profile & Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>
            <h3 className="font-semibold text-gray-800">Admin Profile</h3>
          </div>
          <form onSubmit={handleProfile} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Email (read-only)</label><input type="email" disabled value={user?.email} className="input-field bg-gray-100" /></div>
            <button type="submit" className="btn-primary">Update Profile</button>
          </form>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Lock className="w-4 h-4 text-red-600" /></div>
            <h3 className="font-semibold text-gray-800">Change Password</h3>
          </div>
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
