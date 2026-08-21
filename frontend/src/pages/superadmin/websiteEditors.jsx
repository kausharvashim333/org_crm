import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Globe, Upload, ArrowUp, ArrowDown, Edit, FileText } from 'lucide-react';
import { uploadOrgImage, uploadOrgLogo, uploadOrgFavicon, uploadOrgPdf } from '../../api';
import { useToast } from '../../context/ToastContext';
import { refreshOrgSettings } from '../../hooks/useOrgSettings';

function Field({ label, children }) {
  return <div><label className="block text-sm font-medium mb-1">{label}</label>{children}</div>;
}

export function HeroEditor({ homepage, onSave }) {
  const [data, setData] = useState(() => {
    const hero = homepage.hero || {};
    const existingPoints = hero.points || [];
    const points = [...existingPoints];
    while (points.length < 4) {
      points.push('');
    }
    return { 
      ...hero, 
      sliderImages: hero.sliderImages || [],
      points: points.slice(0, 4)
    };
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const arr = [...(data.sliderImages || [])];
    arr.push(newImageUrl.trim());
    setData({ ...data, sliderImages: arr });
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    const arr = [...(data.sliderImages || [])];
    arr.splice(index, 1);
    setData({ ...data, sliderImages: arr });
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      const arr = [...(data.sliderImages || [])];
      arr.push(res.data.imageUrl);
      setData({ ...data, sliderImages: arr });
      showSuccess('Image uploaded and added to slider');
    } catch (error) {
      showError(getUploadErrorMessage(error));
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-lg">Hero Banner & Background Carousel</h3>
      
      <div className="border border-slate-200 p-4 rounded-xl space-y-4 bg-slate-50/50">
        <h4 className="font-semibold text-sm text-slate-700">Background Image Slider</h4>
        <p className="text-xs text-slate-500">
          Upload local files or paste image URLs. If configured, the background will automatically transition between these images.
          <br />
          <span className="text-indigo-600 font-semibold mt-1 inline-block">Recommended resolution: 1920x1080 pixels (16:9 aspect ratio, max 2MB) for best visual quality.</span>
        </p>
        
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={data.showCarousel !== false}
            onChange={(e) => setData({ ...data, showCarousel: e.target.checked })}
          />
          Show Background Slideshow (Carousel)
        </label>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {data.showCarousel === false ? (
            <p className="text-xs text-amber-600 font-semibold italic bg-amber-50 border border-amber-200 p-2 rounded-lg">Slideshow is currently disabled. Check the box above to enable it.</p>
          ) : (data.sliderImages || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No slider images added yet. System will fall back to single Banner Image or Theme Gradient.</p>
          ) : (
            (data.sliderImages || []).map((url, i) => (
              <div key={i} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 px-1.5">{i + 1}</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const arr = [...(data.sliderImages || [])];
                    arr[i] = e.target.value;
                    setData({ ...data, sliderImages: arr });
                  }}
                  className="input-field py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="text-red-655 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Or paste Banner Image URL here..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="input-field text-xs"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAddImage}
              className="btn-primary text-xs flex items-center gap-1.5 px-4 h-9 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add URL
            </button>
            <label className="btn-secondary text-xs flex items-center gap-1.5 px-4 h-9 cursor-pointer whitespace-nowrap justify-center flex-1 sm:flex-initial bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">
              <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload File'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadImage}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      <Field label="Single Banner Image URL (Fallback)"><input type="text" value={data.bannerImage || ''} onChange={(e) => setData({ ...data, bannerImage: e.target.value })} className="input-field" placeholder="Used if background image slider is empty" /></Field>
      <Field label="Heading"><input type="text" value={data.heading || ''} onChange={(e) => setData({ ...data, heading: e.target.value })} className="input-field" /></Field>
      <Field label="Subheading"><input type="text" value={data.subheading || ''} onChange={(e) => setData({ ...data, subheading: e.target.value })} className="input-field" /></Field>
      <Field label="Description"><input type="text" value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} className="input-field" /></Field>

      <div className="border border-slate-200 p-4 rounded-xl space-y-4 bg-slate-50/50">
        <h4 className="font-semibold text-sm text-slate-700">Hero Section Bullet Points (Exactly 4)</h4>
        <p className="text-xs text-slate-500">
          Define the 4 key benefits/features that will show side-by-side in the hero fold. If left blank, the system will dynamically parse them from the description.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <Field key={idx} label={`Bullet Point ${idx + 1}`}>
              <input
                type="text"
                value={data.points?.[idx] || ''}
                onChange={(e) => {
                  const arr = [...(data.points || ['', '', '', ''])];
                  arr[idx] = e.target.value;
                  setData({ ...data, points: arr });
                }}
                className="input-field"
                placeholder={`e.g. Bullet point number ${idx + 1}`}
              />
            </Field>
          ))}
        </div>
      </div>

      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2"><Save className="w-4 h-4" /> Save</button>
    </div>
  );
}

export function AboutEditor({ homepage, onSave, onAddFeature, onDeleteFeature }) {
  const [data, setData] = useState(homepage.about || { features: [] });
  const [newFeature, setNewFeature] = useState({ icon: 'book', title: '', description: '' });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">About / Mission & Vision</h3>
      <Field label="Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <Field label="Description"><textarea rows="3" value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} className="input-field" /></Field>
      <Field label="Mission"><textarea rows="2" value={data.mission || ''} onChange={(e) => setData({ ...data, mission: e.target.value })} className="input-field" /></Field>
      <Field label="Vision"><textarea rows="2" value={data.vision || ''} onChange={(e) => setData({ ...data, vision: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>

      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3">Why Choose Us Features</h4>
        <div className="space-y-2 mb-4">
          {(data.features || []).map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div><p className="text-sm font-medium">{f.title}</p><p className="text-xs text-gray-500">{f.description}</p></div>
              <button onClick={() => onDeleteFeature(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAddFeature(newFeature); setNewFeature({ icon: 'book', title: '', description: '' }); }} className="grid grid-cols-3 gap-2">
          <select value={newFeature.icon} onChange={(e) => setNewFeature({ ...newFeature, icon: e.target.value })} className="input-field">
            <option value="book">Book</option><option value="briefcase">Briefcase</option><option value="users">Users</option>
            <option value="award">Award</option><option value="monitor">Monitor</option><option value="building">Building</option>
            <option value="wifi">WiFi</option><option value="target">Target</option><option value="heart">Heart</option>
          </select>
          <input type="text" required placeholder="Title" value={newFeature.title} onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })} className="input-field" />
          <input type="text" required placeholder="Description" value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} className="input-field" />
          <button type="submit" className="btn-primary col-span-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Feature</button>
        </form>
      </div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Section</button>
    </div>
  );
}

export function StatsEditor({ homepage, onSave, onAdd, onDelete }) {
  const [data, setData] = useState(homepage.stats || { items: [] });
  const [newStat, setNewStat] = useState({ label: '', value: '', icon: 'building' });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Stats / Impact Section</h3>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3">Stat Items</h4>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(data.items || []).map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div><p className="text-sm font-medium">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(newStat); setNewStat({ label: '', value: '', icon: 'building' }); }} className="grid grid-cols-3 gap-2">
          <input type="text" required placeholder="Value (e.g. 50+)" value={newStat.value} onChange={(e) => setNewStat({ ...newStat, value: e.target.value })} className="input-field" />
          <input type="text" required placeholder="Label (e.g. Centers)" value={newStat.label} onChange={(e) => setNewStat({ ...newStat, label: e.target.value })} className="input-field" />
          <select value={newStat.icon} onChange={(e) => setNewStat({ ...newStat, icon: e.target.value })} className="input-field">
            <option value="building">Building</option><option value="users">Users</option><option value="book">Book</option>
            <option value="briefcase">Briefcase</option><option value="award">Award</option><option value="heart">Heart</option>
          </select>
          <button type="submit" className="btn-primary col-span-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Stat</button>
        </form>
      </div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Section</button>
    </div>
  );
}

