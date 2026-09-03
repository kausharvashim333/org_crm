import { useState, useEffect } from 'react';
import { getCourses, createStandardCourse, updateCourse, approveCourse, deleteCourse, reorderCourses, getAllCourseCategories, createCourseCategory, updateCourseCategory, deleteCourseCategory, uploadOrgImage, getAllCenterTypes, createCenterType, updateCenterType, deleteCenterType } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import ChapterManagerModal from '../../components/ChapterManagerModal';
import AIDescriptionModal from '../../components/AIDescriptionModal';
import { Plus, Check, X, Trash2, BookOpen, Video, Edit, FileText, Sparkles, ChevronUp, ChevronDown, Clock, Tag, Settings2, Image as ImageIcon, Upload, Star } from 'lucide-react';

const DEFAULT_CENTER_TYPES = ['All', 'Computer & IT Training', 'Paramedical Training', 'Health & Yoga Training', 'Skill Development Projects', 'Stock Market & Finance', 'UG & PG Courses', 'Competitive Coaching'];

const initialCourseState = {
  name: '',
  code: '',
  description: '',
  duration: '',
  durationMonths: '',
  totalHours: '',
  fee: '',
  monthlyFee: '',
  feeDisplayType: 'full',
  availableToPartners: true,
  organizationFee: '',
  studentFee: '',
  certificateFee: '',
  registrationFee: '',
  originalPrice: '',
  salePrice: '',
  category: '',
  centerType: 'All',
  image: '',
  level: 'Beginner to Advanced',
  language: 'Hindi / Hinglish',
  badge: 'Govt Certified',
  highlights: [],
  requiredDocumentsList: [
    { docName: 'Passport Photo', isCompulsory: true },
    { docName: 'Aadhaar Card', isCompulsory: true },
    { docName: '10th Marksheet', isCompulsory: true },
  ],
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedCenterFilter, setSelectedCenterFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: 'BookOpen', color: '#2563eb', order: 0 });
  const [editCat, setEditCat] = useState(null);
  const [centerTypes, setCenterTypes] = useState([]);
  const [showCTModal, setShowCTModal] = useState(false);
  const [ctForm, setCtForm] = useState({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 });
  const [editCT, setEditCT] = useState(null);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState(initialCourseState);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCompulsory, setNewDocCompulsory] = useState(true);
  const [newDocType, setNewDocType] = useState('document');
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');

  const load = () => {
    getCourses().then(res => { setCourses(res.data.courses); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadCategories = () => {
    getAllCourseCategories().then(res => { setCategories(res.data.categories || []); }).catch(() => {});
  };

  const loadCenterTypes = () => {
    getAllCenterTypes().then(res => { setCenterTypes(res.data.centerTypes || []); }).catch(() => {});
  };

  useEffect(() => { load(); loadCategories(); loadCenterTypes(); }, []);

  const handleOpenAdd = () => {
    setEditCourse(null);
    setFormData(initialCourseState);
    setShowAdd(true);
  };

  const handleEdit = (c) => {
    setEditCourse(c);
    let docs = [];
    if (Array.isArray(c.requiredDocuments) && c.requiredDocuments.length > 0) {
      docs = c.requiredDocuments.map(d => {
        if (typeof d === 'string') return { docName: d, isCompulsory: true, docType: 'document' };
        return {
          docName: d.docName || 'Document',
          isCompulsory: d.isCompulsory !== false,
          docType: d.docType || 'document',
        };
      });
    } else {
      docs = initialCourseState.requiredDocumentsList;
    }

    setFormData({
      name: c.name,
      code: c.code || '',
      description: c.description || '',
      duration: c.duration || '',
      durationMonths: c.durationMonths ? String(c.durationMonths) : '',
      totalHours: c.totalHours ? String(c.totalHours) : '',
      fee: c.studentFee || c.fee ? String(c.studentFee || c.fee) : '',
      monthlyFee: c.monthlyFee ? String(c.monthlyFee) : '',
      feeDisplayType: c.feeDisplayType || 'full',
      availableToPartners: c.availableToPartners !== false,
      organizationFee: c.organizationFee ? String(c.organizationFee) : '',
      studentFee: c.studentFee || c.fee ? String(c.studentFee || c.fee) : '',
      certificateFee: c.certificateFee ? String(c.certificateFee) : '',
      registrationFee: c.registrationFee ? String(c.registrationFee) : '',
      originalPrice: c.originalPrice ? String(c.originalPrice) : '',
      salePrice: c.salePrice ? String(c.salePrice) : '',
      category: c.category || '',
      centerType: c.centerType || 'All',
      image: c.image || '',
      level: c.level || 'Beginner to Advanced',
      language: c.language || 'Hindi / Hinglish',
      badge: c.badge || 'Govt Certified',
      highlights: c.highlights || [],
      requiredDocumentsList: docs,
    });
    setShowAdd(true);
  };

  const addDocumentItem = () => {
    if (!newDocName.trim()) return;
    setFormData(prev => ({
      ...prev,
      requiredDocumentsList: [
        ...prev.requiredDocumentsList,
        { docName: newDocName.trim(), isCompulsory: newDocCompulsory, docType: newDocType }
      ]
    }));
    setNewDocName('');
    setNewDocCompulsory(true);
    setNewDocType('document');
  };

  const removeDocumentItem = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredDocumentsList: prev.requiredDocumentsList.filter((_, i) => i !== index)
    }));
  };

  const toggleDocumentCompulsory = (index) => {
    setFormData(prev => {
      const updated = [...prev.requiredDocumentsList];
      updated[index].isCompulsory = !updated[index].isCompulsory;
      return { ...prev, requiredDocumentsList: updated };
    });
  };

  const updateDocumentType = (index, newType) => {
    setFormData(prev => {
      const updated = [...prev.requiredDocumentsList];
      updated[index].docType = newType;
      return { ...prev, requiredDocumentsList: updated };
    });
  };

  const moveDocumentItem = (index, direction) => {
    setFormData(prev => {
      const updated = [...prev.requiredDocumentsList];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;

      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      return { ...prev, requiredDocumentsList: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        durationMonths: +formData.durationMonths || 0,
        totalHours: +formData.totalHours || 0,
        fee: +formData.fee || 0,
        monthlyFee: +formData.monthlyFee || 0,
        organizationFee: +formData.organizationFee || 0,
        studentFee: +formData.studentFee || 0,
        certificateFee: +formData.certificateFee || 0,
        registrationFee: +formData.registrationFee || 0,
        originalPrice: +formData.originalPrice || 0,
        salePrice: +formData.salePrice || 0,
        highlights: formData.highlights.filter(h => h.trim()),
        requiredDocuments: formData.requiredDocumentsList,
      };
      delete payload.requiredDocumentsList;

      if (editCourse) {
        await updateCourse(editCourse._id, payload);
        showSuccess('Course updated successfully');
      } else {
        await createStandardCourse(payload);
        showSuccess('Standard course created successfully');
      }
      setShowAdd(false);
      setEditCourse(null);
      setFormData(initialCourseState);
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleApprove = async (id, status) => {
    try { await approveCourse(id, status); showSuccess(`Course ${status}`); load(); }
    catch { showError('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this course?')) return;
    try { await deleteCourse(id); showSuccess('Course deactivated'); load(); }
    catch { showError('Failed'); }
  };

  const togglePartnerAccess = async (c) => {
    try {
      await updateCourse(c._id, { availableToPartners: !c.availableToPartners });
      showSuccess(c.availableToPartners ? 'Course hidden from partners' : 'Course made available to partners');
      load();
    } catch { showError('Failed'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await uploadOrgImage(fd);
      setFormData(prev => ({ ...prev, image: res.data.imageUrl }));
      showSuccess('Course image uploaded');
    } catch { showError('Failed to upload image'); }
    finally { setUploadingImage(false); e.target.value = ''; }
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormData(prev => ({ ...prev, highlights: [...prev.highlights, newHighlight.trim()] }));
    setNewHighlight('');
  };

  const removeHighlight = (idx) => {
    setFormData(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }));
  };

  const handleReorder = async (index, direction) => {
    const visibleCourses = courses.filter(c => selectedCenterFilter === 'All' || c.centerType === selectedCenterFilter || c.centerType === 'All' || !c.centerType);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visibleCourses.length) return;
    const reordered = [...visibleCourses];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const orderedIds = reordered.map(c => c._id);
    try {
      await reorderCourses(orderedIds);
      load();
    } catch { showError('Failed to reorder'); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCat) {
        await updateCourseCategory(editCat._id, catForm);
        showSuccess('Category updated');
      } else {
        await createCourseCategory(catForm);
        showSuccess('Category created');
      }
      setShowCatModal(false);
      setEditCat(null);
      setCatForm({ name: '', description: '', icon: 'BookOpen', color: '#2563eb', order: 0 });
      loadCategories();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleCatDelete = async (id) => {
    if (!confirm('Delete this category? Courses using it will keep their text value.')) return;
    try { await deleteCourseCategory(id); showSuccess('Category deleted'); loadCategories(); }
    catch { showError('Failed'); }
  };

  const handleCatEdit = (cat) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', icon: cat.icon || 'BookOpen', color: cat.color || '#2563eb', order: cat.order || 0 });
    setShowCatModal(true);
  };

  const handleCTSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCT) {
        await updateCenterType(editCT._id, ctForm);
        showSuccess('Center type updated');
      } else {
        await createCenterType(ctForm);
        showSuccess('Center type created');
      }
      setShowCTModal(false);
      setEditCT(null);
      setCtForm({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 });
      loadCenterTypes();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save center type');
    }
  };

  const handleCTDelete = async (id) => {
    if (!confirm('Delete this center type? Courses using it will keep their text value.')) return;
    try { await deleteCenterType(id); showSuccess('Center type deleted'); loadCenterTypes(); }
    catch { showError('Failed'); }
  };

  const handleCTEdit = (ct) => {
    setEditCT(ct);
    setCtForm({ name: ct.name, description: ct.description || '', icon: ct.icon || 'Building2', color: ct.color || '#2563eb', order: ct.order || 0 });
    setShowCTModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Courses & Document Requirements</h1>
          <p className="text-gray-500">Manage standard courses, center-type verticals, video lessons, and required upload documents</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCenterFilter}
            onChange={(e) => setSelectedCenterFilter(e.target.value)}
            className="input-field py-2 text-xs font-bold text-indigo-900 border-indigo-200 bg-indigo-50/50"
          >
            <option value="All">Filter: All Center Types</option>
            {(centerTypes.length > 0 ? centerTypes : DEFAULT_CENTER_TYPES.filter(ct => ct !== 'All')).map(ct => (
              <option key={ct._id || ct} value={ct.name || ct}>{ct.name || ct}</option>
            ))}
          </select>
          <button onClick={() => { setEditCT(null); setCtForm({ name: '', description: '', icon: 'Building2', color: '#2563eb', order: 0 }); setShowCTModal(true); }} className="btn-secondary flex items-center gap-2 text-xs py-2 whitespace-nowrap">
            <Settings2 className="w-4 h-4" /> Center Types
          </button>
          <button onClick={() => { setEditCat(null); setCatForm({ name: '', description: '', icon: 'BookOpen', color: '#2563eb', order: 0 }); setShowCatModal(true); }} className="btn-secondary flex items-center gap-2 text-xs py-2 whitespace-nowrap">
            <Tag className="w-4 h-4" /> Categories
          </button>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 text-xs py-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Standard Course
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="text-center py-8 text-gray-400">Loading courses...</div> : (
          <Table headers={['Course Details', 'Duration & Vertical', 'Pricing Breakdown (3-Tier)', 'Required Documents', 'Actions & Status']}>
            {courses
              .filter(c => selectedCenterFilter === 'All' || c.centerType === selectedCenterFilter || c.centerType === 'All' || !c.centerType)
              .map((c, idx) => (
              <TableRow key={c._id}>
                {/* Column 1: Course Details */}
                <TableCell>
                  <div className="flex items-start gap-3 py-1">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleReorder(idx, 'up')}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorder(idx, 'down')}
                        disabled={idx === courses.filter(c2 => selectedCenterFilter === 'All' || c2.centerType === selectedCenterFilter || c2.centerType === 'All' || !c2.centerType).length - 1}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                        {c.code && (
                          <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {c.code}
                          </span>
                        )}
                      </div>
                      {c.category && <p className="text-xs text-slate-500 font-medium">{c.category}</p>}
                    </div>
                  </div>
                </TableCell>

                {/* Column 2: Duration & Vertical */}
                <TableCell>
                  <div className="space-y-1 py-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.duration || 'Flexible'}
                    </div>
                    <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                      {c.centerType === 'All' || !c.centerType ? '🌐 All Center Types' : c.centerType}
                    </span>
                  </div>
                </TableCell>

                {/* Column 3: 3-Tier Pricing Breakdown */}
                <TableCell>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 min-w-[170px]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">🏛️ Org Royalty:</span>
                      <span className="font-black text-indigo-700">₹{c.organizationFee || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">📜 Cert Fee:</span>
                      <span className="font-black text-blue-700">₹{c.certificateFee || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                      <span className="text-slate-900 font-extrabold flex items-center gap-1">🎓 Student Price:</span>
                      <span className="font-black text-slate-900">₹{c.studentFee || c.fee || 0}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Column 4: Required Documents */}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(() => {
                      const docs = c.requiredDocuments && c.requiredDocuments.length > 0 ? c.requiredDocuments : ['Aadhaar Card', '10th Marksheet'];
                      const visibleDocs = docs.slice(0, 2);
                      const hiddenCount = docs.length - visibleDocs.length;

                      return (
                        <>
                          {visibleDocs.map((doc, idx) => {
                            const docTitle = typeof doc === 'string' ? doc : doc.docName || 'Document';
                            const isComp = typeof doc === 'string' ? true : doc.isCompulsory !== false;
                            return (
                              <span
                                key={idx}
                                title={isComp ? `${docTitle} (Compulsory)` : `${docTitle} (Optional)`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${
                                  isComp
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isComp ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
                                <span className="truncate max-w-[85px]">{docTitle}</span>
                              </span>
                            );
                          })}
                          {hiddenCount > 0 && (
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                              +{hiddenCount} docs
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>

                {/* Column 5: Actions & Status */}
                <TableCell>
                  <div className="space-y-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`badge ${c.isStandard ? 'badge-info' : 'badge-warning'}`}>
                        {c.isStandard ? 'Standard' : 'Custom'}
                      </span>
                      <span className={`badge ${c.approvalStatus === 'approved' ? 'badge-success' : c.approvalStatus === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.approvalStatus}
                      </span>
                      {c.isStandard && (
                        <button
                          onClick={() => togglePartnerAccess(c)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            c.availableToPartners !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          }`}
                          title={c.availableToPartners !== false ? 'Click to hide from partners' : 'Click to make available to partners'}
                        >
                          {c.availableToPartners !== false ? '✓ Partners' : '✗ Partners'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setSelectedCourseId(c._id); setShowChapterModal(true); }}
                        className="btn-secondary text-xs py-1 px-2 flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                        title="Manage Chapters & Quiz"
                      >
                        <Video className="w-3.5 h-3.5" /> Chapters ({c.chapters?.length || 0})
                      </button>

                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {c.approvalStatus === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(c._id, 'approved')} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleApprove(c._id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                        </>
                      )}

                      <button onClick={() => handleDelete(c._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      <ChapterManagerModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        courseId={selectedCourseId}
        onSaved={load}
      />

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditCourse(null); }} title={editCourse ? 'Edit Course & Required Documents' : 'Add Standard Course'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Course Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. DCA - Diploma in Computer Applications" /></div>
            <div><label className="block text-sm font-medium mb-1">Course Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field" placeholder="e.g. DCA" /></div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Center Type / Vertical *</label>
              <select value={formData.centerType || 'All'} onChange={(e) => setFormData({ ...formData, centerType: e.target.value })} className="input-field bg-white font-semibold text-indigo-900 border-indigo-200">
                <option value="All">🌐 All Center Types (Global)</option>
                {(centerTypes.length > 0 ? centerTypes : DEFAULT_CENTER_TYPES.filter(ct => ct !== 'All')).map(ct => (
                  <option key={ct._id || ct} value={ct.name || ct}>{ct.name || ct}</option>
                ))}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field bg-white font-semibold text-indigo-900 border-indigo-200">
                <option value="">— Select Category —</option>
                {categories.map(cat => (<option key={cat._id} value={cat.name}>{cat.name}</option>))}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Duration *</label><input type="text" required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="input-field" placeholder="e.g. 6 Months" /></div>
            <div><label className="block text-sm font-medium mb-1">Duration (Months)</label><input type="text" inputMode="numeric" value={formData.durationMonths} onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })} className="input-field" /></div>
          </div>

          {/* Fee Display Type + Fee Input */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">Fee Display Type</label>
              <select value={formData.feeDisplayType} onChange={(e) => setFormData({ ...formData, feeDisplayType: e.target.value })} className="input-field bg-white font-bold text-slate-800 border-slate-300 text-xs">
                <option value="full">Full Fee Only</option>
                <option value="monthly">Monthly Fee Only</option>
                <option value="both">Both (Monthly + Full)</option>
              </select>
              <span className="text-[9px] text-slate-500 block mt-0.5">How fee appears on public course page</span>
            </div>
            <div>
              {formData.feeDisplayType === 'full' ? (
                <>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Full Fee (₹)</label>
                  <input type="text" inputMode="numeric" value={formData.studentFee} onChange={(e) => setFormData({ ...formData, studentFee: e.target.value, fee: e.target.value })} className="input-field bg-white font-extrabold text-slate-800 border-slate-300 text-xs" placeholder="e.g. 3500" />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Total course fee shown to students</span>
                </>
              ) : formData.feeDisplayType === 'monthly' ? (
                <>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input type="text" inputMode="numeric" value={formData.monthlyFee} onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })} className="input-field bg-white font-extrabold text-slate-800 border-slate-300 text-xs" placeholder="e.g. 1500" />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Per month EMI / installment</span>
                </>
              ) : (
                <>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input type="text" inputMode="numeric" value={formData.monthlyFee} onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })} className="input-field bg-white font-extrabold text-slate-800 border-slate-300 text-xs" placeholder="e.g. 1500" />
                  <span className="text-[9px] text-slate-500 block mt-0.5">Full fee set below in Student Fee</span>
                </>
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input type="checkbox" checked={formData.availableToPartners} onChange={(e) => setFormData({ ...formData, availableToPartners: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                Available to Partners
              </label>
              <span className="text-[10px] text-slate-500">({formData.availableToPartners ? 'Partners can see & enroll students' : 'Hidden from all partners'})</span>
            </div>
          </div>

          {/* 3-Tier Fee Section */}
          <div className="grid grid-cols-3 gap-3 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100">
            <div>
              <label className="block text-[11px] font-black text-indigo-900 mb-1 flex items-center gap-1"><span>🏛️</span> Org Wholesale Fee (₹)</label>
              <input type="text" inputMode="numeric" value={formData.organizationFee} onChange={(e) => setFormData({ ...formData, organizationFee: e.target.value })} className="input-field bg-white font-extrabold text-indigo-900 border-indigo-200 text-xs" placeholder="e.g. 500" />
              <span className="text-[9px] text-indigo-600 block mt-0.5">Franchise Royalty</span>
            </div>
            <div>
              <label className="block text-[11px] font-black text-blue-900 mb-1 flex items-center gap-1"><span>📜</span> Cert-Only Fee (₹)</label>
              <input type="text" inputMode="numeric" value={formData.certificateFee} onChange={(e) => setFormData({ ...formData, certificateFee: e.target.value })} className="input-field bg-white font-extrabold text-blue-900 border-blue-200 text-xs" placeholder="e.g. 250" />
              <span className="text-[9px] text-blue-600 block mt-0.5">Independent Cert Charge</span>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-900 mb-1 flex items-center gap-1"><span>🎓</span> Student Fee (₹)</label>
              <input type="text" inputMode="numeric" value={formData.studentFee} onChange={(e) => setFormData({ ...formData, studentFee: e.target.value, fee: e.target.value })} className="input-field bg-white font-extrabold text-slate-900 border-slate-300 text-xs" placeholder="e.g. 3500" />
              <span className="text-[9px] text-slate-500 block mt-0.5">Student Tuition Charge</span>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-600" /> Required Student Documents Config</span>
              <span className="text-[10px] text-indigo-600 font-normal">Toggle Compulsory Flag</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formData.requiredDocumentsList.map((doc, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 bg-white border rounded-xl text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" disabled={idx === 0} onClick={() => moveDocumentItem(idx, 'up')} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 p-0.5"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button type="button" disabled={idx === formData.requiredDocumentsList.length - 1} onClick={() => moveDocumentItem(idx, 'down')} className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 p-0.5"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <span className="font-semibold text-slate-800">{doc.docName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={doc.docType || 'document'} onChange={(e) => updateDocumentType(idx, e.target.value)} className="input-field text-[11px] py-1 px-2 font-semibold border-indigo-200 bg-slate-50 hover:bg-white text-indigo-900">
                      <option value="document">📄 PDF / Doc</option>
                      <option value="image">📷 Image</option>
                      <option value="id_proof">🪪 ID Proof</option>
                      <option value="any">📎 Any Format</option>
                    </select>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium text-[11px]">
                      <input type="checkbox" checked={doc.isCompulsory} onChange={() => toggleDocumentCompulsory(idx)} className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                      {doc.isCompulsory ? <span className="badge badge-danger text-[10px]">Compulsory</span> : <span className="badge badge-info text-[10px]">Optional</span>}
                    </label>
                    <button type="button" onClick={() => removeDocumentItem(idx)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="e.g. 12th Marksheet, Income Certificate" className="input-field flex-1 text-xs py-1.5" />
              <select value={newDocType} onChange={(e) => setNewDocType(e.target.value)} className="input-field text-xs py-1.5 w-36 font-semibold">
                <option value="document">📄 PDF / Doc</option>
                <option value="image">📷 Image</option>
                <option value="id_proof">🪪 ID Proof</option>
                <option value="any">📎 Any Format</option>
              </select>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={newDocCompulsory} onChange={(e) => setNewDocCompulsory(e.target.checked)} className="rounded text-indigo-600 w-3.5 h-3.5" /> Compulsory
              </label>
              <button type="button" onClick={addDocumentItem} className="btn-secondary text-xs px-3 py-2 font-semibold text-indigo-600 border-indigo-200">+ Add</button>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Course Description</label>
              <button type="button" onClick={() => setShowAIModal(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Write with AI
              </button>
            </div>
            <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field text-xs leading-relaxed" placeholder="Detailed course overview, learning outcomes, and career opportunities..." />
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-sm font-bold">
            {editCourse ? 'Update Course Details' : 'Create Standard Course'}
          </button>
        </form>
      </Modal>

      <AIDescriptionModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        courseTitle={formData.name}
        category={formData.category}
        onGenerated={(aiText) => setFormData({ ...formData, description: aiText })}
      />

      {/* Category Management Modal */}
      <Modal isOpen={showCatModal} onClose={() => { setShowCatModal(false); setEditCat(null); }} title={editCat ? 'Edit Course Category' : 'Manage Course Categories'} size="md">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Category Name *</label>
              <input type="text" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="input-field" placeholder="e.g. Paramedical, Diploma, Stock Market" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input type="text" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="input-field" placeholder="Short description (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon Name</label>
              <input type="text" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} className="input-field" placeholder="BookOpen, Heart, TrendingUp..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input type="number" value={catForm.order} onChange={(e) => setCatForm({ ...catForm, order: +e.target.value })} className="input-field" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-sm font-bold">
            {editCat ? 'Update Category' : 'Add Category'}
          </button>
        </form>

        {/* Existing Categories List */}
        <div className="mt-5 pt-4 border-t">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Existing Categories ({categories.length})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No categories yet. Create one above.</p>
            ) : categories.map(cat => (
              <div key={cat._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: cat.color || '#2563eb' }}>
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                    {cat.description && <p className="text-[10px] text-slate-500">{cat.description}</p>}
                  </div>
                  {!cat.isActive && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">INACTIVE</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleCatEdit(cat)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleCatDelete(cat._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Center Type Management Modal */}
      <Modal isOpen={showCTModal} onClose={() => { setShowCTModal(false); setEditCT(null); }} title={editCT ? 'Edit Center Type' : 'Manage Center Types'} size="md">
        <form onSubmit={handleCTSubmit} className="space-y-4">
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
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-sm font-bold">
            {editCT ? 'Update Center Type' : 'Add Center Type'}
          </button>
        </form>

        {/* Existing Center Types List */}
        <div className="mt-5 pt-4 border-t">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Existing Center Types ({centerTypes.length})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {centerTypes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No center types yet. Create one above.</p>
            ) : centerTypes.map(ct => (
              <div key={ct._id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: ct.color || '#2563eb' }}>
                    {ct.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{ct.name}</p>
                    {ct.description && <p className="text-[10px] text-slate-500">{ct.description}</p>}
                  </div>
                  {!ct.isActive && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">INACTIVE</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleCTEdit(ct)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100" title="Edit">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleCTDelete(ct._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
