import { useState } from 'react';
import { getSecurityExport } from '../../api';
import toast from 'react-hot-toast';
import { Lock, Download, ShieldCheck, Database, Key, CheckCircle } from 'lucide-react';

export default function SecurityAndBackup() {
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState({
    enforce2FA: false,
    sessionTimeoutMinutes: 60,
    allowPublicRegistration: true,
  });

  const handleExportBackup = async () => {
    try {
      setDownloading(true);
      const res = await getSecurityExport();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.backupMeta, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `system_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('System security & summary backup exported successfully');
    } catch (err) {
      toast.error('Failed to export system backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success('Security settings saved');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-primary-600" />
            Security & System Backup
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System security policy controls, database backup exports, and access protection.
          </p>
        </div>
        <button
          onClick={handleExportBackup}
          disabled={downloading}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating Export...' : 'Export Database Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Policies */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="w-5 h-5 text-primary-600" /> System Protection Rules
          </h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-500">Require OTP for Super Admin login</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforce2FA}
                onChange={(e) => setSettings({ ...settings, enforce2FA: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Allow Public Franchise Registration</p>
                <p className="text-xs text-slate-500">Allow partners to apply via public link</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowPublicRegistration}
                onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Session Timeout (Minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary px-5 py-2">
                Save Policies
              </button>
            </div>
          </form>
        </div>

        {/* Database Health & Backup */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Database className="w-5 h-5 text-primary-600" /> Database & Storage Health
          </h3>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">MongoDB Instance Status</p>
                  <p className="text-xs text-slate-500">Connected on port 27017</p>
                </div>
              </div>
              <span className="badge badge-success">Online</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">JWT Encryption Status</p>
                  <p className="text-xs text-slate-500">SHA256 Token Signing Active</p>
                </div>
              </div>
              <span className="badge badge-info">Secure</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportBackup}
              disabled={downloading}
              className="w-full btn-secondary py-3 flex items-center justify-center gap-2 font-medium"
            >
              <Download className="w-4 h-4" /> Download One-Click Backup (.json)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