export function VerticalsEditor({ homepage, onSave, onAdd, onDelete }) {
  const [data, setData] = useState(homepage.verticals || { items: [] });
  const [newItem, setNewItem] = useState({ icon: 'book', title: '', shortDesc: '', description: '', coursesCount: '', link: '' });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Verticals / Fields</h3>
      <Field label="Section Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <Field label="Section Subtitle"><input type="text" value={data.subtitle || ''} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3">Vertical Items</h4>
        <div className="space-y-2 mb-4">
          {(data.items || []).map((v, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div><p className="text-sm font-medium">{v.title}</p><p className="text-xs text-gray-500">{v.shortDesc} - {v.coursesCount}</p></div>
              <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(newItem); setNewItem({ icon: 'book', title: '', shortDesc: '', description: '', coursesCount: '', link: '' }); }} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={newItem.icon} onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })} className="input-field">
              <option value="book">Book</option><option value="briefcase">Briefcase</option><option value="users">Users</option>
              <option value="award">Award</option><option value="monitor">Monitor</option><option value="building">Building</option>
              <option value="wifi">WiFi</option><option value="target">Target</option><option value="heart">Heart</option><option value="trending">Trending</option>
            </select>
            <input type="text" required placeholder="Title (e.g. Paramedical)" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="input-field" />
          </div>
          <input type="text" placeholder="Short Description" value={newItem.shortDesc} onChange={(e) => setNewItem({ ...newItem, shortDesc: e.target.value })} className="input-field" />
          <textarea rows="2" placeholder="Full Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Courses Count (e.g. 15+ Courses)" value={newItem.coursesCount} onChange={(e) => setNewItem({ ...newItem, coursesCount: e.target.value })} className="input-field" />
            <input type="text" placeholder="Link (e.g. /#courses)" value={newItem.link} onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} className="input-field" />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2 w-full"><Plus className="w-4 h-4" /> Add Vertical</button>
        </form>
      </div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Section</button>
    </div>
  );
}

