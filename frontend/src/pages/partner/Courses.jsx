import { useState, useEffect } from 'react';
import { getCourses, createCourse, updateCourse, updatePartnerCourseFee, deleteCourse } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import ChapterManagerModal from '../../components/ChapterManagerModal';
import AIDescriptionModal from '../../components/AIDescriptionModal';
import { Plus, Edit, Trash2, BookOpen, Video, Sparkles, DollarSign } from 'lucide-react';

export default function PartnerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showSetFeeModal, setShowSetFeeModal] = useState(null);
  const [customFeeInput, setCustomFeeInput] = useState(0);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ name: '', code: '', description: '', duration: '', durationMonths: 0, fee: 0, registrationFee: 0, category: '' });

  const load = () => { getCourses().then(res => { setCourses(res.data.courses); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) { await updateCourse(editCourse._id, formData); showSuccess('Course updated'); }
      else { await createCourse(formData); showSuccess('Course created (pending admin approval)'); }
      setShowAdd(false); setEditCourse(null);
      setFormData({ name: '', code: '', description: '', duration: '', durationMonths: 0, fee: 0, registrationFee: 0, category: '' });
      load();
    } catch (error) { showError('Failed'); }
  };

  const handleOpenSetFee = (c) => {
    setShowSetFeeModal(c);
    setCustomFeeInput(c.studentFee || c.fee || 0);
  };

  const handleSavePartnerFee = async (e) => {
    e.preventDefault();
    try {
      await updatePartnerCourseFee(showSetFeeModal._id, customFeeInput);
      showSuccess('Institute course fee updated successfully!');
      setShowSetFeeModal(null);
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update institute course fee');
    }
  };

  const handleEdit = (c) => {
    setEditCourse(c);
    setFormData({ name: c.name, code: c.code || '', description: c.description || '', duration: c.duration || '', durationMonths: c.durationMonths || 0, fee: c.fee || 0, registrationFee: c.registrationFee || 0, category: c.category || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this course?')) return;
    try { await deleteCourse(id); showSuccess('Deactivated'); load(); }
    catch (error) { showError('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Courses</h1><p className="text-gray-500">Standard & custom courses with institute pricing</p></div>
        <button onClick={() => { setEditCourse(null); setFormData({ name: '', code: '', description: '', duration: '', durationMonths: 0, fee: 0, registrationFee: 0, category: '' }); setShowAdd(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Course</button>
      </div>
      <div className="card overflow-hidden">
        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <Table headers={['Course Details', 'Duration', 'Fee & Profit Breakdown', 'Type & Status', 'Actions']}>
            {courses.map(c => {
              const studentPrice = c.studentFee || c.fee || 0;
              const centerCost = c.organizationFee || 0;
              const estProfit = Math.max(0, studentPrice - centerCost);

              return (
                <TableRow key={c._id}>
                  {/* Column 1: Course Details */}
                  <TableCell>
                    <div className="flex items-start gap-3 py-1">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
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

                  {/* Column 2: Duration */}
                  <TableCell>
                    <span className="text-xs font-bold text-slate-800">{c.duration || 'Flexible'}</span>
                  </TableCell>

                  {/* Column 3: Fee & Profit Breakdown */}
                  <TableCell>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Center Cost (Org):</span>
                        <span className="font-bold text-indigo-700">₹{centerCost}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-900 font-extrabold flex items-center gap-1">
                          Student Price:
                          {c.hasCustomPartnerFee && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">(Custom)</span>}
                        </span>
                        <span className="font-black text-slate-900">₹{studentPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                        <span className="text-emerald-700 font-extrabold">Est. Net Profit:</span>
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          +₹{estProfit}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenSetFee(c)}
                        className="w-full mt-1 py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold flex items-center justify-center gap-1 transition"
                      >
                        <span className="text-xs font-black">₹</span> Set Institute Fee
                      </button>
                    </div>
                  </TableCell>

                  {/* Column 4: Type & Status */}
                  <TableCell>
                    <div className="space-y-1 py-1">
                      <span className={`badge ${c.isStandard ? 'badge-info' : 'badge-warning'}`}>{c.isStandard ? 'Standard' : 'Custom'}</span>
                      <div><span className={`badge ${c.approvalStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>{c.approvalStatus}</span></div>
                    </div>
                  </TableCell>

                  {/* Column 5: Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 py-1">
                      <button
                        onClick={() => { setSelectedCourseId(c._id); setShowChapterModal(true); }}
                        className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                        title="Manage Video Chapters & Bilingual Assessment Quiz"
                      >
                        <Video className="w-3.5 h-3.5" /> Chapters & Quiz ({c.chapters?.length || 0})
                      </button>
                      {!c.isStandard && <button onClick={() => handleEdit(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>}
                      {!c.isStandard && <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      <ChapterManagerModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        courseId={selectedCourseId}
        onSaved={load}
      />
      <AIDescriptionModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        courseTitle={formData.name}
        category={formData.category}
        onGenerated={(aiText) => setFormData({ ...formData, description: aiText })}
      />
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditCourse(null); }} title={editCourse ? 'Edit Course' : 'Add Custom Course'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Course Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Duration *</label><input type="text" required value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Duration (Months)</label><input type="number" value={formData.durationMonths} onChange={(e) => setFormData({ ...formData, durationMonths: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Fee (₹)</label><input type="number" value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Registration Fee</label><input type="number" value={formData.registrationFee} onChange={(e) => setFormData({ ...formData, registrationFee: +e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label><input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Description</label>
              <button type="button" onClick={() => setShowAIModal(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Write with AI
              </button>
            </div>
            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">{editCourse ? 'Update' : 'Create (Pending Approval)'}</button>
        </form>
      </Modal>

      {/* Set Institute Course Fee Modal */}
      <Modal isOpen={!!showSetFeeModal} onClose={() => setShowSetFeeModal(null)} title={`Set Institute Fee - ${showSetFeeModal?.name || ''}`} size="md">
        <form onSubmit={handleSavePartnerFee} className="space-y-4">
          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex justify-between text-xs text-indigo-900 font-bold">
              <span>Organization Royalty Fee (Your Cost):</span>
              <span>₹{showSetFeeModal?.organizationFee || 0}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-700 font-medium">
              <span>Org Standard Price:</span>
              <span>₹{showSetFeeModal?.studentFee || showSetFeeModal?.fee || 0}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1">
              Your Institute Student Fee *
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <span className="text-slate-700 font-black text-lg">₹</span>
              </div>
              <input
                type="number"
                required
                min={showSetFeeModal?.organizationFee || 0}
                value={customFeeInput}
                onChange={(e) => setCustomFeeInput(+e.target.value)}
                className="input-field pl-9 bg-white font-black text-slate-900 text-xl border-indigo-300 focus:border-indigo-600 focus:ring-indigo-600"
                placeholder="4200"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              This price will be charged to students enrolling at your center. Your estimated net profit per student will be <strong className="text-emerald-600 font-bold">₹{Math.max(0, customFeeInput - (showSetFeeModal?.organizationFee || 0))}</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowSetFeeModal(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Institute Fee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
