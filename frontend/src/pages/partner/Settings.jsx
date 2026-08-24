import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changePassword, updateProfile, updatePartner, uploadPartnerLogo, uploadPartnerPaymentQr } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Building2, Upload, User, Lock, Globe, Camera, Check, QrCode, CreditCard } from 'lucide-react';

export default function PartnerSettings() {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Logo upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(user?.partner?.logo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [partnerData, setPartnerData] = useState({
    tagline: user?.partner?.tagline || '',
    description: user?.partner?.description || '',
    establishedYear: user?.partner?.establishedYear || '',
    socialLinks: user?.partner?.socialLinks || { facebook: '', instagram: '', youtube: '', whatsapp: '' },
    upiId: user?.partner?.upiId || '',
  });

  // Payment QR upload state
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(user?.partner?.paymentQrImage || '');
  const [uploadingQr, setUploadingQr] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone });
      setUser({ ...user, name, phone });
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to update profile');
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword });
      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleInstitute = async (e) => {
    e.preventDefault();
    try {
      await updatePartner(user.partnerId, partnerData);
      showSuccess('Institute details updated successfully!');
    } catch (error) {
      showError('Failed to update institute details');
    }
  };

  const handleQrChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleQrUpload = async (e) => {
    e.preventDefault();
    if (!qrFile) return showError('Kripya QR image select karein');
    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('paymentQr', qrFile);
      const res = await uploadPartnerPaymentQr(user.partnerId, formData);
      showSuccess('Payment QR Uploaded Successfully!');
      setQrPreview(res.data.paymentQrImage);
      if (user.partner) {
        setUser({ ...user, partner: { ...user.partner, paymentQrImage: res.data.paymentQrImage } });
      }
      setQrFile(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload payment QR');
    } finally {
      setUploadingQr(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) return showError('Kripya naya logo image select karein');
    
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const res = await uploadPartnerLogo(user.partnerId, formData);
      
      const newLogoPath = res.data.logo;
      showSuccess('Institute Logo Uploaded Successfully!');
      setLogoPreview(newLogoPath);
      
      // Update global Auth user state with new logo
      if (user.partner) {
        setUser({
          ...user,
          partner: {
            ...user.partner,
            logo: newLogoPath
          }
        });
      }
      setLogoFile(null);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload institute logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Institute Settings</h1>
        <p className="text-sm text-slate-500">Manage your institute profile, logo, password & website details</p>
      </div>

      {/* Top Grid: Logo Upload & My Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Institute Logo Upload Card */}
        <div className="card p-6 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Institute Logo Upload</h3>
          </div>

          <form onSubmit={handleLogoUpload} className="space-y-4 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-indigo-300 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                {logoPreview ? (
                  <img src={logoPreview} alt="Institute Logo" className="w-full h-full object-contain rounded-xl" onError={(e) => { const img = e.target; if (!img.dataset.retried && logoPreview.includes('/uploads/')) { img.dataset.retried = 'true'; const path = logoPreview.substring(logoPreview.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                ) : (
                  <div className="text-slate-400 p-2">
                    <Building2 className="w-12 h-12 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] block">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all hover:scale-110">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-xs text-slate-500 max-w-xs">
              Upload PNG/JPG logo (recommended resolution: 300x300px, max 5MB). Yeh logo aapki public website aur student login page par show hoga.
            </p>

            {logoFile && (
              <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                Selected: {logoFile.name}
              </div>
            )}

            <button
              type="submit"
              disabled={uploadingLogo || !logoFile}
              className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {uploadingLogo ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading Logo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Save & Update Logo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Profile Details Card */}
        <div className="card p-6 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Account Administrator</h3>
          </div>

          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Read Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-field text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <button type="submit" className="btn-primary py-2.5 px-6 text-xs font-bold">
              Update Admin Profile
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Grid: Change Password & Institute Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Change Password Card */}
        <div className="card p-6 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Change Password</h3>
          </div>

          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <button type="submit" className="btn-primary py-2.5 px-6 text-xs font-bold">
              Change Password
            </button>
          </form>
        </div>

        {/* Public Institute Profile Details */}
        <div className="lg:col-span-2 card p-6 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Public Center Profile & Bio</h3>
          </div>

          <form onSubmit={handleInstitute} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institute Name (Read Only)</label>
                <input
                  type="text"
                  disabled
                  value={user?.partner?.instituteName || ''}
                  className="input-field text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Established Year</label>
                <input
                  type="number"
                  value={partnerData.establishedYear}
                  onChange={(e) => setPartnerData({ ...partnerData, establishedYear: +e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. 2015"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={partnerData.tagline}
                  onChange={(e) => setPartnerData({ ...partnerData, tagline: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Empowering digital skills for a bright future"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={partnerData.socialLinks.facebook}
                  onChange={(e) => setPartnerData({ ...partnerData, socialLinks: { ...partnerData.socialLinks, facebook: e.target.value } })}
                  className="input-field text-sm"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={partnerData.socialLinks.instagram}
                  onChange={(e) => setPartnerData({ ...partnerData, socialLinks: { ...partnerData.socialLinks, instagram: e.target.value } })}
                  className="input-field text-sm"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Channel</label>
                <input
                  type="text"
                  value={partnerData.socialLinks.youtube}
                  onChange={(e) => setPartnerData({ ...partnerData, socialLinks: { ...partnerData.socialLinks, youtube: e.target.value } })}
                  className="input-field text-sm"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Contact</label>
                <input
                  type="text"
                  value={partnerData.socialLinks.whatsapp}
                  onChange={(e) => setPartnerData({ ...partnerData, socialLinks: { ...partnerData.socialLinks, whatsapp: e.target.value } })}
                  className="input-field text-sm"
                  placeholder="10-digit number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">About Center Description</label>
              <textarea
                rows="3"
                value={partnerData.description}
                onChange={(e) => setPartnerData({ ...partnerData, description: e.target.value })}
                className="input-field text-sm"
                placeholder="Write a brief overview of your computer training institute..."
              />
            </div>

            <button type="submit" className="btn-primary py-2.5 px-6 text-xs font-bold">
              Update Center Profile
            </button>
          </form>
        </div>

      </div>

      {/* Payment QR Settings */}
      <div className="card p-6 border border-slate-200/80 shadow-sm rounded-2xl bg-white space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-base">Admission Payment QR / UPI Settings</h3>
        </div>
        <p className="text-xs text-slate-500">Jab student online admission form bharega aur payment karega, to ye UPI ID / QR code usko dikhega. Student payment karke transaction ID enter karega, form aapke approval ke liye aayega.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UPI ID Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                value={partnerData.upiId}
                onChange={(e) => setPartnerData({ ...partnerData, upiId: e.target.value })}
                className="input-field text-sm"
                placeholder="e.g. institute@okaxis, institute@paytm"
              />
              <p className="text-[10px] text-slate-400 mt-1">UPI ID enter karne par QR code automatically generate hoga.</p>
            </div>
            <button
              onClick={handleInstitute}
              className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500"
            >
              <Check className="w-4 h-4" /> Save UPI ID
            </button>

            {partnerData.upiId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">UPI ID set: {partnerData.upiId}</span>
              </div>
            )}
          </div>

          {/* QR Image Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload QR Code Image (Optional)</label>
            <form onSubmit={handleQrUpload} className="space-y-3 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-40 h-40 rounded-2xl bg-slate-100 border-2 border-dashed border-indigo-300 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                  {qrPreview ? (
                    <img src={qrPreview.startsWith('/uploads/') ? `/api${qrPreview}` : qrPreview} alt="Payment QR" className="w-full h-full object-contain rounded-xl" onError={(e) => { const img = e.target; if (!img.dataset.retried && qrPreview.includes('/uploads/')) { img.dataset.retried = 'true'; const path = qrPreview.substring(qrPreview.indexOf('/uploads/')); img.src = `/api${path}`; } else { img.style.display = 'none'; } }} />
                  ) : (
                    <div className="text-slate-400 p-2">
                      <QrCode className="w-12 h-12 mx-auto mb-1 text-slate-300" />
                      <span className="text-[11px] block">No QR Uploaded</span>
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-all hover:scale-110">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                </label>
              </div>
              {qrFile && (
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  Selected: {qrFile.name}
                </div>
              )}
              <button
                type="submit"
                disabled={uploadingQr || !qrFile}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {uploadingQr ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading QR...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Save QR Image</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
