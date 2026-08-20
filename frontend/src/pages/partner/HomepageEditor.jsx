import { useState, useEffect } from 'react';
import { getHomepage, updateHomepage, updateHomepageSection, publishHomepage, addTestimonial, deleteTestimonial, addHomepageNotice, deleteHomepageNotice, addFacility, deleteFacility, uploadGalleryPhoto, deleteGalleryPhoto, uploadHomepageBanner } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink, Save, Eye, Plus, Trash2, GripVertical, Upload, Camera, Image } from 'lucide-react';

export default function PartnerHomepage() {
  const { user } = useAuth();
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const { showSuccess, showError } = useToast();
  const [newTestimonial, setNewTestimonial] = useState({ studentName: '', course: '', rating: 5, review: '' });
  const [newNotice, setNewNotice] = useState({ title: '', message: '' });
  const [newFacility, setNewFacility] = useState({ icon: 'book', title: '', description: '' });
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });

  const load = () => { getHomepage().then(res => { setHomepage(res.data.homepage); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSaveSection = async (section, data) => {
    try { const res = await updateHomepageSection(section, { [section]: data }); setHomepage(res.data.homepage); showSuccess('Section saved'); }
    catch (error) { showError('Failed to save'); }
  };

  const handlePublish = async () => {
    try { const res = await publishHomepage(!homepage.isPublished); setHomepage(res.data.homepage); showSuccess(homepage.isPublished ? 'Unpublished' : 'Published'); }
    catch (error) { showError('Failed'); }
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    try { const res = await addTestimonial(newTestimonial); setHomepage(res.data.homepage); setNewTestimonial({ studentName: '', course: '', rating: 5, review: '' }); showSuccess('Testimonial added'); }
    catch (error) { showError('Failed'); }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    try { const res = await addHomepageNotice(newNotice); setHomepage(res.data.homepage); setNewNotice({ title: '', message: '' }); showSuccess('Notice added'); }
    catch (error) { showError('Failed'); }
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    try { const res = await addFacility(newFacility); setHomepage(res.data.homepage); setNewFacility({ icon: 'book', title: '', description: '' }); showSuccess('Facility added'); }
    catch (error) { showError('Failed'); }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    try { const res = await uploadGalleryPhoto(newPhoto); setHomepage(res.data.homepage); setNewPhoto({ url: '', caption: '' }); showSuccess('Photo added'); }
    catch (error) { showError('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!homepage) return <div className="text-center py-8 text-gray-400">Homepage not found</div>;

  const sections = [
    { key: 'hero', label: 'Hero Banner' },
    { key: 'about', label: 'About Section' },
    { key: 'contact', label: 'Contact Section' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'notices', label: 'Notices' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'settings', label: 'Theme & Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Homepage</h1><p className="text-xs sm:text-sm text-gray-500">Customize your institute's public homepage</p></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a href={`/institute/${user?.partner?.slug}`} target="_blank" rel="noreferrer" className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm"><ExternalLink className="w-4 h-4" /> View Live</a>
          <button onClick={handlePublish} className={`flex-1 sm:flex-none text-xs sm:text-sm ${homepage.isPublished ? 'btn-danger' : 'btn-primary'}`}>{homepage.isPublished ? 'Unpublish' : 'Publish'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card lg:col-span-1 h-fit p-3 sm:p-4">
          <h3 className="font-semibold mb-2.5 text-xs sm:text-sm text-gray-700">Sections</h3>
          <div className="flex flex-row overflow-x-auto lg:flex-col gap-1 pb-1 lg:pb-0 max-w-full">
            {sections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 lg:w-full ${activeSection === s.key ? 'bg-primary-600 text-white font-semibold shadow-xs' : 'hover:bg-gray-100 text-gray-700 bg-gray-50 lg:bg-transparent'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeSection === 'hero' && <HeroEditor homepage={homepage} onSave={(d) => handleSaveSection('hero', d)} />}
          {activeSection === 'about' && <AboutEditor homepage={homepage} onSave={(d) => handleSaveSection('about', d)} />}
          {activeSection === 'contact' && <ContactEditor homepage={homepage} onSave={(d) => handleSaveSection('contact', d)} />}
          {activeSection === 'facilities' && <FacilitiesEditor homepage={homepage} onAdd={handleAddFacility} onDelete={async (i) => { try { const res = await deleteFacility(i); setHomepage(res.data.homepage); showSuccess('Deleted'); } catch(e) { showError('Failed'); } }} newFacility={newFacility} setNewFacility={setNewFacility} />}
          {activeSection === 'testimonials' && <TestimonialsEditor homepage={homepage} onAdd={handleAddTestimonial} onDelete={async (i) => { try { const res = await deleteTestimonial(i); setHomepage(res.data.homepage); showSuccess('Deleted'); } catch(e) { showError('Failed'); } }} newTestimonial={newTestimonial} setNewTestimonial={setNewTestimonial} />}
          {activeSection === 'notices' && <NoticesEditor homepage={homepage} onAdd={handleAddNotice} onDelete={async (i) => { try { const res = await deleteHomepageNotice(i); setHomepage(res.data.homepage); showSuccess('Deleted'); } catch(e) { showError('Failed'); } }} newNotice={newNotice} setNewNotice={setNewNotice} />}
          {activeSection === 'gallery' && <GalleryEditor homepage={homepage} onAdd={handleAddPhoto} onDelete={async (i) => { try { const res = await deleteGalleryPhoto(i); setHomepage(res.data.homepage); showSuccess('Deleted'); } catch(e) { showError('Failed'); } }} newPhoto={newPhoto} setNewPhoto={setNewPhoto} />}
          {activeSection === 'settings' && <SettingsEditor homepage={homepage} onSave={async (d) => { try { const res = await updateHomepage({ settings: d }); setHomepage(res.data.homepage); showSuccess('Settings saved'); } catch(e) { showError('Failed'); } }} />}
        </div>
      </div>
    </div>
  );
}

function HeroEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.hero || {});
  const [bannerFile, setBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(homepage.hero?.bannerImage || '');
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadBannerFile = async () => {
    if (!bannerFile) return showError('Kripya naye banner ki image file select karein');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', bannerFile);
      const res = await uploadHomepageBanner(formData);
      showSuccess('Hero Banner image successfully uploaded!');
      const newBannerUrl = res.data.bannerImage;
      setPreviewUrl(newBannerUrl);
      setData(prev => ({ ...prev, bannerImage: newBannerUrl }));
      setBannerFile(null);
      if (onSave) onSave({ ...data, bannerImage: newBannerUrl });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to upload banner image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-lg">Hero Banner Configuration</h3>
      </div>

      {/* Banner Upload Box */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Upload Banner Image File *
        </label>
        
        {/* Banner Image Preview Container */}
        <div className="relative w-full h-48 md:h-56 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-inner group">
          {previewUrl ? (
            <img src={previewUrl} alt="Hero Banner Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4 text-slate-400">
              <Upload className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No Banner Image Selected</p>
              <p className="text-[11px] text-slate-400">Click below to upload a high-resolution banner image from your device.</p>
            </div>
          )}

          <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-xs">
            <span className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" /> Select New Banner File
            </span>
            <input type="file" accept="image/*" onChange={handleBannerFileChange} className="hidden" />
          </label>
        </div>

        {bannerFile && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-indigo-700 truncate">Selected: {bannerFile.name}</span>
            <button
              type="button"
              onClick={handleUploadBannerFile}
              disabled={uploading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Heading</label>
        <input type="text" value={data.heading || ''} onChange={(e) => setData({ ...data, heading: e.target.value })} className="input-field text-sm" placeholder="e.g. Welcome to Our Institute" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Subheading</label>
        <input type="text" value={data.subheading || ''} onChange={(e) => setData({ ...data, subheading: e.target.value })} className="input-field text-sm" placeholder="e.g. Learn Skills, Build Career" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
        <input type="text" value={data.ctaButtonText || ''} onChange={(e) => setData({ ...data, ctaButtonText: e.target.value })} className="input-field text-sm" placeholder="e.g. Enroll Now" />
      </div>

      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2 py-2.5 px-6 font-bold text-xs">
        <Save className="w-4 h-4" /> Save Hero Section
      </button>
    </div>
  );
}

function AboutEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.about || { whyChooseUs: [], achievements: [] });
  const [newPoint, setNewPoint] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">About Section</h3>
      <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></div>
      <div><label className="block text-sm font-medium mb-1">Description</label><textarea rows="4" value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} className="input-field" /></div>
      <div>
        <label className="block text-sm font-medium mb-1">Why Choose Us</label>
        <div className="space-y-2 mb-2">
          {(data.whyChooseUs || []).map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm flex-1">{p}</span>
              <button onClick={() => setData({ ...data, whyChooseUs: data.whyChooseUs.filter((_, idx) => idx !== i) })} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newPoint} onChange={(e) => setNewPoint(e.target.value)} placeholder="Add a point..." className="input-field" />
          <button onClick={() => { if (newPoint) { setData({ ...data, whyChooseUs: [...(data.whyChooseUs || []), newPoint] }); setNewPoint(''); } }} className="btn-secondary"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="border-t pt-3">
        <label className="block text-sm font-medium mb-1">Achievements</label>
        <div className="space-y-2 mb-2">
          {(data.achievements || []).map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm flex-1">{a}</span>
              <button onClick={() => setData({ ...data, achievements: data.achievements.filter((_, idx) => idx !== i) })} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} placeholder="Add an achievement..." className="input-field" />
          <button onClick={() => { if (newAchievement) { setData({ ...data, achievements: [...(data.achievements || []), newAchievement] }); setNewAchievement(''); } }} className="btn-secondary"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label></div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
    </div>
  );
}

function ContactEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.contact || { show: true });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Contact Section</h3>
      <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></div>
      <div><label className="block text-sm font-medium mb-1">Google Maps Embed URL</label><textarea rows="3" value={data.mapEmbed || ''} onChange={(e) => setData({ ...data, mapEmbed: e.target.value })} className="input-field" placeholder='<iframe src="https://www.google.com/maps/embed?..."></iframe>' /></div>
      <p className="text-xs text-gray-400">Paste the full iframe embed code from Google Maps. Phone, email, address, and social links are pulled from your institute profile.</p>
      <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label></div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
    </div>
  );
}

function FacilitiesEditor({ homepage, onAdd, onDelete, newFacility, setNewFacility }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Facilities</h3>
      <div className="space-y-2">
        {(homepage.facilities?.items || []).map((f, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div><p className="text-sm font-medium">{f.title}</p><p className="text-xs text-gray-500">{f.description}</p></div>
            <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={onAdd} className="grid grid-cols-3 gap-2">
        <select value={newFacility.icon} onChange={(e) => setNewFacility({ ...newFacility, icon: e.target.value })} className="input-field"><option value="monitor">Monitor</option><option value="wifi">WiFi</option><option value="book">Book</option><option value="award">Award</option><option value="users">Users</option><option value="building">Building</option></select>
        <input type="text" required placeholder="Title" value={newFacility.title} onChange={(e) => setNewFacility({ ...newFacility, title: e.target.value })} className="input-field" />
        <input type="text" required placeholder="Description" value={newFacility.description} onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary col-span-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Facility</button>
      </form>
    </div>
  );
}

function TestimonialsEditor({ homepage, onAdd, onDelete, newTestimonial, setNewTestimonial }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Student Testimonials</h3>
      <div className="space-y-2">
        {(homepage.testimonials?.items || []).map((t, i) => (
          <div key={i} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
            <div><p className="text-sm font-medium">{t.studentName} - {t.course}</p><p className="text-xs text-gray-500">{'★'.repeat(t.rating)} {t.review}</p></div>
            <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={onAdd} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input type="text" required placeholder="Student Name" value={newTestimonial.studentName} onChange={(e) => setNewTestimonial({ ...newTestimonial, studentName: e.target.value })} className="input-field" />
          <input type="text" placeholder="Course" value={newTestimonial.course} onChange={(e) => setNewTestimonial({ ...newTestimonial, course: e.target.value })} className="input-field" />
        </div>
        <select value={newTestimonial.rating} onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: +e.target.value })} className="input-field"><option value={5}>★★★★★</option><option value={4}>★★★★</option><option value={3}>★★★</option><option value={2}>★★</option><option value={1}>★</option></select>
        <textarea rows="2" required placeholder="Review" value={newTestimonial.review} onChange={(e) => setNewTestimonial({ ...newTestimonial, review: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Testimonial</button>
      </form>
    </div>
  );
}

function NoticesEditor({ homepage, onAdd, onDelete, newNotice, setNewNotice }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Public Notices</h3>
      <div className="space-y-2">
        {(homepage.notices?.items || []).map((n, i) => (
          <div key={i} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
            <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-gray-500">{n.message}</p></div>
            <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={onAdd} className="space-y-2">
        <input type="text" required placeholder="Notice Title" value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} className="input-field" />
        <textarea rows="2" required placeholder="Notice Message" value={newNotice.message} onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Notice</button>
      </form>
    </div>
  );
}

function GalleryEditor({ homepage, onAdd, onDelete, newPhoto, setNewPhoto }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Gallery Photos</h3>
      <div className="grid grid-cols-3 gap-3">
        {(homepage.gallery?.photos || []).map((p, i) => (
          <div key={i} className="relative group">
            <img src={p.url} alt={p.caption} className="w-full h-32 object-cover rounded-lg" />
            <button onClick={() => onDelete(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
            {p.caption && <p className="text-xs text-gray-500 mt-1 truncate">{p.caption}</p>}
          </div>
        ))}
      </div>
      <form onSubmit={onAdd} className="space-y-2">
        <input type="text" required placeholder="Photo URL" value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} className="input-field" />
        <input type="text" placeholder="Caption" value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Photo</button>
      </form>
    </div>
  );
}

function SettingsEditor({ homepage, onSave }) {
  const [settings, setSettings] = useState(homepage.settings || { themeColor: '#2563eb', fontChoice: 'inter' });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Theme & Settings</h3>
      <div><label className="block text-sm font-medium mb-1">Theme Color</label><input type="color" value={settings.themeColor} onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })} className="input-field" /></div>
      <div><label className="block text-sm font-medium mb-1">Font Choice</label><select value={settings.fontChoice} onChange={(e) => setSettings({ ...settings, fontChoice: e.target.value })} className="input-field"><option value="inter">Inter</option><option value="poppins">Poppins</option><option value="roboto">Roboto</option></select></div>
      <button onClick={() => onSave(settings)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Settings</button>
    </div>
  );
}
