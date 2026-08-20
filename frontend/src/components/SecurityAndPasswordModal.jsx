import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api';
import toast from 'react-hot-toast';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function SecurityAndPasswordModal() {
  const { user, setUser } = useAuth();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.isFirstLogin === true) {
      setShowFirstLoginModal(true);
    }
  }, [user]);

  // Check if password was changed > 7 days ago
  const isWeeklyReminderDue = () => {
    if (!user || !user.lastPasswordChangedAt) return false;
    const daysSinceChange = (new Date() - new Date(user.lastPasswordChangedAt)) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 7;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setLoading(true);
      const res = await changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });

      toast.success('Password updated successfully!');
      if (res.data.user) {
        setUser({ ...user, ...res.data.user, isFirstLogin: false });
      }
      setShowFirstLoginModal(false);
      setShowChangeModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Weekly Data Security Banner */}
      {user && !showFirstLoginModal && isWeeklyReminderDue() && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 px-6 rounded-2xl mb-6 shadow-md border border-indigo-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                🔒 Weekly Data Security & Hygiene Notice
              </p>
              <p className="text-[11px] text-slate-300">
                Protect franchise records & student data. Regularly changing your password enforces strong cybersecurity.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChangeModal(true)}
            className="btn-primary text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl whitespace-nowrap shadow-sm"
          >
            Update Security Password
          </button>
        </div>
      )}

      {/* Mandatory 1st Login Modal */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-5 border border-slate-100">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">First Login Password Setup</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Welcome to the platform! For your security, please create a new password before accessing your dashboard.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-bold shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? 'Updating Password...' : 'Set Password & Access Portal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Password Change Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" /> Update Password
              </h3>
              <button onClick={() => setShowChangeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowChangeModal(false)} className="btn-secondary px-4 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary px-5 py-2 text-xs font-bold">
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
