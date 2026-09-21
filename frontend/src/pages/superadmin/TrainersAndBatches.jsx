import { useState, useEffect, useMemo } from 'react';
import {
  getAdminTrainers,
  createAdminTrainer,
  updateAdminTrainer,
  deleteAdminTrainer,
  getTrainerBatches,
  createAdminBatch,
  updateAdminBatch,
  deleteAdminBatch,
  getAdminCourseStudents,
  enrollStudentsToBatch,
  removeStudentFromBatch,
  getCourses,
} from '../../api';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Video,
  BookOpen,
  UserPlus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function TrainersAndBatches() {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'trainers'
  const [loading, setLoading] = useState(true);

  // Data
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('');
  const [batchCourseFilter, setBatchCourseFilter] = useState('');

  // Modals
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerForm, setTrainerForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [submittingTrainer, setSubmittingTrainer] = useState(false);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    name: '',
    courseId: '',
    trainerId: '',
    startDate: '',
    endDate: '',
    timing: '',
    schedule: '',
    mode: 'online',
    meetingLink: '',
    maxStudents: 30,
    notes: '',
    status: 'upcoming',
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Enroll Students Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedBatchForEnroll, setSelectedBatchForEnroll] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingCourseStudents, setLoadingCourseStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [enrollingStudents, setEnrollingStudents] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [trainersRes, batchesRes, coursesRes] = await Promise.all([
        getAdminTrainers(),
        getTrainerBatches(),
        getCourses({ limit: 200 }),
      ]);

      if (trainersRes.data.success) {
        setTrainers(trainersRes.data.trainers || []);
      }
      if (batchesRes.data.success) {
        setBatches(batchesRes.data.batches || []);
      }
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load trainers and batches data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.batchCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.courseId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.trainerId?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !batchStatusFilter || b.status === batchStatusFilter;
      const matchesCourse = !batchCourseFilter || b.courseId?._id === batchCourseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [batches, searchQuery, batchStatusFilter, batchCourseFilter]);

  // Filtered Trainers
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.includes(q)
      );
    });
  }, [trainers, searchQuery]);

  // Handle Trainer Create / Edit
  const handleOpenTrainerModal = (trainer = null) => {
    if (trainer) {
      setEditingTrainer(trainer);
      setTrainerForm({
        name: trainer.name || '',
        email: trainer.email || '',
        phone: trainer.phone || '',
        password: '',
      });
    } else {
      setEditingTrainer(null);
      setTrainerForm({ name: '', email: '', phone: '', password: '' });
    }
    setShowTrainerModal(true);
  };

  const handleSaveTrainer = async (e) => {
    e.preventDefault();
    setSubmittingTrainer(true);
    try {
      if (editingTrainer) {
        await updateAdminTrainer(editingTrainer._id, trainerForm);
        toast.success('Trainer updated successfully');
      } else {
        await createAdminTrainer(trainerForm);
        toast.success('Trainer created successfully. Credentials active.');
      }
      setShowTrainerModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save trainer');
    } finally {
      setSubmittingTrainer(false);
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    if (!window.confirm('Are you sure you want to delete this trainer? They will be unassigned from their batches.')) {
      return;
    }
    try {
      await deleteAdminTrainer(trainerId);
      toast.success('Trainer deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete trainer');
    }
  };

  const handleToggleTrainerActive = async (trainer) => {
    try {
      await updateAdminTrainer(trainer._id, { isActive: !trainer.isActive });
      toast.success(`Trainer marked as ${!trainer.isActive ? 'Active' : 'Inactive'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update trainer status');
    }
  };

  // Handle Batch Create / Edit
  const handleOpenBatchModal = (batch = null) => {
    if (batch) {
      setEditingBatch(batch);
      setBatchForm({
        name: batch.name || '',
        courseId: batch.courseId?._id || batch.courseId || '',
        trainerId: batch.trainerId?._id || batch.trainerId || '',
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        timing: batch.timing || '',
        schedule: batch.schedule || '',
        mode: batch.mode || 'online',
        meetingLink: batch.meetingLink || '',
        maxStudents: batch.maxStudents || 30,
        notes: batch.notes || '',
        status: batch.status || 'upcoming',
      });
    } else {
      setEditingBatch(null);
      setBatchForm({
        name: '',
        courseId: courses[0]?._id || '',
        trainerId: trainers[0]?._id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        timing: '10:00 AM - 12:00 PM',
        schedule: 'Mon, Wed, Fri',
        mode: 'online',
        meetingLink: '',
        maxStudents: 30,
        notes: '',
        status: 'upcoming',
      });
    }
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name || !batchForm.courseId || !batchForm.startDate) {
      toast.error('Please fill required fields: Batch Name, Course, and Start Date');
      return;
    }
    setSubmittingBatch(true);
    try {
      if (editingBatch) {
        await updateAdminBatch(editingBatch._id, batchForm);
        toast.success('Batch updated and trainer allotment saved');
      } else {
        await createAdminBatch(batchForm);
        toast.success('Course Batch created and allotted to trainer successfully!');
      }
      setShowBatchModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch');
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await deleteAdminBatch(batchId);
      toast.success('Batch deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete batch');
    }
  };

  // Open Enroll Students Modal for a Batch
  const handleOpenEnrollModal = async (batch) => {
    setSelectedBatchForEnroll(batch);
    setShowEnrollModal(true);
    setSelectedStudentIds([]);
    setLoadingCourseStudents(true);
    try {
      const courseId = batch.courseId?._id || batch.courseId;
      const res = await getAdminCourseStudents(courseId);
      if (res.data.success) {
        setCourseStudents(res.data.students || []);
      }
    } catch (err) {
      toast.error('Failed to load registered students for this course');
    } finally {
      setLoadingCourseStudents(false);
    }
  };

  const handleToggleStudentSelect = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleEnrollSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setEnrollingStudents(true);
    try {
      await enrollStudentsToBatch(selectedBatchForEnroll._id, selectedStudentIds);
      toast.success(`${selectedStudentIds.length} student(s) enrolled into batch!`);
      setShowEnrollModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll students');
    } finally {
      setEnrollingStudents(false);
    }
  };

  const handleRemoveStudent = async (batchId, studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName || 'student'} from this batch?`)) return;
    try {
      await removeStudentFromBatch(batchId, studentId);
      toast.success('Student removed from batch');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
              Faculty & Batches
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500">Website Courses Training</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Trainers & Batch Allotment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create faculty trainers, allot course-wise batches with live schedules, and manage enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenTrainerModal()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-indigo-600" />
            + Add Trainer
          </button>

          <button
            onClick={() => handleOpenBatchModal()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create & Allot Batch
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('batches');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'batches'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Allot Batches ({batches.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('trainers');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trainers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Trainers Directory ({trainers.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'batches' && (
            <>
              <select
                value={batchStatusFilter}
                onChange={(e) => setBatchStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active / Running</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={batchCourseFilter}
                onChange={(e) => setBatchCourseFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px] truncate"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'batches' ? 'Search batch or trainer...' : 'Search trainer name, email...'}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: BATCHES & ALLOTMENT */}
      {activeTab === 'batches' && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-xs text-slate-500">Loading course batches...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No batches match filters</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a batch for any course and assign a trainer to start live training.
              </p>
              <button
                onClick={() => handleOpenBatchModal()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Batch Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBatches.map((batch) => {
                const enrolledCount = batch.enrolledStudents?.length || 0;
                return (
                  <div
                    key={batch._id}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg truncate max-w-[200px]">
                          {batch.courseId?.name || 'Website Course'}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                            batch.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : batch.status === 'upcoming'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{batch.name}</h3>
                      <p className="text-[11px] font-mono text-slate-500">
                        {batch.batchCode || 'BATCH-001'} &bull; {batch.mode?.toUpperCase()}
                      </p>

                      {/* Allotted Trainer Box */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                            {batch.trainerId?.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {batch.trainerId?.name || (
                                <span className="text-amber-600 italic">No trainer allotted</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500">Allotted Faculty</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenBatchModal(batch)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Change
                        </button>
                      </div>

                      {/* Timings & Students */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{batch.timing || 'Timing not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {batch.schedule || 'Schedule'} &bull; Starts{' '}
                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">
                            {enrolledCount} / {batch.maxStudents || 30}
                          </span>
                          <span>Students Enrolled</span>
                        </div>
                      </div>

                      {/* Meeting Link */}
                      {batch.meetingLink && (
                        <div className="mt-3 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between gap-2 border border-emerald-100">
                          <span className="truncate text-[11px] font-medium">{batch.meetingLink}</span>
                          <a
                            href={batch.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-emerald-700 underline shrink-0"
                          >
                            Open Link
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenEnrollModal(batch)}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Manage Students ({enrolledCount})
                      </button>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenBatchModal(batch)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Batch
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch._id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRAINERS DIRECTORY */}
      {activeTab === 'trainers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Registered Trainers & Faculty ({trainers.length})
              </h3>
            </div>
            <button
              onClick={() => handleOpenTrainerModal()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Trainer
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading trainers...</p>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No trainers registered. Click "+ Add Trainer" above to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Trainer Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Allotted Batches</th>
                    <th className="py-3 px-4">Total Students</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTrainers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs">
                            {t.name?.charAt(0) || 'T'}
                          </div>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{t.email}</td>
                      <td className="py-3 px-4">{t.phone || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">
                        {t.stats?.totalBatches || 0} batches ({t.stats?.activeBatches || 0} running)
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {t.stats?.studentCount || 0} students
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleTrainerActive(t)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border ${
                            t.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {t.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenTrainerModal(t)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Trainer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrainer(t._id)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Trainer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: CREATE / EDIT TRAINER */}
      {/* ======================================================= */}
      {showTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingTrainer ? 'Edit Trainer Profile' : 'Add New Trainer'}
              </h3>
              <button onClick={() => setShowTrainerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrainer} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  placeholder="e.g. Er. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Login ID)</label>
                <input
                  type="email"
                  required
                  disabled={!!editingTrainer}
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="trainer@organization.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingTrainer ? 'New Password (leave blank to keep current)' : 'Login Password'}
                </label>
                <input
                  type="password"
                  required={!editingTrainer}
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrainerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrainer}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submittingTrainer ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: CREATE / EDIT BATCH WITH TRAINER ALLOTMENT */}
      {/* ======================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingBatch ? 'Edit Batch & Allotment' : 'Create Course Batch & Allot Trainer'}
                </h3>
                <p className="text-xs text-slate-500">Map website course training to a designated faculty trainer</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Website Course *
                </label>
                <select
                  required
                  value={batchForm.courseId}
                  onChange={(e) => setBatchForm({ ...batchForm, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. MERN Stack Morning Live Batch - Batch 01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Trainer Allotment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allot To Trainer (Faculty)
                </label>
                <select
                  value={batchForm.trainerId}
                  onChange={(e) => setBatchForm({ ...batchForm, trainerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Unassigned / Assign Later --</option>
                  {trainers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.startDate}
                    onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={batchForm.endDate}
                    onChange={(e) => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Timings</label>
                  <input
                    type="text"
                    value={batchForm.timing}
                    onChange={(e) => setBatchForm({ ...batchForm, timing: e.target.value })}
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Schedule</label>
                  <input
                    type="text"
                    value={batchForm.schedule}
                    onChange={(e) => setBatchForm({ ...batchForm, schedule: e.target.value })}
                    placeholder="e.g. Mon, Wed, Fri"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                  <select
                    value={batchForm.mode}
                    onChange={(e) => setBatchForm({ ...batchForm, mode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="online">Online Live</option>
                    <option value="offline">Classroom / Center</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Seats</label>
                  <input
                    type="number"
                    value={batchForm.maxStudents}
                    onChange={(e) => setBatchForm({ ...batchForm, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={batchForm.status}
                    onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active / Running</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Live Classroom Link (Zoom / Google Meet)
                </label>
                <input
                  type="url"
                  value={batchForm.meetingLink}
                  onChange={(e) => setBatchForm({ ...batchForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="Additional instructions for trainer and students..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submittingBatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Batch & Allotment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: MANAGE & ENROLL STUDENTS TO BATCH */}
      {/* ======================================================= */}
      {showEnrollModal && selectedBatchForEnroll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Enrolled Students &bull; {selectedBatchForEnroll.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Course: <span className="font-semibold">{selectedBatchForEnroll.courseId?.name}</span> &bull;{' '}
                  Trainer: <span className="font-semibold text-indigo-600">{selectedBatchForEnroll.trainerId?.name || 'Unassigned'}</span>
                </p>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Enrolled Students List */}
            <div className="py-3 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Currently In Batch ({selectedBatchForEnroll.enrolledStudents?.length || 0} /{' '}
                {selectedBatchForEnroll.maxStudents || 30})
              </h4>
              {(!selectedBatchForEnroll.enrolledStudents || selectedBatchForEnroll.enrolledStudents.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No students currently in this batch.</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {selectedBatchForEnroll.enrolledStudents.map((st) => (
                    <div
                      key={st._id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-xs text-slate-800 border border-slate-200"
                    >
                      <span className="font-semibold">{st.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({st.phone || st.email})</span>
                      <button
                        onClick={() => handleRemoveStudent(selectedBatchForEnroll._id, st._id, st.fullName)}
                        className="text-red-500 hover:text-red-700 ml-1 font-bold"
                        title="Remove from batch"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add More Students to Batch from Course Applicants */}
            <div className="flex-1 overflow-y-auto py-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800">
                  Students Registered for This Course (Select to Enroll)
                </h4>
                <span className="text-xs text-indigo-600 font-semibold">
                  {selectedStudentIds.length} selected
                </span>
              </div>

              {loadingCourseStudents ? (
                <div className="py-10 text-center">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading course students...</p>
                </div>
              ) : courseStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No other students found taking this course.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {courseStudents.map((st) => {
                    const isAlreadyInBatch = selectedBatchForEnroll.enrolledStudents
                      ?.map((e) => (typeof e === 'string' ? e : e._id))
                      .includes(st._id);

                    const isChecked = selectedStudentIds.includes(st._id);

                    return (
                      <div
                        key={st._id}
                        className={`p-2.5 flex items-center justify-between text-xs transition-colors ${
                          isAlreadyInBatch
                            ? 'bg-emerald-50/50 opacity-60'
                            : isChecked
                            ? 'bg-indigo-50/80'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            disabled={isAlreadyInBatch}
                            checked={isAlreadyInBatch || isChecked}
                            onChange={() => handleToggleStudentSelect(st._id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{st.fullName}</p>
                            <p className="text-[11px] text-slate-500">
                              {st.phone} &bull; {st.email}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {isAlreadyInBatch ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Already in this Batch
                            </span>
                          ) : st.batchId ? (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              In another batch
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Unassigned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Capacity: {selectedBatchForEnroll.enrolledStudents?.length || 0} /{' '}
                {selectedBatchForEnroll.maxStudents || 30} seats
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Done
                </button>
                <button
                  type="button"
                  disabled={selectedStudentIds.length === 0 || enrollingStudents}
                  onClick={handleEnrollSelectedStudents}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {enrollingStudents ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Enroll Selected ({selectedStudentIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
