import { useState, useEffect } from 'react';
import { getStudents, getPartners, deleteStudent } from '../../api';
import { Table, TableRow, TableCell } from '../../components/Table';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { Search, Building2, FileText, ExternalLink, Printer, Upload, CheckCircle2, FileCheck, Trash2 } from 'lucide-react';

export default function AllStudents() {
  const [students, setStudents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [selectedStudentForDoc, setSelectedStudentForDoc] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchStudents = () => {
    setLoading(true);
    getStudents({ search, partnerId: partnerFilter, limit: 200 })
      .then(res => { setStudents(res.data?.students || []); setLoading(false); })
      .catch(() => { setStudents([]); setLoading(false); });
  };

  useEffect(() => {
    getPartners().then(res => setPartners(res.data.partners || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, partnerFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, partnerFilter]);

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Kya aap student "${student.fullName}" ko permanently delete karna chahte hain?`)) {
      try {
        await deleteStudent(student._id);
        setStudents(prev => prev.filter(s => s._id !== student._id));
        fetchStudents();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete student');
      }
    }
  };

  const getCourseList = (student) => {
    if (!student || !student.courseId) return [];
    if (Array.isArray(student.courseId)) return student.courseId;
    if (typeof student.courseId === 'object') return [student.courseId];
    return [];
  };

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

  const handleOpenDocModal = (student) => {
    setSelectedStudentForDoc(student);
    setShowDocModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
          <p className="text-gray-500">Students across all partner centers with stored admission forms & receipts</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, phone, email, or application no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72">
            <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="input-field py-2 text-sm font-semibold"
            >
              <option value="">All Partner Centers</option>
              {partners.map(p => (
                <option key={p._id} value={p._id}>
                  {p.instituteName} ({p.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
            <Search className="w-8 h-8 opacity-40" />
            <span>No students found</span>
          </div>
        ) : (
          <Table headers={['Student Name', 'Phone / Email', 'Partner Center', 'Enrolled Courses', 'Docs', 'Admission Slip', 'Actions']}>
            {students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(s => (
              <TableRow key={s._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                      {s.photo ? (
                        <img
                          src={s.photo.startsWith('/uploads/') ? `/api${s.photo}` : s.photo}
                          alt={s.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target;
                            if (!img.dataset.retried && s.photo.includes('/uploads/')) {
                              img.dataset.retried = 'true';
                              const path = s.photo.substring(s.photo.indexOf('/uploads/'));
                              img.src = `/api${path}`;
                            } else if (!img.dataset.retried2 && !s.photo.startsWith('/uploads/')) {
                              img.dataset.retried2 = 'true';
                              img.src = s.photo;
                            } else {
                              img.style.display = 'none';
                              img.parentElement.querySelector('span')?.style.removeProperty('display');
                            }
                          }}
                        />
                      ) : (
                        <span className="font-extrabold text-indigo-700 text-sm">
                          {s.fullName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{s.fullName}</span>
                      {s.applicationNo && <p className="text-[11px] text-indigo-600 font-mono font-bold">{s.applicationNo}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-700">{s.phone}</p>
                    {s.email && <p className="text-gray-400">{s.email}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  {s.partnerId?.instituteName ? (
                    <div>
                      <span className="font-semibold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs inline-block">
                        🏢 {s.partnerId.instituteName}
                      </span>
                      {s.partnerId.city && <p className="text-[11px] text-gray-400 mt-0.5">{s.partnerId.city}, {s.partnerId.state}</p>}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {getCourseList(s).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {getCourseList(s).map((c, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                          {typeof c === 'object' ? (c.name || 'Course') : 'Course'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleOpenDocModal(s)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    Docs ({getAllStudentDocs(s).length})
                  </button>
                </TableCell>
                <TableCell>
                  <a
                    href={`/admission/receipt/${s.applicationNo || s._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 shadow-2xs transition-all"
                    title="View / Print Official Admission Form & Receipt"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Admission Slip</span>
                  </a>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleDeleteStudent(s)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                    title="Delete Student Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
        {!loading && students.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(students.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={students.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Super Admin Document Inspection Modal */}
      {showDocModal && selectedStudentForDoc && (
        <Modal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          title={`📂 Stored Admission Documents — ${selectedStudentForDoc.fullName}`}
          size="lg"
        >
          <div className="space-y-5 p-1">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-indigo-950 text-base">{selectedStudentForDoc.fullName}</h4>
                <p className="text-xs text-indigo-700">Phone: {selectedStudentForDoc.phone} | Application No: {selectedStudentForDoc.applicationNo || 'N/A'}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Center: {selectedStudentForDoc.partnerId?.instituteName || 'Partner Center'}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white text-indigo-800 rounded-xl border border-indigo-200">
                Total Files: {getAllStudentDocs(selectedStudentForDoc).length}
              </span>
            </div>

            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" /> Uploaded Marksheets, Photo & Identity Documents
              </h5>

              {getAllStudentDocs(selectedStudentForDoc).length === 0 ? (
                <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-2xl text-center">
                  No uploaded documents stored for this student yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getAllStudentDocs(selectedStudentForDoc).map((doc, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-850 text-xs block truncate">{doc.docName}</span>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stored in DB
                          </span>
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 flex-shrink-0"
                      >
                        View File <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setShowDocModal(false)} className="btn-secondary text-xs font-semibold px-6 py-2">
                Close Modal
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