export function FranchiseEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.franchise || { benefits: [], steps: [], plans: [] });
  const [editingPlanIndex, setEditingPlanIndex] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    badge: '',
    tagline: '',
    fee: 15000,
    originalFee: 25000,
    royaltyPercentage: 'Zero Monthly Royalty',
    certificateShare: '₹150 / Certificate',
    featuresText: '',
    popular: false,
    color: 'indigo',
    buttonText: 'Apply for Plan',
    buttonLink: '/franchise/apply',
    isActive: true,
  });
  const [showPlanForm, setShowPlanForm] = useState(false);

  const updateBenefit = (i, key, val) => { const b = [...(data.benefits || [])]; b[i] = { ...b[i], [key]: val }; setData({ ...data, benefits: b }); };
  const addBenefit = () => setData({ ...data, benefits: [...(data.benefits || []), { icon: 'building', title: '', description: '' }] });
  const deleteBenefit = (i) => { const b = [...(data.benefits || [])]; b.splice(i, 1); setData({ ...data, benefits: b }); };

  const updateStep = (i, key, val) => { const s = [...(data.steps || [])]; s[i] = { ...s[i], [key]: val }; setData({ ...data, steps: s }); };
  const addStep = () => setData({ ...data, steps: [...(data.steps || []), { step: (data.steps || []).length + 1, title: '', description: '' }] });
  const deleteStep = (i) => { const s = [...(data.steps || [])]; s.splice(i, 1); setData({ ...data, steps: s }); };

  // Plan Management
  const startAddPlan = () => {
    setEditingPlanIndex(null);
    setPlanForm({
      name: '',
      badge: 'New Plan',
      tagline: '',
      fee: 20000,
      originalFee: 30000,
      royaltyPercentage: 'Zero Royalty',
      certificateShare: '₹150 / Certificate',
      featuresText: 'Authorization Certificate & Center ID\nComplete Course Curriculum & Syllabus\nAll-in-One CRM Management Software\nOnline Certificate Verification System\nMarketing & Promotional Support',
      popular: false,
      color: 'indigo',
      buttonText: 'Apply for Plan',
      buttonLink: '/franchise/apply',
      isActive: true,
    });
    setShowPlanForm(true);
  };

  const startEditPlan = (i, plan) => {
    setEditingPlanIndex(i);
    setPlanForm({
      name: plan.name || '',
      badge: plan.badge || '',
      tagline: plan.tagline || '',
      fee: plan.fee !== undefined ? plan.fee : 15000,
      originalFee: plan.originalFee !== undefined ? plan.originalFee : 25000,
      royaltyPercentage: plan.royaltyPercentage || 'Zero Royalty',
      certificateShare: plan.certificateShare || '₹150 / Certificate',
      featuresText: (plan.features || []).join('\n'),
      popular: !!plan.popular,
      color: plan.color || 'indigo',
      buttonText: plan.buttonText || 'Apply for Plan',
      buttonLink: plan.buttonLink || '/franchise/apply',
      isActive: plan.isActive !== false,
    });
    setShowPlanForm(true);
  };

  const handleSavePlan = (e) => {
    e.preventDefault();
    const features = planForm.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const newPlanObj = {
      name: planForm.name.trim(),
      badge: planForm.badge.trim(),
      tagline: planForm.tagline.trim(),
      fee: Number(planForm.fee) || 0,
      originalFee: Number(planForm.originalFee) || 0,
      royaltyPercentage: planForm.royaltyPercentage.trim(),
      certificateShare: planForm.certificateShare.trim(),
      features,
      popular: planForm.popular,
      color: planForm.color,
      buttonText: planForm.buttonText.trim() || 'Apply for Plan',
      buttonLink: planForm.buttonLink.trim() || '/franchise/apply',
      isActive: planForm.isActive,
    };

    const currentPlans = [...(data.plans || [])];
    if (editingPlanIndex !== null) {
      currentPlans[editingPlanIndex] = newPlanObj;
    } else {
      currentPlans.push(newPlanObj);
    }

    setData({ ...data, plans: currentPlans });
    setShowPlanForm(false);
  };

  const deletePlan = (i) => {
    const currentPlans = [...(data.plans || [])];
    currentPlans.splice(i, 1);
    setData({ ...data, plans: currentPlans });
  };

  const togglePlanActive = (i) => {
    const currentPlans = [...(data.plans || [])];
    currentPlans[i].isActive = !currentPlans[i].isActive;
    setData({ ...data, plans: currentPlans });
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Franchise & Partner Page Configuration</h3>
          <p className="text-xs text-slate-500">Configure page headers, partnership plans, benefits & process</p>
        </div>
        <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-1.5 py-2 px-5 text-xs font-bold">
          <Save className="w-4 h-4" /> Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Section Header Title">
          <input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" />
        </Field>
        <Field label="Section Subtitle">
          <input type="text" value={data.subtitle || ''} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="input-field" />
        </Field>
      </div>

      <Field label="Introductory Description">
        <textarea rows="2" value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} className="input-field" />
      </Field>

      <div className="flex items-center gap-4 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} className="rounded text-indigo-600 w-4 h-4" />
          Show Franchise Section on Website
        </label>
      </div>

      {/* 1. MANAGE PARTNERSHIP PLANS (MULTI-TIER FRANCHISE PACKAGES) */}
      <div className="border-t pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Partnership & Franchise Plans ({(data.plans || []).length} Plans)
            </h4>
            <p className="text-xs text-slate-500">Add different franchise tiers (e.g. Silver, Gold, Platinum) with custom fees and features</p>
          </div>
          <button
            type="button"
            onClick={startAddPlan}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add New Plan
          </button>
        </div>

        {/* Plan Form Modal / Card */}
        {showPlanForm && (
          <form onSubmit={handleSavePlan} className="bg-indigo-50/70 p-5 rounded-2xl border-2 border-indigo-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
              <h5 className="font-black text-sm text-indigo-950">
                {editingPlanIndex !== null ? '✏️ Edit Partnership Plan' : '✨ Create New Partnership Plan'}
              </h5>
              <button
                type="button"
                onClick={() => setShowPlanForm(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Plan Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold - District Master Franchise"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Most Popular / Starter"
                  value={planForm.badge}
                  onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Color Theme</label>
                <select
                  value={planForm.color}
                  onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                  className="input-field text-sm font-bold"
                >
                  <option value="indigo">Indigo (Corporate Blue)</option>
                  <option value="blue">Sky Blue (Clean)</option>
                  <option value="emerald">Emerald (Green Growth)</option>
                  <option value="purple">Purple (Royal/Master)</option>
                  <option value="amber">Amber (Gold Edition)</option>
                  <option value="rose">Rose (Premium)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Tagline / Target Audience</label>
              <input
                type="text"
                placeholder="e.g. Ideal for single computer centers & rural institutions"
                value={planForm.tagline}
                onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-indigo-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Offer Fee (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="15000"
                  value={planForm.fee}
                  onChange={(e) => setPlanForm({ ...planForm, fee: e.target.value })}
                  className="input-field text-sm font-black text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Original / Strikethrough (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={planForm.originalFee}
                  onChange={(e) => setPlanForm({ ...planForm, originalFee: e.target.value })}
                  className="input-field text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Royalty Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Zero Royalty / 10%"
                  value={planForm.royaltyPercentage}
                  onChange={(e) => setPlanForm({ ...planForm, royaltyPercentage: e.target.value })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Certificate Share</label>
                <input
                  type="text"
                  placeholder="e.g. ₹150 / Student"
                  value={planForm.certificateShare}
                  onChange={(e) => setPlanForm({ ...planForm, certificateShare: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Plan Features & Deliverables List (Enter one feature per line)
              </label>
              <textarea
                rows="4"
                placeholder="ISO Affiliation Certificate&#10;Complete Course Curriculum & Syllabus&#10;All-in-One CRM Software Access&#10;Online Certificate Verification&#10;Zero Monthly Royalty"
                value={planForm.featuresText}
                onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                className="input-field font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-5 text-xs font-bold text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.popular}
                    onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  Mark as "Most Popular / Highlighted"
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  Active (Visible on Website)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  {editingPlanIndex !== null ? 'Update Plan' : 'Add Plan to List'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Plans Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data.plans || []).map((plan, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                plan.popular ? 'border-indigo-400 bg-indigo-50/40 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 bg-white shadow-xs'
              } ${!plan.isActive ? 'opacity-60 bg-slate-100' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    plan.popular ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {plan.badge || `Plan #${i + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePlanActive(i)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditPlan(i, plan)}
                      className="p-1 rounded-md text-indigo-600 hover:bg-indigo-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePlan(i)}
                      className="p-1 rounded-md text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h5 className="font-extrabold text-slate-900 text-sm mb-1">{plan.name}</h5>
                {plan.tagline && <p className="text-[11px] text-slate-500 mb-3">{plan.tagline}</p>}

                <div className="flex items-baseline gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900">₹{plan.fee?.toLocaleString('en-IN')}</span>
                  {plan.originalFee > plan.fee && (
                    <span className="text-xs text-slate-400 line-through">₹{plan.originalFee?.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 mb-3">
                  <p><strong>Royalty:</strong> {plan.royaltyPercentage}</p>
                  <p><strong>Certificate Cost:</strong> {plan.certificateShare}</p>
                </div>

                <div className="space-y-1 border-t pt-2 text-[11px] text-slate-600">
                  {(plan.features || []).slice(0, 4).map((f, fi) => (
                    <p key={fi} className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-600 font-bold">✓</span> {f}
                    </p>
                  ))}
                  {(plan.features || []).length > 4 && (
                    <p className="text-[10px] text-indigo-600 font-bold">
                      +{plan.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(data.plans || []).length === 0 && (
            <div className="col-span-3 text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <p className="text-sm font-semibold">No partnership plans configured yet.</p>
              <button
                type="button"
                onClick={startAddPlan}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
              >
                + Click here to add your first plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. PARTNER BENEFITS */}
      <div className="border-t pt-5">
        <h4 className="font-bold text-sm text-slate-900 mb-3">Partner Benefits</h4>
        <div className="space-y-2 mb-3">
          {(data.benefits || []).map((b, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-slate-200">
              <select value={b.icon} onChange={(e) => updateBenefit(i, 'icon', e.target.value)} className="input-field w-32 text-xs">
                <option value="building">Building</option>
                <option value="book">Book</option>
                <option value="users">Users</option>
                <option value="monitor">Monitor</option>
                <option value="award">Award</option>
                <option value="target">Target</option>
              </select>
              <div className="flex-1 space-y-1">
                <input type="text" placeholder="Title" value={b.title} onChange={(e) => updateBenefit(i, 'title', e.target.value)} className="input-field text-xs font-bold" />
                <input type="text" placeholder="Description" value={b.description} onChange={(e) => updateBenefit(i, 'description', e.target.value)} className="input-field text-xs" />
              </div>
              <button type="button" onClick={() => deleteBenefit(i)} className="text-red-600 mt-1 p-1 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addBenefit} className="btn-secondary text-xs font-bold flex items-center gap-1 mb-4">
          <Plus className="w-3.5 h-3.5" /> Add Benefit
        </button>
      </div>

      {/* 3. PARTNER PROCESS STEPS */}
      <div className="border-t pt-5">
        <h4 className="font-bold text-sm text-slate-900 mb-3">Partner Process Steps</h4>
        <div className="space-y-2 mb-3">
          {(data.steps || []).map((s, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-slate-200">
              <input type="number" placeholder="#" value={s.step} onChange={(e) => updateStep(i, 'step', +e.target.value)} className="input-field w-16 text-xs text-center font-bold" />
              <div className="flex-1 space-y-1">
                <input type="text" placeholder="Step Title" value={s.title} onChange={(e) => updateStep(i, 'title', e.target.value)} className="input-field text-xs font-bold" />
                <input type="text" placeholder="Description" value={s.description} onChange={(e) => updateStep(i, 'description', e.target.value)} className="input-field text-xs" />
              </div>
              <button type="button" onClick={() => deleteStep(i)} className="text-red-600 mt-1 p-1 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="btn-secondary text-xs font-bold flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Step
        </button>
      </div>

      <div className="border-t pt-4 flex justify-end">
        <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2 py-3 px-8 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md">
          <Save className="w-4 h-4" /> Save Franchise Settings & Plans
        </button>
      </div>
    </div>
  );
}

export function CertificationsEditor({ homepage, onSave, onAdd, onDelete }) {
  const [data, setData] = useState(homepage.certifications || { items: [] });
  const [newItem, setNewItem] = useState({ name: '', logo: '', description: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      setNewItem(prev => ({ ...prev, logo: res.data.imageUrl }));
      showSuccess('Certification logo uploaded');
    } catch (err) {
      showError(getUploadErrorMessage(err));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Certifications & Affiliations</h3>
      <Field label="Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <Field label="Subtitle"><input type="text" value={data.subtitle || ''} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <div className="border-t pt-4">
        <div className="space-y-2 mb-4">
          {(data.items || []).map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                {c.logo && <img src={c.logo} alt={c.name} className="w-10 h-10 rounded object-cover border" />}
                <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.description}</p></div>
              </div>
              <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(newItem); setNewItem({ name: '', logo: '', description: '' }); }} className="space-y-2">
          <input type="text" required placeholder="Certification Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="input-field" />
          <div className="flex gap-2 items-center">
            <input type="text" placeholder="Logo URL (optional)" value={newItem.logo} onChange={(e) => setNewItem({ ...newItem, logo: e.target.value })} className="input-field flex-1" />
            <label className="btn-secondary flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <Upload className="w-4 h-4" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
          {newItem.logo && <img src={newItem.logo} alt="preview" className="w-12 h-12 rounded object-cover border" />}
          <input type="text" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="input-field" />
          <button type="submit" className="btn-primary flex items-center justify-center gap-2 w-full"><Plus className="w-4 h-4" /> Add Certification</button>
        </form>
      </div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Section</button>
    </div>
  );
}

export function GalleryEditor({ homepage, onAdd, onDelete }) {
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      onAdd({ url: res.data.imageUrl, caption: '' });
      showSuccess('Photo uploaded successfully');
    } catch (err) {
      showError(getUploadErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Gallery</h3>
      <div className="grid grid-cols-3 gap-3">
        {(homepage.gallery?.photos || []).map((p, i) => (
          <div key={i} className="relative group">
            <img src={p.url} alt={p.caption} className="w-full h-32 object-cover rounded-lg" />
            <button onClick={() => onDelete(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
            {p.caption && <p className="text-xs text-gray-500 mt-1 truncate">{p.caption}</p>}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onAdd(newPhoto); setNewPhoto({ url: '', caption: '' }); }} className="space-y-2">
        <input type="text" required placeholder="Photo URL" value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} className="input-field" />
        <input type="text" placeholder="Caption" value={newPhoto.caption} onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })} className="input-field" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex items-center justify-center gap-2 flex-1"><Plus className="w-4 h-4" /> Add Photo by URL</button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </form>
    </div>
  );
}

export function TestimonialsEditor({ homepage, onSave, onAdd, onDelete }) {
  const [newT, setNewT] = useState({ name: '', role: '', field: '', rating: 5, review: '' });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Testimonials</h3>
      <Field label="Title"><input type="text" value={homepage.testimonials?.title || ''} onChange={(e) => onSave({ ...homepage.testimonials, title: e.target.value })} className="input-field" /></Field>
      <Field label="Subtitle"><input type="text" value={homepage.testimonials?.subtitle || ''} onChange={(e) => onSave({ ...homepage.testimonials, subtitle: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={homepage.testimonials?.show !== false} onChange={(e) => onSave({ ...homepage.testimonials, show: e.target.checked })} /> Show this section</label>
      <div className="space-y-2">
        {(homepage.testimonials?.items || []).map((t, i) => (
          <div key={i} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
            <div><p className="text-sm font-medium">{t.name} - {t.role} {t.field ? `(${t.field})` : ''}</p><p className="text-xs text-gray-500">{'★'.repeat(t.rating)} {t.review}</p></div>
            <button onClick={() => onDelete(i)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onAdd(newT); setNewT({ name: '', role: '', field: '', rating: 5, review: '' }); }} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input type="text" required placeholder="Name" value={newT.name} onChange={(e) => setNewT({ ...newT, name: e.target.value })} className="input-field" />
          <input type="text" placeholder="Role / Designation" value={newT.role} onChange={(e) => setNewT({ ...newT, role: e.target.value })} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Field (e.g. Computer Training)" value={newT.field} onChange={(e) => setNewT({ ...newT, field: e.target.value })} className="input-field" />
          <select value={newT.rating} onChange={(e) => setNewT({ ...newT, rating: +e.target.value })} className="input-field"><option value={5}>★★★★★</option><option value={4}>★★★★</option><option value={3}>★★★</option></select>
        </div>
        <textarea rows="2" required placeholder="Review" value={newT.review} onChange={(e) => setNewT({ ...newT, review: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Testimonial</button>
      </form>
    </div>
  );
}

export function NoticesEditor({ homepage, onSave, onAdd, onDelete, onUpdate }) {
  const [data, setData] = useState(homepage.notices || { items: [] });
  const [newItem, setNewItem] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '', badge: 'New', category: 'General', pdfUrl: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const { showSuccess, showError } = useToast();

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploadingPdf(true);
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      const res = await uploadOrgPdf(fd);
      setNewItem(prev => ({ ...prev, pdfUrl: res.data.pdfUrl }));
      showSuccess('PDF uploaded successfully');
    } catch (error) {
      showError(getUploadErrorMessage(error));
    }
    setUploadingPdf(false);
    e.target.value = '';
  };

  const startEdit = (index, item) => {
    setEditingIndex(index);
    setNewItem({
      title: item.title || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: item.description || '',
      badge: item.badge || 'New',
      category: item.category || 'General',
      pdfUrl: item.pdfUrl || ''
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNewItem({ title: '', date: new Date().toISOString().split('T')[0], description: '', badge: 'New', category: 'General', pdfUrl: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
      onUpdate(editingIndex, { ...newItem, date: new Date(newItem.date) });
      setEditingIndex(null);
    } else {
      onAdd({ ...newItem, date: new Date(newItem.date) });
    }
    setNewItem({ title: '', date: new Date().toISOString().split('T')[0], description: '', badge: 'New', category: 'General', pdfUrl: '' });
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Notices & Announcements</h3>
      <Field label="Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <div className="border-t pt-4">
        <div className="space-y-2 mb-4">
          {(data.items || []).map((n, i) => (
            <div key={i} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg gap-2">
              <div className="flex-1 min-w-0">
                <span className="badge badge-info mr-2">{n.badge}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-700 mr-2">{n.category || 'General'}</span>
                {n.pdfUrl && (
                  <a 
                    href={n.pdfUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-0.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold mr-2 bg-indigo-50 px-1.5 py-0.5 rounded"
                  >
                    <FileText className="w-3 h-3" /> PDF
                  </a>
                )}
                <p className="text-sm font-medium inline truncate">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.description}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => startEdit(i, n)} className="text-indigo-600 hover:text-indigo-850 p-1 rounded hover:bg-slate-100"><Edit className="w-4 h-4" /></button>
                <button onClick={() => onDelete(i)} className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input type="text" required placeholder="Notice Title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="input-field" />
            <input type="date" value={newItem.date} onChange={(e) => setNewItem({ ...newItem, date: e.target.value })} className="input-field" />
            <div>
              <input 
                type="text" 
                placeholder="Category (e.g. General, Exams)" 
                list="notice-categories" 
                value={newItem.category} 
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} 
                className="input-field" 
              />
              <datalist id="notice-categories">
                <option value="General" />
                <option value="Admissions" />
                <option value="Exams" />
                <option value="Events" />
                <option value="Results" />
                <option value="Holidays" />
              </datalist>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <Field label="PDF Attachment URL (Optional)">
              <input 
                type="text" 
                placeholder="Upload using button or paste URL..." 
                value={newItem.pdfUrl || ''} 
                onChange={(e) => setNewItem({ ...newItem, pdfUrl: e.target.value })} 
                className="input-field" 
              />
            </Field>
            <div className="pt-5">
              <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer h-10 w-full bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">
                <FileText className="w-4 h-4" /> 
                {uploadingPdf ? 'Uploading PDF...' : newItem.pdfUrl ? 'Change PDF File' : 'Upload PDF File'}
                <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
              </label>
            </div>
          </div>

          <input type="text" placeholder="Badge (e.g. New, Urgent, Update)" value={newItem.badge} onChange={(e) => setNewItem({ ...newItem, badge: e.target.value })} className="input-field" />
          <textarea rows="2" required placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="input-field" />
          
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 flex-1">
              {editingIndex !== null ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingIndex !== null ? 'Update Notice' : 'Add Notice'}
            </button>
            {editingIndex !== null && (
              <button type="button" onClick={cancelEdit} className="btn-secondary px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Section</button>
    </div>
  );
}

export function CtaEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.cta || {});
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Call-to-Action Section</h3>
      <Field label="Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <Field label="Description"><textarea rows="2" value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} className="input-field" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
    </div>
  );
}

export function ContactEditor({ homepage, onSave }) {
  const [data, setData] = useState(homepage.contact || { socialLinks: {} });
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Contact Information</h3>
      <Field label="Title"><input type="text" value={data.title || ''} onChange={(e) => setData({ ...data, title: e.target.value })} className="input-field" /></Field>
      <Field label="Subtitle"><input type="text" value={data.subtitle || ''} onChange={(e) => setData({ ...data, subtitle: e.target.value })} className="input-field" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email"><input type="email" value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} className="input-field" /></Field>
        <Field label="Phone"><input type="text" value={data.phone || ''} onChange={(e) => setData({ ...data, phone: e.target.value })} className="input-field" /></Field>
      </div>
      <Field label="Address"><input type="text" value={data.address || ''} onChange={(e) => setData({ ...data, address: e.target.value })} className="input-field" /></Field>
      <div className="border-t pt-3">
        <h4 className="font-medium text-sm mb-1">Google Map Embed</h4>
        <p className="text-xs text-gray-500 mb-2">Go to <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Maps</a> → search your location → click "Share" → "Embed a map" → copy the <code className="bg-gray-100 px-1 rounded text-xs">src="..."</code> URL and paste it below.</p>
        <textarea
          value={data.mapEmbed || ''}
          onChange={(e) => setData({ ...data, mapEmbed: e.target.value })}
          className="input-field min-h-[80px] text-xs font-mono"
          placeholder='https://www.google.com/maps/embed?pb=...'
        />
        {data.mapEmbed && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 flex items-center justify-between">
              <span>Live Preview</span>
              <button onClick={() => setData({ ...data, mapEmbed: '' })} className="text-red-600 text-xs hover:underline">Remove Map</button>
            </div>
            <iframe
              src={data.mapEmbed}
              className="w-full h-[200px] border-none"
              title="Map Preview"
              loading="lazy"
            />
          </div>
        )}
      </div>
      <div className="border-t pt-3">
        <h4 className="font-medium text-sm mb-2">Social Links</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Facebook"><input type="text" value={data.socialLinks?.facebook || ''} onChange={(e) => setData({ ...data, socialLinks: { ...data.socialLinks, facebook: e.target.value } })} className="input-field" /></Field>
          <Field label="Instagram"><input type="text" value={data.socialLinks?.instagram || ''} onChange={(e) => setData({ ...data, socialLinks: { ...data.socialLinks, instagram: e.target.value } })} className="input-field" /></Field>
          <Field label="YouTube"><input type="text" value={data.socialLinks?.youtube || ''} onChange={(e) => setData({ ...data, socialLinks: { ...data.socialLinks, youtube: e.target.value } })} className="input-field" /></Field>
          <Field label="WhatsApp"><input type="text" value={data.socialLinks?.whatsapp || ''} onChange={(e) => setData({ ...data, socialLinks: { ...data.socialLinks, whatsapp: e.target.value } })} className="input-field" /></Field>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show !== false} onChange={(e) => setData({ ...data, show: e.target.checked })} /> Show this section</label>
      <button onClick={() => onSave(data)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
    </div>
  );
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getUploadErrorMessage = (err) => {
  const status = err.response?.status;
  if (status === 413) return 'File too large. Server rejected it. Max size is 50MB. If on production, ask admin to update nginx client_max_body_size.';
  if (status === 401) return 'Session expired. Please login again.';
  if (status === 403) return 'You do not have permission to upload files.';
  return err.response?.data?.message || 'Upload failed';
};

const validateFileSize = (file, showError) => {
  if (file.size > MAX_FILE_SIZE) {
    showError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed: 50MB`);
    return false;
  }
  return true;
};

export function SettingsEditor({ homepage, onSave, onHomepageUpdate }) {
  const [settings, setSettings] = useState(homepage.settings || {});
  const { showSuccess, showError } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const res = await uploadOrgLogo(fd);
      setSettings(res.data.homepage.settings);
      if (onHomepageUpdate) onHomepageUpdate(res.data.homepage);
      refreshOrgSettings();
      showSuccess('Logo uploaded successfully');
    } catch (err) {
      showError(getUploadErrorMessage(err));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploadingFavicon(true);
    const fd = new FormData();
    fd.append('favicon', file);
    try {
      const res = await uploadOrgFavicon(fd);
      setSettings(res.data.homepage.settings);
      if (onHomepageUpdate) onHomepageUpdate(res.data.homepage);
      refreshOrgSettings();
      showSuccess('Favicon uploaded successfully');
    } catch (err) {
      showError(getUploadErrorMessage(err));
    } finally {
      setUploadingFavicon(false);
      e.target.value = '';
    }
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Branding & Settings</h3>
      <Field label="Organization Name"><input type="text" value={settings.orgName || ''} onChange={(e) => setSettings({ ...settings, orgName: e.target.value })} className="input-field" /></Field>
      <Field label="Short Name (shown below hero title)"><input type="text" value={settings.shortName || ''} onChange={(e) => setSettings({ ...settings, shortName: e.target.value })} className="input-field" placeholder="e.g. SITN" /></Field>
      <Field label="Browser Tab Title"><input type="text" value={settings.browserTitle || ''} onChange={(e) => setSettings({ ...settings, browserTitle: e.target.value })} className="input-field" /></Field>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-2">Logo</label>
        <div className="flex items-center gap-4 mb-3">
          {settings.logo ? <img src={settings.logo} alt="logo" className="w-16 h-16 rounded-lg object-cover border" /> : <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center"><Globe className="w-8 h-8 text-gray-400" /></div>}
          <div>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            {settings.logo && <button onClick={() => setSettings({ ...settings, logo: '' })} className="text-red-600 text-sm ml-3">Remove</button>}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-2">Favicon</label>
        <div className="flex items-center gap-4 mb-3">
          {settings.favicon ? <img src={settings.favicon} alt="favicon" className="w-8 h-8 rounded object-cover border" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><Globe className="w-4 h-4 text-gray-400" /></div>}
          <div>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
              <input type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} disabled={uploadingFavicon} />
            </label>
            {settings.favicon && <button onClick={() => setSettings({ ...settings, favicon: '' })} className="text-red-600 text-sm ml-3">Remove</button>}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <Field label="Theme Color"><input type="color" value={settings.themeColor || '#2563eb'} onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })} className="input-field" /></Field>
      </div>
      <Field label="Font Choice">
        <select value={settings.fontChoice || 'inter'} onChange={(e) => setSettings({ ...settings, fontChoice: e.target.value })} className="input-field">
          <option value="inter">Inter</option><option value="poppins">Poppins</option><option value="roboto">Roboto</option>
        </select>
      </Field>
      <button onClick={() => onSave(settings)} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Settings</button>
    </div>
  );
}

export function ServicesEditor({ homepage, onSave, onAdd, onDelete }) {
  const services = homepage.services || { title: '', subtitle: '', show: true, items: [] };
  const [title, setTitle] = useState(services.title || '');
  const [subtitle, setSubtitle] = useState(services.subtitle || '');
  const [show, setShow] = useState(services.show !== false);
  const [items, setItems] = useState(services.items || []);

  const [newService, setNewService] = useState({ title: '', duration: '', desc: '', topicsRaw: '', careersRaw: '', toolsRaw: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', duration: '', desc: '', topicsRaw: '', careersRaw: '', toolsRaw: '' });

  useEffect(() => {
    const updatedServices = homepage.services || { title: '', subtitle: '', show: true, items: [] };
    setTitle(updatedServices.title || '');
    setSubtitle(updatedServices.subtitle || '');
    setShow(updatedServices.show !== false);
    setItems(updatedServices.items || []);
  }, [homepage]);

  const startEditing = (idx, item) => {
    setEditingIndex(idx);
    setEditForm({
      title: item.title, duration: item.duration, desc: item.desc,
      topicsRaw: item.topics?.join(', ') || '', careersRaw: item.careers?.join(', ') || '', toolsRaw: item.tools?.join(', ') || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updated = [...items];
    updated[editingIndex] = {
      title: editForm.title, duration: editForm.duration, desc: editForm.desc,
      topics: editForm.topicsRaw.split(',').map(s => s.trim()).filter(Boolean),
      careers: editForm.careersRaw.split(',').map(s => s.trim()).filter(Boolean),
      tools: editForm.toolsRaw.split(',').map(s => s.trim()).filter(Boolean)
    };
    setItems(updated);
    setEditingIndex(null);
    onSave({ title, subtitle, show, items: updated });
  };

  const moveService = (index, direction) => {
    const updated = [...items];
    if (direction === 'up' && index > 0) { [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]]; }
    else if (direction === 'down' && index < updated.length - 1) { [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]; }
    setItems(updated);
    onSave({ title, subtitle, show, items: updated });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newService.title.trim()) return;
    onAdd({
      title: newService.title, duration: newService.duration, desc: newService.desc,
      topics: newService.topicsRaw.split(',').map(s => s.trim()).filter(Boolean),
      careers: newService.careersRaw.split(',').map(s => s.trim()).filter(Boolean),
      tools: newService.toolsRaw.split(',').map(s => s.trim()).filter(Boolean)
    });
    setNewService({ title: '', duration: '', desc: '', topicsRaw: '', careersRaw: '', toolsRaw: '' });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Services Header Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services Page Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Our Training Services" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services Page Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input-field" placeholder="e.g. Explore our specialized verticals..." />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input type="checkbox" id="showServices" checked={show} onChange={(e) => setShow(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
          <label htmlFor="showServices" className="text-sm font-semibold text-slate-700">Display Services Page</label>
        </div>
        <button onClick={() => onSave({ title, subtitle, show, items })} className="btn-primary mt-4 flex items-center gap-2"><Save className="w-4 h-4" /> Save Header Info</button>
      </div>

      <div className="card">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Active Services Catalog ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No services added yet. Add your first service category below.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              if (editingIndex === idx) {
                return (
                  <form key={idx} onSubmit={handleSaveEdit} className="p-5 border-2 border-indigo-200 rounded-2xl bg-indigo-50/10 space-y-4">
                    <h4 className="font-bold text-indigo-700 text-sm">Editing Program: {item.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Title</label><input type="text" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input-field bg-white" /></div>
                      <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</label><input type="text" required value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} className="input-field bg-white" /></div>
                    </div>
                    <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label><textarea rows="2" required value={editForm.desc} onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })} className="input-field bg-white" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Syllabus Topics (comma-separated)</label><textarea rows="3" value={editForm.topicsRaw} onChange={(e) => setEditForm({ ...editForm, topicsRaw: e.target.value })} className="input-field bg-white" /></div>
                      <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Careers (comma-separated)</label><textarea rows="3" value={editForm.careersRaw} onChange={(e) => setEditForm({ ...editForm, careersRaw: e.target.value })} className="input-field bg-white" /></div>
                      <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tools & Equip (comma-separated)</label><textarea rows="3" value={editForm.toolsRaw} onChange={(e) => setEditForm({ ...editForm, toolsRaw: e.target.value })} className="input-field bg-white" /></div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setEditingIndex(null)} className="px-4 py-2 border rounded-xl text-xs bg-white text-slate-600 hover:bg-slate-50 transition-all font-semibold">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs hover:bg-indigo-700 transition-all font-bold">Save Changes</button>
                    </div>
                  </form>
                );
              }
              return (
                <div key={idx} className="p-4 border rounded-xl bg-slate-50 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800">{item.title} <span className="text-xs font-normal text-slate-400">({item.duration})</span></h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{item.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                      <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Topics</span><p className="text-[11px] text-slate-600 truncate">{item.topics?.join(', ') || 'None'}</p></div>
                      <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Careers</span><p className="text-[11px] text-slate-600 truncate">{item.careers?.join(', ') || 'None'}</p></div>
                      <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tools / Instruments</span><p className="text-[11px] text-slate-600 truncate">{item.tools?.join(', ') || 'None'}</p></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start flex-shrink-0">
                    <button onClick={() => startEditing(idx, item)} className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg hover:shadow transition-all cursor-pointer" title="Edit Service"><Edit className="w-4 h-4" /></button>
                    <button disabled={idx === 0} onClick={() => moveService(idx, 'up')} className={`p-1.5 bg-white border rounded-lg hover:shadow transition-all ${idx === 0 ? 'text-slate-200 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 cursor-pointer'}`} title="Move Up"><ArrowUp className="w-4 h-4" /></button>
                    <button disabled={idx === items.length - 1} onClick={() => moveService(idx, 'down')} className={`p-1.5 bg-white border rounded-lg hover:shadow transition-all ${idx === items.length - 1 ? 'text-slate-200 cursor-not-allowed bg-slate-50' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 cursor-pointer'}`} title="Move Down"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(idx)} className="text-red-500 hover:text-red-700 p-1.5 bg-white border rounded-lg hover:shadow hover:bg-red-50/50 transition-all cursor-pointer" title="Delete Service"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">Add New Training Service</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service/Program Title *</label><input type="text" required value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} className="input-field" placeholder="e.g. Health & Yoga Training" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration / Certification *</label><input type="text" required value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: e.target.value })} className="input-field" placeholder="e.g. 6 Months Certificate" /></div>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Overview Description *</label><textarea rows="3" required value={newService.desc} onChange={(e) => setNewService({ ...newService, desc: e.target.value })} className="input-field" placeholder="Provide a brief overview of what students will learn..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syllabus Topics (comma-separated)</label><textarea rows="3" value={newService.topicsRaw} onChange={(e) => setNewService({ ...newService, topicsRaw: e.target.value })} className="input-field" placeholder="Topic A, Topic B, Topic C..." /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Careers (comma-separated)</label><textarea rows="3" value={newService.careersRaw} onChange={(e) => setNewService({ ...newService, careersRaw: e.target.value })} className="input-field" placeholder="Career A, Career B..." /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tools & Equipment (comma-separated)</label><textarea rows="3" value={newService.toolsRaw} onChange={(e) => setNewService({ ...newService, toolsRaw: e.target.value })} className="input-field" placeholder="Tool A, Tool B..." /></div>
          </div>
          <div className="pt-2"><button type="submit" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Service to Catalog</button></div>
        </form>
      </div>
    </div>
  );
}

export function AnnouncementEditor({ homepage, onSave }) {
  const ann = homepage.announcement || { show: true, text: '', bgColor: '#3730a3', textColor: '#ffffff' };
  const [show, setShow] = useState(ann.show !== false);
  const [text, setText] = useState(ann.text || '');
  const [bgColor, setBgColor] = useState(ann.bgColor || '#3730a3');
  const [textColor, setTextColor] = useState(ann.textColor || '#ffffff');

  useEffect(() => {
    const updated = homepage.announcement || { show: true, text: '', bgColor: '#3730a3', textColor: '#ffffff' };
    setShow(updated.show !== false);
    setText(updated.text || '');
    setBgColor(updated.bgColor || '#3730a3');
    setTextColor(updated.textColor || '#ffffff');
  }, [homepage]);

  return (
    <div className="card space-y-4">
      <h3 className="font-bold text-lg mb-2 text-slate-800 border-b pb-2">Top Announcement Bar settings</h3>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="showAnn" checked={show} onChange={(e) => setShow(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500 animate-pulse" />
        <label htmlFor="showAnn" className="text-sm font-semibold text-slate-700">Display Top Announcement Bar</label>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Announcement Text</label>
        <textarea rows="3" value={text} onChange={(e) => setText(e.target.value)} className="input-field" placeholder="Write your announcement text..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Background Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
            <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="input-field flex-1" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Text Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 border rounded cursor-pointer" />
            <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="input-field flex-1" />
          </div>
        </div>
      </div>
      <div className="pt-2">
        <button onClick={() => onSave({ show, text, bgColor, textColor })} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Announcement</button>
      </div>
    </div>
  );
}

export function EnquiryConfigEditor({ homepage, onSave }) {
  const config = homepage.enquiryConfig || { modalTitle: 'Admission Enquiry Form', successMessage: 'Thank you for your enquiry!' };
  const [modalTitle, setModalTitle] = useState(config.modalTitle || '');
  const [successMessage, setSuccessMessage] = useState(config.successMessage || '');

  useEffect(() => {
    const updated = homepage.enquiryConfig || { modalTitle: 'Admission Enquiry Form', successMessage: 'Thank you for your enquiry!' };
    setModalTitle(updated.modalTitle || '');
    setSuccessMessage(updated.successMessage || '');
  }, [homepage]);

  return (
    <div className="card space-y-4">
      <h3 className="font-bold text-lg mb-2 text-slate-800 border-b pb-2">Enquiry Modal Setup</h3>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enquiry Modal Title</label>
        <input type="text" value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} className="input-field" placeholder="e.g. Admission Enquiry Form" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Success Callback Message</label>
        <textarea rows="3" value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} className="input-field" placeholder="e.g. Thank you! Our counseling team will contact you..." />
      </div>
      <div className="pt-2">
        <button onClick={() => onSave({ modalTitle, successMessage })} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Enquiry Setup</button>
      </div>
    </div>
  );
}

export function CodeSeriesEditor({ homepage, onSave }) {
  const cfg = homepage.codeSeriesConfig || {
    franchisePrefix: 'FR-',
    franchiseStartNo: 1,
    franchisePadLength: 4,
    studentPrefix: 'STU-',
    studentIncludeYear: true,
    studentStartNo: 1,
    studentPadLength: 4,
    certificatePrefix: 'CERT-',
    certificateStartNo: 1,
    certificatePadLength: 6,
  };

  const [form, setForm] = useState({
    franchisePrefix: cfg.franchisePrefix ?? 'FR-',
    franchiseStartNo: cfg.franchiseStartNo ?? 1,
    franchisePadLength: cfg.franchisePadLength ?? 4,
    studentPrefix: cfg.studentPrefix ?? 'STU-',
    studentIncludeYear: cfg.studentIncludeYear !== false,
    studentStartNo: cfg.studentStartNo ?? 1,
    studentPadLength: cfg.studentPadLength ?? 4,
    certificatePrefix: cfg.certificatePrefix ?? 'CERT-',
    certificateStartNo: cfg.certificateStartNo ?? 1,
    certificatePadLength: cfg.certificatePadLength ?? 6,
  });

  useEffect(() => {
    const updated = homepage.codeSeriesConfig || {};
    setForm({
      franchisePrefix: updated.franchisePrefix ?? 'FR-',
      franchiseStartNo: updated.franchiseStartNo ?? 1,
      franchisePadLength: updated.franchisePadLength ?? 4,
      studentPrefix: updated.studentPrefix ?? 'STU-',
      studentIncludeYear: updated.studentIncludeYear !== false,
      studentStartNo: updated.studentStartNo ?? 1,
      studentPadLength: updated.studentPadLength ?? 4,
      certificatePrefix: updated.certificatePrefix ?? 'CERT-',
      certificateStartNo: updated.certificateStartNo ?? 1,
      certificatePadLength: updated.certificatePadLength ?? 6,
    });
  }, [homepage]);

  const yearStr = form.studentIncludeYear ? `${new Date().getFullYear()}-` : '';
  const franchisePreview = `${form.franchisePrefix || ''}${String(Number(form.franchiseStartNo) || 1).padStart(Number(form.franchisePadLength) || 4, '0')}`;
  const studentPreview = `${form.studentPrefix || ''}${yearStr}${String(Number(form.studentStartNo) || 1).padStart(Number(form.studentPadLength) || 4, '0')}`;
  const certPreview = `${form.certificatePrefix || ''}${String(Number(form.certificateStartNo) || 1).padStart(Number(form.certificatePadLength) || 6, '0')}`;

  return (
    <div className="card space-y-6">
      <div className="border-b pb-3">
        <h3 className="font-bold text-lg text-slate-900">Custom Code & Serial Number Series Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">
          Customize prefixes, starting numbers, and number padding for Franchise IDs, Student Roll Numbers, and Certificate Serial Codes.
        </p>
      </div>

      {/* Franchise Code Config */}
      <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800">1. Franchise / Partner Center Code Series</h4>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Preview: {franchisePreview}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Prefix (e.g. FR-, SKILL-)</label>
            <input type="text" value={form.franchisePrefix} onChange={(e) => setForm({ ...form, franchisePrefix: e.target.value })} className="input-field bg-white" placeholder="e.g. FR-" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Number</label>
            <input type="number" min="1" value={form.franchiseStartNo} onChange={(e) => setForm({ ...form, franchiseStartNo: parseInt(e.target.value) || 1 })} className="input-field bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Padding Digits (e.g. 4 = 0001)</label>
            <input type="number" min="1" max="10" value={form.franchisePadLength} onChange={(e) => setForm({ ...form, franchisePadLength: parseInt(e.target.value) || 4 })} className="input-field bg-white" />
          </div>
        </div>
      </div>

      {/* Student Roll / ID Config */}
      <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800">2. Student Roll No / Registration Series</h4>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Preview: {studentPreview}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Prefix (e.g. STU-, REG-)</label>
            <input type="text" value={form.studentPrefix} onChange={(e) => setForm({ ...form, studentPrefix: e.target.value })} className="input-field bg-white" placeholder="e.g. STU-" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Include Year in Code?</label>
            <div className="flex items-center h-[42px] px-3 bg-white border rounded-lg">
              <input type="checkbox" id="studentIncludeYear" checked={form.studentIncludeYear} onChange={(e) => setForm({ ...form, studentIncludeYear: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500 mr-2" />
              <label htmlFor="studentIncludeYear" className="text-xs font-bold text-slate-700">Include Year (2026-)</label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Number</label>
            <input type="number" min="1" value={form.studentStartNo} onChange={(e) => setForm({ ...form, studentStartNo: parseInt(e.target.value) || 1 })} className="input-field bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Padding Digits</label>
            <input type="number" min="1" max="10" value={form.studentPadLength} onChange={(e) => setForm({ ...form, studentPadLength: parseInt(e.target.value) || 4 })} className="input-field bg-white" />
          </div>
        </div>
      </div>

      {/* Certificate Code Config */}
      <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800">3. Certificate Serial Number Series</h4>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Preview: {certPreview}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Prefix (e.g. CERT-, VC-)</label>
            <input type="text" value={form.certificatePrefix} onChange={(e) => setForm({ ...form, certificatePrefix: e.target.value })} className="input-field bg-white" placeholder="e.g. CERT-" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Number</label>
            <input type="number" min="1" value={form.certificateStartNo} onChange={(e) => setForm({ ...form, certificateStartNo: parseInt(e.target.value) || 1 })} className="input-field bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Padding Digits (e.g. 6 = 000001)</label>
            <input type="number" min="1" max="10" value={form.certificatePadLength} onChange={(e) => setForm({ ...form, certificatePadLength: parseInt(e.target.value) || 6 })} className="input-field bg-white" />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t flex justify-end">
        <button onClick={() => onSave(form)} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Code Series Settings
        </button>
      </div>
    </div>
  );
}

export function CustomSectionsEditor({ homepage, onAddSection, onUpdateSection, onDeleteSection, onAddCard, onDeleteCard }) {
  const sections = homepage.customSections || [];
  const iconOptions = ['book', 'briefcase', 'users', 'award', 'monitor', 'building', 'target', 'heart', 'trending', 'wifi'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Custom Card Sections</h3>
          <p className="text-xs text-slate-500">Create new card blocks to display on the homepage. Add cards with icons, images, descriptions, and links.</p>
        </div>
        <button onClick={() => onAddSection({ title: 'New Section', subtitle: '', badge: '', bgStyle: 'white', columns: 4 })} className="btn-primary flex items-center gap-2 text-xs">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-sm">No custom sections yet. Click "Add Section" to create one.</p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.id} className="card space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{section.id}</span>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={section.show !== false} onChange={(e) => onUpdateSection(section.id, { show: e.target.checked })} className="rounded" />
                  Visible
                </label>
              </div>
              <button onClick={() => onDeleteSection(section.id)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Section Title">
                <input type="text" value={section.title} onChange={(e) => onUpdateSection(section.id, { title: e.target.value })} className="input-field" placeholder="e.g. Our Facilities" />
              </Field>
              <Field label="Badge Label">
                <input type="text" value={section.badge || ''} onChange={(e) => onUpdateSection(section.id, { badge: e.target.value })} className="input-field" placeholder="e.g. Highlights" />
              </Field>
              <Field label="Subtitle">
                <input type="text" value={section.subtitle || ''} onChange={(e) => onUpdateSection(section.id, { subtitle: e.target.value })} className="input-field" placeholder="Short description" />
              </Field>
              <Field label="Background Style">
                <select value={section.bgStyle || 'white'} onChange={(e) => onUpdateSection(section.id, { bgStyle: e.target.value })} className="input-field">
                  <option value="white">White</option>
                  <option value="slate">Light Slate</option>
                  <option value="dark">Dark</option>
                </select>
              </Field>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-bold text-slate-600 mb-2">Cards ({section.cards?.length || 0})</p>
              {section.cards?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {section.cards.map((card, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input type="text" value={card.title} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, title: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs" placeholder="Card title" />
                        <select value={card.icon} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, icon: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs">
                          {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                        <input type="text" value={card.description} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, description: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs" placeholder="Description" />
                        <input type="text" value={card.link || ''} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, link: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs" placeholder="Link URL (optional)" />
                        <input type="text" value={card.image || ''} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, image: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs" placeholder="Image URL (optional, overrides icon)" />
                        <input type="text" value={card.linkText || ''} onChange={(e) => {
                          const updated = [...section.cards];
                          updated[cIdx] = { ...card, linkText: e.target.value };
                          onUpdateSection(section.id, { cards: updated });
                        }} className="input-field text-xs" placeholder="Link text (e.g. Learn More)" />
                      </div>
                      <button onClick={() => onDeleteCard(section.id, cIdx)} className="text-rose-500 hover:text-rose-700 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => onAddCard(section.id, { icon: 'book', title: 'New Card', description: '', link: '', linkText: 'Learn More' })}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Card
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function CentersStripEditor({ homepage, onUpdate, onAddCenter, onDeleteCenter }) {
  const { showSuccess, showError } = useToast();
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const strip = homepage.centersStrip || { show: false, title: 'Our Centers', centers: [] };

  const handleLogoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFileSize(file, showError)) { e.target.value = ''; return; }
    setUploadingIndex(index);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      const updated = [...strip.centers];
      updated[index] = { ...updated[index], logo: res.data.imageUrl };
      onUpdate({ centers: updated });
      showSuccess('Center logo uploaded');
    } catch (err) {
      showError(getUploadErrorMessage(err));
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Centers Strip</h3>
          <p className="text-xs text-slate-500">Shows a strip of organization-owned centers below the navbar. Clicking a center opens its page.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={strip.show !== false} onChange={(e) => onUpdate({ show: e.target.checked })} className="rounded" />
          Show Strip
        </label>
      </div>

      <Field label="Strip Title">
        <input type="text" value={strip.title || ''} onChange={(e) => onUpdate({ title: e.target.value })} className="input-field" placeholder="e.g. Our Centers" />
      </Field>

      <div className="border-t pt-3">
        <p className="text-xs font-bold text-slate-600 mb-2">Centers ({strip.centers?.length || 0})</p>
        {strip.centers?.length > 0 && (
          <div className="space-y-2 mb-3">
            {strip.centers.map((center, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {center.logo ? (
                      <img src={center.logo} alt={center.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <label className="btn-secondary flex items-center gap-1 cursor-pointer text-xs px-2.5 py-1.5">
                      <Upload className="w-3.5 h-3.5" /> {uploadingIndex === i ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, i)} disabled={uploadingIndex === i} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input type="text" value={center.name} onChange={(e) => {
                      const updated = [...strip.centers];
                      updated[i] = { ...center, name: e.target.value };
                      onUpdate({ centers: updated });
                    }} className="input-field text-xs" placeholder="Center name" />
                    <input type="text" value={center.logo || ''} onChange={(e) => {
                      const updated = [...strip.centers];
                      updated[i] = { ...center, logo: e.target.value };
                      onUpdate({ centers: updated });
                    }} className="input-field text-xs" placeholder="Logo URL (optional)" />
                    <input type="text" value={center.link || ''} onChange={(e) => {
                      const updated = [...strip.centers];
                      updated[i] = { ...center, link: e.target.value };
                      onUpdate({ centers: updated });
                    }} className="input-field text-xs" placeholder="Link URL (e.g. /center/1)" />
                  </div>
                </div>
                <button onClick={() => onDeleteCenter(i)} className="text-rose-500 hover:text-rose-700 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => onAddCenter({ name: 'New Center', logo: '', link: '' })}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Center
        </button>
      </div>
    </div>
  );
}
