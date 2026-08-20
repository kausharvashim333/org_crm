import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, createStudent, updateStudent, deleteStudent, getCourses, uploadStudentDocument } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import FilePreviewBox from '../../components/FilePreviewBox';
import {
  Plus, Search, Edit, Users, Upload, FileText, CheckCircle2, UserX, ExternalLink, BookOpen, Trash2, X, MessageSquare, GraduationCap, UserCheck, FileCheck, ShieldAlert
} from 'lucide-react';

export default function PartnerStudents() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // Modal Document Uploads state
  const [modalFiles, setModalFiles] = useState({
    photo: null,
    idProof: null,
    marksheet: null,
    courseDoc: null,
  });

  // Dropout Modal state
  const [showDropoutModal, setShowDropoutModal] = useState(false);
  const [dropoutTarget, setDropoutTarget] = useState(null);
  const [dropoutReason, setDropoutReason] = useState('');

  // Document Upload Modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedStudentForDoc, setSelectedStudentForDoc] = useState(null);
  const [uploadingDocName, setUploadingDocName] = useState('10th Marksheet');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { showSuccess, showError } = useToast();

  const getAllStudentDocs = (student) => {
    if (!student) return [];
    const list = [...(student.uploadedDocuments || [])];
    
    if (student.photo && !list.some(d => d.docName === 'Passport Photo')) {
      list.unshift({ docName: 'Passport Photo', fileUrl: student.photo });
    }
    if (student.signature && !list.some(d => d.docName === 'Student Signature')) {
      list.unshift({ docName: 'Student Signature', fileUrl: student.signature });
    }
    if (student.idProof && !list.some(d => d.docName === 'ID Proof / Aadhaar Card')) {
      list.push({ docName: 'ID Proof / Aadhaar Card', fileUrl: student.idProof });
    }
    if (student.marksheet && !list.some(d => d.docName === 'Qualification Marksheet')) {
      list.push({ docName: 'Qualification Marksheet', fileUrl: student.marksheet });
    }
    return list;
  };

  const [formData, setFormData] = useState({
    fullName: '', fatherName: '', motherName: '', dateOfBirth: '', gender: 'male', category: 'General', phone: '', email: '',
    address: '', city: '', state: '', pincode: '', qualification: '12th Pass', boardUniversity: '', passingYear: '', percentage: '',
    idProofType: 'Aadhaar Card', idProofNumber: '', guardianName: '', guardianPhone: '', status: 'active', courseId: [],
  });

  const load = () => {
    setLoading(true);
    getStudents({ search, limit: 200 })
      .then(res => { setStudents(res.data.students || []); setLoading(false); })
      .catch(() => setLoading(false));
    getCourses()
      .then(res => setCourses(res.data.courses || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let createdOrUpdatedStudentId = null;

      if (editStudent) {
        const res = await updateStudent(editStudent._id, formData);
        createdOrUpdatedStudentId = res.data.student._id;
        showSuccess('Student record updated successfully');
      } else {
        const res = await createStudent(formData);
        createdOrUpdatedStudentId = res.data.student._id;
        showSuccess('Student registered successfully');
      }

      if (createdOrUpdatedStudentId) {
        const fileEntries = [
          { key: 'photo', name: 'Passport Size Photograph' },
          { key: 'idProof', name: `${formData.idProofType || 'ID Proof'}` },
          { key: 'marksheet', name: 'Educational Marksheet' },
          { key: 'courseDoc', name: 'Course Specific Document' },
        ];

        for (const item of fileEntries) {
          const file = modalFiles[item.key];
          if (file) {
            const data = new FormData();
            data.append('document', file);
            data.append('docName', item.name);
            await uploadStudentDocument(createdOrUpdatedStudentId, data);
          }
        }
      }

      setShowAdd(false);
      setEditStudent(null);
      resetForm();
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Kya aap student "${student.fullName}" ko permanently delete karna chahte hain?`)) {
      try {
        await deleteStudent(student._id);
        setStudents(prev => prev.filter(s => s._id !== student._id));
        showSuccess('Student record deleted successfully');
        load();
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '', fatherName: '', motherName: '', dateOfBirth: '', gender: 'male', category: 'General', phone: '', email: '',
      address: '', city: '', state: '', pincode: '', qualification: '12th Pass', boardUniversity: '', passingYear: '', percentage: '',
      idProofType: 'Aadhaar Card', idProofNumber: '', guardianName: '', guardianPhone: '', status: 'active', courseId: [],
    });
    setModalFiles({ photo: null, idProof: null, marksheet: null, courseDoc: null });
  };

  const handleEdit = (s) => {
    setEditStudent(s);
    setFormData({
      fullName: s.fullName,
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
      gender: s.gender || 'male',
      category: s.category || 'General',
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      qualification: s.qualification || '12th Pass',
      boardUniversity: s.boardUniversity || '',
      passingYear: s.passingYear || '',
      percentage: s.percentage || '',
      idProofType: s.idProofType || 'Aadhaar Card',
      idProofNumber: s.idProofNumber || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      status: s.status || 'active',
      courseId: s.courseId?.map(c => c._id || c) || [],
    });
    setShowAdd(true);
  };

  const handleOpenDropoutModal = (student) => {
    setDropoutTarget(student);
    setDropoutReason(student.dropoutReason || '');
    setShowDropoutModal(true);
  };

  const handleConfirmDropout = async () => {
    if (!dropoutTarget) return;
    try {
      await updateStudent(dropoutTarget._id, {
        status: 'dropout',
        dropoutReason,
      });
      showSuccess(`Marked ${dropoutTarget.fullName} as Dropout`);
      setShowDropoutModal(false);
      setDropoutTarget(null);
      setDropoutReason('');
      load();
    } catch (error) {
      showError('Failed to mark student as dropout');
    }
  };

  const handleOpenDocModal = (student) => {
    setSelectedStudentForDoc(student);
    setDocFile(null);
    setUploadingDocName('10th Marksheet');
    setShowDocModal(true);
  };

  const handleUploadDoc = async (docName) => {
    if (!docFile) {
      showError('Please select a file to upload');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', docFile);
      fd.append('docName', docName);

      const res = await uploadStudentDocument(selectedStudentForDoc._id, fd);
      showSuccess(`Uploaded ${docName} successfully!`);
      setSelectedStudentForDoc(res.data.student);
      setDocFile(null);
      setUploadingDocName('10th Marksheet');
      load();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getCourseList = (student) => {
    if (!student || !student.courseId) return [];
    if (Array.isArray(student.courseId)) return student.courseId;
    if (typeof student.courseId === 'object') return [student.courseId];
    return [];
  };

  const filteredStudents = students.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    let matchesCourse = courseFilter === 'all';
    if (!matchesCourse) {
      const cList = getCourseList(s);
      matchesCourse = cList.some(c => (typeof c === 'object' ? (c._id || c.id) : c) === courseFilter);
    }
    return matchesStatus && matchesCourse;
  });

  const activeCount = students.filter(s => s.status === 'active').length;
  const completedCount = students.filter(s => s.status === 'completed').length;
  const dropoutCount = students.filter(s => s.status === 'dropout').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-indigo-400" /> Student Admission Directory
          </h1>
          <p className="text-xs md:text-sm text-indigo-200 mt-1">
            Manage partner student admissions, view marksheets, print application slips, & upload certificates
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/partner/admission"
            className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-950 text-xs font-black rounded-2xl shadow-xl transition-all flex items-center gap-2 hover:scale-105"
          >
            <Plus className="w-4 h-4 text-indigo-600" /> New Admission
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-black text-slate-900">{students.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Enrolled</span>
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-black text-blue-600">{completedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dropouts</span>
            <span className="text-2xl font-black text-rose-600">{dropoutCount}</span>
          </div>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === 'all' ? 'bg-white text-indigo-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === 'completed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('dropout')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === 'dropout' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dropout ({dropoutCount})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="input-field py-2 text-xs font-bold text-slate-800"
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, roll ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 pr-8 py-2 text-xs font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search ? 'No student matches your current search criteria.' : 'No student registered under this status category yet.'}
            </p>
          </div>
        ) : (
          <Table headers={['Student Candidate', 'Contact Details', 'Enrolled Course', 'Documents', 'Admission Slip', 'Status', 'Actions']}>
            {filteredStudents.map(s => {
              const studentDocs = getAllStudentDocs(s);
              const hasFullDocs = studentDocs.length >= 3;

              return (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                        {s.photo ? (
                          <img src={s.photo} alt={s.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-extrabold text-indigo-700 text-sm">
                            {s.fullName?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs">{s.fullName}</span>
                          <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-black font-mono">
                            {s.studentIdNo || s.applicationNo || 'STU-ID'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {s.fatherName ? `Father: ${s.fatherName}` : (s.email || 'No father name')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 text-xs">{s.phone || '—'}</span>
                        {s.phone && (
                          <a
                            href={`https://wa.me/91${(s.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Open WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {s.city && <p className="text-[11px] text-slate-400 font-medium">{s.city}, {s.state || ''}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCourseList(s).length > 0 ? (
                      <div className="space-y-1">
                        {getCourseList(s).map((c, idx) => (
                          <div key={idx} className="inline-block bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="font-extrabold text-slate-800 text-xs block">{typeof c === 'object' ? (c.name || 'Course') : 'Course'}</span>
                            {typeof c === 'object' && c.fee !== undefined && (
                              <span className="text-[10px] text-slate-500 font-semibold">{c.duration || 'Standard'} • ₹{c.fee}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No course assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleOpenDocModal(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                        hasFullDocs
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Docs ({studentDocs.length})
                    </button>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/admission/receipt/${s.applicationNo || s._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all"
                      title="View / Print Official Admission Slip & Receipt"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Print Slip</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        s.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : s.status === 'completed'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : s.status === 'dropout'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {s.status}
                      </span>
                      {s.status === 'dropout' && s.dropoutReason && (
                        <p className="text-[10px] text-rose-600 mt-1 italic max-w-xs font-semibold">
                          Reason: {s.dropoutReason}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-2 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                        title="Edit Student Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {s.status !== 'dropout' && (
                        <button
                          onClick={() => handleOpenDropoutModal(s)}
                          className="p-2 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg transition-colors"
                          title="Mark Course Dropout"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStudent(s)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Student Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditStudent(null); }} title={editStudent ? 'Edit Student Admission Record' : '🎓 Partner Student Admission & Registration'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <label className="block text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" /> 1. Select Enrolled Course *
              </label>
              {formData.courseId[0] && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-3 py-0.5 rounded-full">
                  Fee: ₹{courses.find(c => c._id === formData.courseId[0])?.fee || 0} | Duration: {courses.find(c => c._id === formData.courseId[0])?.duration || 'Standard'}
                </span>
              )}
            </div>
            <div>
              <select
                required
                value={formData.courseId[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, courseId: val ? [val] : [] });
                }}
                className="input-field font-semibold text-slate-800"
              >
                <option value="">-- Select Course from Dropdown --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.duration || 'Standard'}) - ₹{c.fee}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b pb-1">
              2. Student Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Student Name *</label>
                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g. Rahul Sharma" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Father's Name</label>
                <input type="text" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} placeholder="Father's Name" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mother's Name</label>
                <input type="text" value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} placeholder="Mother's Name" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gender</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="input-field">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile Phone *</label>
                <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit Mobile" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="student@example.com" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Enrolment Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field font-bold text-indigo-900">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropout">Dropout</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Academic Qualification & Identity Proof */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b pb-1">
              3. Academic Qualification & ID Proof
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Highest Qualification</label>
                <select value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} className="input-field">
                  <option value="Below 10th">Below 10th</option>
                  <option value="10th Pass">10th Pass (Matriculation)</option>
                  <option value="12th Pass">12th Pass (Intermediate)</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate">Graduate (BA / BSc / BCom / BTech)</option>
                  <option value="Post Graduate">Post Graduate (MA / MSc / MCA / MBA)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">School / Board / University</label>
                <input type="text" value={formData.boardUniversity} onChange={(e) => setFormData({ ...formData, boardUniversity: e.target.value })} placeholder="e.g. CBSE / State Board" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Passing Year & Marks %</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.passingYear} onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })} placeholder="Year" className="input-field w-1/2" />
                  <input type="text" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} placeholder="%" className="input-field w-1/2" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ID Proof Type</label>
                <select value={formData.idProofType} onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })} className="input-field">
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ID Proof Document / Card Number</label>
                <input type="text" value={formData.idProofNumber} onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })} placeholder="Enter Aadhaar / ID number" className="input-field" />
              </div>
            </div>
          </div>

          {/* Section 4: Address & Guardian Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b pb-1">
              4. Guardian Contact & Address Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Guardian / Parent Name</label>
                <input type="text" value={formData.guardianName} onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })} placeholder="Guardian Name" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Guardian Phone Number</label>
                <input type="text" value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })} placeholder="Emergency contact" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City / District</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">State</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" className="input-field" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pincode</label>
                <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} placeholder="6-digit Pincode" className="input-field" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Permanent / Residential Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="House No, Village/Locality, Post Office" className="input-field" />
              </div>
            </div>
          </div>

          {/* Section 5: Student Document Upload Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b pb-1 flex items-center justify-between">
              <span>5. Upload Student Documents</span>
              <span className="text-[10px] text-slate-500 font-normal uppercase">Photos & Certificates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  📷 Passport Size Photograph
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setModalFiles({ ...modalFiles, photo: e.target.files[0] })}
                  className="input-field text-xs py-1.5"
                />
                <FilePreviewBox
                  file={modalFiles.photo}
                  onRemove={() => setModalFiles({ ...modalFiles, photo: null })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  📄 ID Proof ({formData.idProofType || 'Aadhaar / Voter / PAN'})
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setModalFiles({ ...modalFiles, idProof: e.target.files[0] })}
                  className="input-field text-xs py-1.5"
                />
                <FilePreviewBox
                  file={modalFiles.idProof}
                  onRemove={() => setModalFiles({ ...modalFiles, idProof: null })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  🎓 Educational Marksheet (10th / 12th)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setModalFiles({ ...modalFiles, marksheet: e.target.files[0] })}
                  className="input-field text-xs py-1.5"
                />
                <FilePreviewBox
                  file={modalFiles.marksheet}
                  onRemove={() => setModalFiles({ ...modalFiles, marksheet: null })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  📎 Course Specific / Additional Document
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setModalFiles({ ...modalFiles, courseDoc: e.target.files[0] })}
                  className="input-field text-xs py-1.5"
                />
                <FilePreviewBox
                  file={modalFiles.courseDoc}
                  onRemove={() => setModalFiles({ ...modalFiles, courseDoc: null })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
            {editStudent ? 'Update Student Record & Documents' : 'Submit & Register Student'}
          </button>
        </form>
      </Modal>

      {/* Dropout Confirmation Modal */}
      {showDropoutModal && dropoutTarget && (
        <Modal isOpen={true} onClose={() => setShowDropoutModal(false)} title={`Mark Course Dropout: ${dropoutTarget.fullName}`}>
          <div className="space-y-4 text-sm text-slate-700">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Mark Student as Course Dropout
              </div>
              <p className="text-xs text-rose-700">
                Student <strong>{dropoutTarget.fullName}</strong> ({dropoutTarget.studentIdNo || dropoutTarget.phone}) ko Dropout mark kiya jaa raha hai.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dropout Reason / Remarks (Optional)</label>
              <textarea
                rows="3"
                value={dropoutReason}
                onChange={(e) => setDropoutReason(e.target.value)}
                className="input-field"
                placeholder="Describe reason for dropping out (e.g. Relocated to another city, financial issues, joined job...)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDropoutModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleConfirmDropout} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm">
                Confirm Mark Dropout
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Course Documents Modal */}
      {showDocModal && selectedStudentForDoc && (
        <Modal isOpen={true} onClose={() => setShowDocModal(false)} title={`📂 Student Admission Documents — ${selectedStudentForDoc.fullName}`} size="lg">
          <div className="space-y-6 p-1">
            {/* Student Header */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-indigo-950 text-base">{selectedStudentForDoc.fullName}</h4>
                <p className="text-xs text-indigo-700">Phone: {selectedStudentForDoc.phone} | Application No: {selectedStudentForDoc.applicationNo || 'N/A'}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white text-indigo-800 rounded-xl border border-indigo-200 shadow-2xs">
                Total Documents: {getAllStudentDocs(selectedStudentForDoc).length}
              </span>
            </div>

            {/* List of All Uploaded Documents */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" /> Stored Admission Documents & Certificates
              </h5>

              {getAllStudentDocs(selectedStudentForDoc).length === 0 ? (
                <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-2xl text-center">
                  No documents uploaded yet for this student. Use the upload option below.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAllStudentDocs(selectedStudentForDoc).map((doc, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-850 text-xs block truncate">{doc.docName}</span>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded & Stored
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Additional Document Section */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> Upload / Update New Document
              </h5>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Document Type *
                    </label>
                    <select
                      value={uploadingDocName}
                      onChange={(e) => setUploadingDocName(e.target.value)}
                      className="input-field text-xs font-bold text-slate-800 bg-white"
                    >
                      <option value="10th Marksheet">10th Marksheet</option>
                      <option value="12th Marksheet">12th Marksheet</option>
                      <option value="Graduation Marksheet">Graduation Marksheet</option>
                      <option value="Passport Photo">Passport Photo</option>
                      <option value="Student Signature">Student Signature</option>
                      <option value="ID Proof / Aadhaar Card">ID Proof / Aadhaar Card</option>
                      <option value="Other Certificate">Other Certificate</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Choose the type of document being uploaded for this student.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Choose Document File *
                    </label>
                    <input
                      type="file"
                      id="modal-doc-file-input"
                      accept="image/*,.pdf"
                      onChange={(e) => setDocFile(e.target.files[0] || null)}
                      className="hidden"
                    />

                    {!docFile ? (
                      <label
                        htmlFor="modal-doc-file-input"
                        className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 rounded-2xl cursor-pointer transition-all group text-center shadow-xs"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold text-indigo-950 group-hover:text-indigo-600 transition-colors">
                          📁 Choose File to Upload
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                          JPG, PNG, WEBP, or PDF
                        </span>
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <FilePreviewBox
                          file={docFile}
                          onRemove={() => setDocFile(null)}
                          label="Selected File to Upload"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {docFile && (
                  <div className="flex justify-end border-t border-slate-200/80 pt-3">
                    <button
                      disabled={uploading}
                      onClick={() => handleUploadDoc(uploadingDocName)}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-indigo-200" />
                      {uploading ? 'Uploading File...' : `Upload ${uploadingDocName}`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setShowDocModal(false)} className="btn-secondary text-xs font-semibold px-6 py-2">
                Close Document Portal
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
