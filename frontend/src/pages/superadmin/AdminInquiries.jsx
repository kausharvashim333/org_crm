import { useState, useEffect } from 'react';
import { getInquiries, updateInquiryStatus, addFollowUp, deleteInquiry, getInquiryStats } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Table, TableRow, TableCell } from '../../components/Table';
import { Bell, Phone, Mail, MessageSquare, Search, BookOpen, Building, MapPin, Calendar, Layers, Trash2, Download, TrendingUp, Users, UserCheck, XCircle, Clock } from 'lucide-react';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState(null);
  const itemsPerPage = 10;
  const { showSuccess, showError } = useToast();

  const load = () => {
    setLoading(true);
    getInquiries()
      .then(res => {
        setInquiries(res.data.inquiries || []);
        setLoading(false);
      })
      .catch(() => {
        showError('Failed to load inquiries');
        setLoading(false);
      });
  };

  const loadStats = () => {
    getInquiryStats().then(res => setStats(res.data.stats)).catch(() => {});
  };

  useEffect(() => {
    load();
    loadStats();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await updateInquiryStatus(id, status);
      showSuccess(`Status updated to ${status}`);
      load();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpNote.trim()) return;
    try {
      await addFollowUp(showFollowUp._id, followUpNote);
      showSuccess('Follow-up note added');
      setFollowUpNote('');
      
      // Update follow-up modal details locally or reload
      const updatedInquiries = inquiries.map(item => {
        if (item._id === showFollowUp._id) {
          const notes = item.followUpNotes || [];
          const newNotes = [...notes, { note: followUpNote, date: new Date() }];
          const updatedItem = { ...item, followUpNotes: newNotes };
          setShowFollowUp(updatedItem);
          return updatedItem;
        }
        return item;
      });
      setInquiries(updatedInquiries);
    } catch (error) {
      showError('Failed to add note');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this inquiry permanently?')) return;
    try {
      await deleteInquiry(id);
      showSuccess('Inquiry deleted');
      load();
      loadStats();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleExport = () => {
    const headers = activeTab === 'student'
      ? ['Name', 'Phone', 'Email', 'Course Interest', 'Message', 'Status', 'Date']
      : ['Institute Name', 'Contact Name', 'Phone', 'Email', 'Location', 'Space Area', 'Message', 'Status', 'Date'];

    const rows = filtered.map(item => {
      const date = new Date(item.createdAt).toLocaleDateString();
      if (activeTab === 'student') {
        return [item.name, item.phone, item.email || '', item.courseInterest || '', (item.message || '').replace(/"/g, '""'), item.status, date];
      }
      return [item.instituteName || '', item.name, item.phone, item.email || '', item.location || '', item.spaceArea || '', (item.message || '').replace(/"/g, '""'), item.status, date];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = inquiries.filter(item => {
    // Filter by type
    if (item.type !== activeTab) return false;
    
    // Filter by status
    if (statusFilter && item.status !== statusFilter) return false;

    // Filter by search query
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchPhone = item.phone?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchInt = item.courseInterest?.toLowerCase().includes(q);
      const matchInst = item.instituteName?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchMsg || matchInt || matchInst || matchLoc;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Leads & Enquiries</h1>
          <p className="text-sm text-gray-500">Track and manage student admissions and center partnership enquiries</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 self-start md:self-auto shadow-inner">
          <button
            onClick={() => { setActiveTab('student'); setStatusFilter(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'student' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Student Admissions
          </button>
          <button
            onClick={() => { setActiveTab('partner'); setStatusFilter(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'partner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Center Partnerships
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Leads</p><p className="text-xl font-black text-slate-800">{stats.grandTotal}</p></div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Bell className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">New</p><p className="text-xl font-black text-amber-600">{(stats.student?.new || 0) + (stats.partner?.new || 0)}</p></div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Clock className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Contacted</p><p className="text-xl font-black text-indigo-600">{(stats.student?.contacted || 0) + (stats.partner?.contacted || 0)}</p></div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Converted</p><p className="text-xl font-black text-emerald-600">{(stats.student?.admitted || 0) + (stats.partner?.approved || 0)}</p></div>
          </div>
          <div className="card p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Rejected</p><p className="text-xl font-black text-red-600">{(stats.student?.rejected || 0) + (stats.partner?.rejected || 0)}</p></div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'student' 
                ? "Search by student name, phone, email, or program..." 
                : "Search by institute, contact name, location..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          {activeTab === 'student' ? (
            <>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
            </>
          ) : (
            <>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </>
          )}
        </select>
        <button onClick={handleExport} disabled={filtered.length === 0} className="btn-secondary flex items-center gap-2 text-xs py-2.5 disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center gap-2">
            <Layers className="w-8 h-8 opacity-40" />
            <span>No enquiries found matching filters</span>
          </div>
        ) : activeTab === 'student' ? (
          /* Student Enquiries Table */
          <Table headers={['Candidate Info', 'Program of Interest', 'Date Submitted', 'Status', 'Actions']}>
            {paginated.map(i => (
              <TableRow key={i._id}>
                <TableCell>
                  <div className="space-y-1 py-1">
                    <p className="font-bold text-slate-800 text-sm">{i.name}</p>
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                      <a href={`tel:${i.phone}`} className="flex items-center gap-1 hover:text-primary-600"><Phone className="w-3 h-3" />{i.phone}</a>
                      {i.email && <a href={`mailto:${i.email}`} className="flex items-center gap-1 hover:text-primary-600"><Mail className="w-3 h-3" />{i.email}</a>}
                    </div>
                    {i.message && (
                      <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 border-l-2 border-primary-500 pl-2 py-0.5 max-w-md whitespace-pre-line">
                        "{i.message}"
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-700 text-xs px-2.5 py-1 bg-slate-50 border border-slate-200/50 rounded-lg">{i.courseInterest || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(i.createdAt).toLocaleDateString()}</span>
                </TableCell>
                <TableCell>
                  <span className={`badge ${
                    i.status === 'new' ? 'badge-info' : 
                    i.status === 'admitted' ? 'badge-success' : 
                    i.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {i.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <select
                      value={i.status}
                      onChange={(e) => handleStatus(i._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="admitted">Admitted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={() => setShowFollowUp(i)}
                      className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                      title="Follow-up notes"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(i._id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        ) : (
          /* Partner Enquiries Table */
          <Table headers={['Institute & Location', 'Contact Person', 'Details', 'Status', 'Actions']}>
            {paginated.map(i => (
              <TableRow key={i._id}>
                <TableCell>
                  <div className="space-y-1 py-1">
                    <p className="font-bold text-slate-800 text-sm">{i.instituteName || 'N/A'}</p>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{i.location || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-700 text-xs">{i.name}</p>
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                      <a href={`tel:${i.phone}`} className="flex items-center gap-1 hover:text-primary-600"><Phone className="w-3 h-3" />{i.phone}</a>
                      {i.email && <a href={`mailto:${i.email}`} className="flex items-center gap-1 hover:text-primary-600"><Mail className="w-3 h-3" />{i.email}</a>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p><span className="font-semibold">Space:</span> {i.spaceArea || 'N/A'}</p>
                    {i.message && (
                      <p className="italic font-light bg-slate-50 border-l-2 border-primary-500 pl-2 py-0.5 mt-1 whitespace-pre-line">
                        "{i.message}"
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`badge ${
                    i.status === 'new' ? 'badge-info' : 
                    i.status === 'approved' ? 'badge-success' : 
                    i.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {i.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <select
                      value={i.status}
                      onChange={(e) => handleStatus(i._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button
                      onClick={() => setShowFollowUp(i)}
                      className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                      title="Follow-up notes"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(i._id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {showFollowUp && (
        <Modal isOpen={true} onClose={() => setShowFollowUp(null)} title={`Follow-up Logs: ${showFollowUp.name}`} size="md">
          <div className="space-y-4">
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {showFollowUp.followUpNotes?.map((n, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-2xl text-xs space-y-1">
                  <p className="text-slate-700 leading-relaxed">{n.note}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(n.date).toLocaleString()}</p>
                </div>
              ))}
              {(!showFollowUp.followUpNotes || showFollowUp.followUpNotes.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-6">No follow-up records registered yet.</p>
              )}
            </div>
            <form onSubmit={handleFollowUp} className="space-y-3 pt-2 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type follow-up update..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-5">Add Note</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
