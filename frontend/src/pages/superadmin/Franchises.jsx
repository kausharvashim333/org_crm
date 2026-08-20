import { useState, useEffect, useRef } from 'react';
import { getPartners, createPartner, updatePartner, updatePartnerStatus, deletePartner } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Table, TableRow, TableCell } from '../../components/Table';
import {
  Plus, Search, Building2, ExternalLink, Trash2, Ban, CheckCircle,
  ChevronRight, ChevronLeft, Upload, Check, User, MapPin, FileText,
  Briefcase, Image as ImageIcon, ToggleLeft, ToggleRight, Pencil, ShieldCheck, CreditCard,
  Eye, FileCheck
} from 'lucide-react';

const STEPS = [
  { label: 'Institute', icon: Building2 },
  { label: 'Owner', icon: User },
  { label: 'Location', icon: MapPin },
  { label: 'Agreement', icon: Briefcase },
  { label: 'Documents', icon: FileText },
  { label: 'Other', icon: Check },
];

const initialState = {
  instituteName: '', instituteType: 'new', tagline: '', themeColor: '#2563eb',
  ownerName: '', email: '', phone: '', alternatePhone: '', password: '',
  aadhaarNumber: '', panNumber: '',
  address: '', city: '', state: '', pincode: '', landmark: '', mapsLink: '',
  premisesType: 'rented', totalArea: '', classrooms: '1', computers: '0',
  agreementStartDate: new Date().toISOString().split('T')[0], agreementEndDate: '',
  securityDeposit: '', franchiseFee: '', paymentMode: 'yearly',
  bankAccountNumber: '', bankName: '', ifscCode: '', gstNumber: '',
  establishedYear: '', facebook: '', instagram: '', youtube: '', whatsapp: '',
  description: '',
  ref1Name: '', ref1Phone: '', ref1Relation: '',
  ref2Name: '', ref2Phone: '', ref2Relation: '',
};

export default function Franchises() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const { showSuccess, showError } = useToast();

  const load = () => {
    getPartners().then(res => { setPartners(res.data.partners); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try { await updatePartnerStatus(id, status); showSuccess(`Partner ${status}`); load(); }
    catch { showError('Failed to update status'); }
  };

  const handleToggleAdmissionForm = async (id, currentValue) => {
    try {
      await updatePartner(id, { showInAdmissionForm: !currentValue });
      showSuccess(`Admission form visibility updated!`);
      load();
    } catch {
      showError('Failed to update admission form visibility');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all partner data.')) return;
    try { await deletePartner(id); showSuccess('Partner deleted'); load(); }
    catch { showError('Failed to delete'); }
  };

  const pendingCount = partners.filter(p => p.status === 'pending').length;

  const filtered = partners.filter(p => {
    const matchesSearch =
      p.instituteName?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAffiliationRevenue = partners.reduce((sum, p) => {
    const amt = p.paymentInfo?.paidAmount !== undefined ? p.paymentInfo.paidAmount : (p.franchiseFee || 0);
    return sum + (Number(amt) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Centers</h1>
          <p className="text-sm text-gray-500">Manage all registered branch institutes & partner centers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-emerald-800 font-medium">Affiliation Revenue:</span>
            <strong className="text-sm text-emerald-950 font-black">₹{totalAffiliationRevenue.toLocaleString()}</strong>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Partner
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold animate-pulse">
              {pendingCount}
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">{pendingCount} Partnership Application(s) Awaiting Approval</p>
              <p className="text-xs text-amber-700">Click on 'Review Proposal' icon or 'Approve' to activate center access.</p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            Show Pending Only
          </button>
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({partners.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({partners.filter(p => p.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inactive ({partners.filter(p => p.status === 'inactive').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by name, city, owner..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <Table headers={['Institute', 'Owner', 'City', 'Status', 'Affiliation Fee', 'Admission Form', 'Actions']}>
            {filtered.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {p.logo ? <img src={p.logo} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                    <div>
                      <p className="font-medium">{p.instituteName}</p>
                      <p className="text-xs text-gray-400">{p.franchiseId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{p.ownerName}</TableCell>
                <TableCell>{p.city}, {p.state}</TableCell>
                 <TableCell>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : p.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 block">
                      ₹{(p.paymentInfo?.paidAmount !== undefined ? p.paymentInfo.paidAmount : (p.franchiseFee || 0)).toLocaleString()}
                    </span>
                    <span className={`inline-block px-1.5 py-0.2 text-[9px] font-black rounded uppercase ${
                      (p.paymentInfo?.paymentStatus === 'paid' || p.status === 'active')
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {(p.paymentInfo?.paymentStatus === 'paid' || p.status === 'active') ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggleAdmissionForm(p._id, p.showInAdmissionForm !== false)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                      p.showInAdmissionForm !== false
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Click to toggle showing this center in public student admission form dropdown"
                  >
                    {p.showInAdmissionForm !== false ? '✓ Show in Form' : '✕ Hidden'}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingPartner(p)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="✏️ Edit Center Profile"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <a
                      href={`/franchise/receipt/${p.franchiseId || p._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                      title="📄 View & Print Official Franchise Registration Receipt"
                    >
                      <FileCheck className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setSelectedProposal(p)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      title="👁️ Review Proposal Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {p.status === 'active' ? (
                      <a href={`/institute/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all cursor-pointer" title="🌐 View Public Website">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="p-1.5 text-gray-300"><ExternalLink className="w-4 h-4" /></span>
                    )}
                    {p.status === 'pending' ? (
                      <button onClick={() => handleStatus(p._id, 'active')} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer" title="Approve Center">
                        Approve
                      </button>
                    ) : p.status === 'active' ? (
                      <button onClick={() => handleStatus(p._id, 'inactive')} className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all cursor-pointer" title="Deactivate"><Ban className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => handleStatus(p._id, 'active')} className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all cursor-pointer" title="Activate"><CheckCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {showAdd && <AddFranchiseModal onClose={() => setShowAdd(false)} onSuccess={(msg) => { showSuccess(msg); setShowAdd(false); load(); }} onError={showError} />}

      {editingPartner && (
        <EditPartnerModal
          partner={editingPartner}
          onClose={() => setEditingPartner(null)}
          onSuccess={(msg) => { showSuccess(msg); setEditingPartner(null); load(); }}
          onError={showError}
        />
      )}

      {selectedProposal && (
        <ProposalDetailsModal
          partner={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onApprove={(id) => handleStatus(id, 'active')}
          onToggleAdmissionForm={(id, curVal) => handleToggleAdmissionForm(id, curVal)}
        />
      )}
    </div>
  );
}

function ProposalDetailsModal({ partner, onClose, onApprove, onToggleAdmissionForm }) {
  const details = partner.proposalDetails || {};

  return (
    <Modal isOpen={true} onClose={onClose} title={`Review Application: ${partner.instituteName}`}>
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-sm text-gray-700">
        
        {/* Receipt Quick Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Official Center Registration Receipt
            </p>
            <p className="text-[11px] text-emerald-700">Print or download official affiliation certificate & payment receipt</p>
          </div>
          <a
            href={`/franchise/receipt/${partner.franchiseId || partner._id}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> View Receipt ↗
          </a>
        </div>

        {/* Section 1: Basic & Owner Details */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. Applicant & Institute Info</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-semibold text-gray-500">Institute Name:</span> {partner.instituteName}</div>
            <div><span className="font-semibold text-gray-500">Center Code / ID:</span> {partner.franchiseId || partner.code || 'CENTER'}</div>
            <div><span className="font-semibold text-gray-500">Owner Name:</span> {partner.ownerName}</div>
            <div><span className="font-semibold text-gray-500">Email Address:</span> {partner.email}</div>
            <div><span className="font-semibold text-gray-500">Phone Number:</span> {partner.phone}</div>
            <div>
              {details.organizationName ? (
                <><span className="font-semibold text-gray-500">Org / Trust:</span> {details.organizationName}</>
              ) : (
                <><span className="font-semibold text-gray-500">Profession:</span> {details.profession || 'N/A'}</>
              )}
            </div>
            <div className="col-span-2"><span className="font-semibold text-gray-500">Highest Qualification:</span> {details.qualification || 'N/A'}</div>
          </div>
        </div>

        {/* Section 2: Location Details */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">2. Proposed Location</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-semibold text-gray-500">State:</span> {partner.state}</div>
            <div><span className="font-semibold text-gray-500">City/Town:</span> {partner.city}</div>
            <div><span className="font-semibold text-gray-500">Pincode:</span> {partner.pincode || 'N/A'}</div>
            <div><span className="font-semibold text-gray-500">Ownership Status:</span> {details.ownership || 'N/A'}</div>
            <div><span className="font-semibold text-gray-500">Floor Level:</span> {details.floorLevel || 'N/A'}</div>
            <div className="col-span-2"><span className="font-semibold text-gray-500">Full Address:</span> {partner.address}</div>
          </div>
        </div>

        {/* Section 3: Setup & Infrastructure Details */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Infrastructure & Setup Details</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-semibold text-gray-500">Institution Type:</span> <strong className="text-indigo-650">{details.institutionType || 'Academy'}</strong></div>
            <div><span className="font-semibold text-gray-500">Area (Sq Ft):</span> {partner.totalArea || 'N/A'} Sq Ft</div>
            <div><span className="font-semibold text-gray-500">Internet connection:</span> {details.internet || 'N/A'}</div>
            <div><span className="font-semibold text-gray-500">Power Backup:</span> {details.powerBackup || 'N/A'}</div>
            <div className="col-span-2"><span className="font-semibold text-gray-500">Previous Experience:</span> {details.experience || 'None'}</div>
          </div>

          <hr className="my-2 border-slate-200" />
          <h5 className="font-bold text-indigo-600 text-[10px] uppercase tracking-wider">Specific {details.institutionType || 'Academy'} Requirements</h5>
          
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {details.institutionType === 'Academy' && (
              <>
                <div><span className="font-semibold text-gray-500">Computers Available:</span> {partner.computers || '0'} Units</div>
                <div><span className="font-semibold text-gray-500">Number of Classrooms:</span> {details.classroomCount || '0'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">Preferred Courses:</span> {details.preferredCourses || 'None'}</div>
              </>
            )}

            {details.institutionType === 'Paramedical Training' && (
              <>
                <div><span className="font-semibold text-gray-500">Medical Instructors:</span> {details.medicalStaffCount || '0'}</div>
                <div><span className="font-semibold text-gray-500">Hospital Tie-up:</span> {details.hospitalTieUp || 'None'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">Available Lab Equipments:</span> {details.labEquipments || 'None'}</div>
              </>
            )}

            {details.institutionType === 'Computer & IT Training' && (
              <>
                <div><span className="font-semibold text-gray-500">Computers Available:</span> {partner.computers || '0'} Units</div>
                <div><span className="font-semibold text-gray-500">Internet Speed (Mbps):</span> {details.internetSpeed || 'N/A'} Mbps</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">IT Instructor:</span> {details.itInstructor || 'None'}</div>
              </>
            )}

            {details.institutionType === 'Health & Yoga Training' && (
              <>
                <div><span className="font-semibold text-gray-500">Yoga Practice Hall Area:</span> {details.yogaHallArea || '0'} Sq Ft</div>
                <div><span className="font-semibold text-gray-500">Yoga Mats Available:</span> {details.yogaMatsCount || '0'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">Certified Instructor Details:</span> {details.certifiedInstructor || 'None'}</div>
              </>
            )}

            {details.institutionType === 'Stock Market & Finance' && (
              <>
                <div><span className="font-semibold text-gray-500">Projector / Smart Display:</span> {details.projectorAvailable || 'No'}</div>
                <div><span className="font-semibold text-gray-500">Trading Screens:</span> {details.tradingTerminalsCount || '0'}</div>
              </>
            )}

            {details.institutionType === 'CGPSC & CGVYAPAM Preparation' && (
              <>
                <div><span className="font-semibold text-gray-500">Study Hall Capacity:</span> {details.seatingCapacity || '0'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">Faculty details:</span> {details.facultyExperience || 'None'}</div>
              </>
            )}

            {details.institutionType === 'Skill Development Projects' && (
              <>
                <div><span className="font-semibold text-gray-500">Govt / NGO Reg No:</span> {details.govtRegNo || 'None'}</div>
                <div><span className="font-semibold text-gray-500">Biometric Attendance:</span> {details.biometricSystem || 'No'}</div>
                <div className="col-span-2"><span className="font-semibold text-gray-500">Placement details:</span> {details.pastPlacementDetails || 'None'}</div>
              </>
            )}
          </div>
        </div>

        {/* Section 4: Business Timeline & Investment */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">4. Launch Timeline & Targets</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-semibold text-gray-500">Investment Budget:</span> {details.investment || 'N/A'}</div>
            <div><span className="font-semibold text-gray-500">Launch Timeline:</span> {details.timeline || 'N/A'}</div>
            <div className="col-span-2"><span className="font-semibold text-gray-500">Expected admissions / Targets:</span> {details.expectedAdmissions || 'N/A'}</div>
          </div>
        </div>

        {/* Section 5: Admission Form Settings */}
        <div className="bg-blue-50/70 p-4 rounded-xl space-y-2 border border-blue-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">Public Admission Form Visibility</h4>
            <p className="text-xs text-blue-700">Allow students to select this center in the Universal Online Admission Form dropdown.</p>
          </div>
          <button
            onClick={() => onToggleAdmissionForm(partner._id, partner.showInAdmissionForm !== false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              partner.showInAdmissionForm !== false
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {partner.showInAdmissionForm !== false ? '✓ Show in Admission Form' : '✕ Hide from Admission Form'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <a
            href={`/franchise/receipt/${partner.franchiseId || partner._id}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" /> Open Official Receipt ↗
          </a>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50">
              Close Review
            </button>
            {partner.status === 'pending' && (
              <button onClick={() => { onApprove(partner._id); onClose(); }} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow">
                Approve Center Application
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddFranchiseModal({ onClose, onSuccess, onError }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialState);
  const [files, setFiles] = useState({ idProof: null, institutePhoto: null, logo: null });
  const [submitting, setSubmitting] = useState(false);
  const fileRefs = { idProof: useRef(), institutePhoto: useRef(), logo: useRef() };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleFile = (key, e) => {
    if (e.target.files[0]) setFiles(prev => ({ ...prev, [key]: e.target.files[0] }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.instituteName.trim();
      case 1: return formData.ownerName.trim() && formData.email.trim() && formData.password.trim() && formData.phone.trim();
      case 2: return formData.address.trim() && formData.city.trim() && formData.state.trim();
      case 3: return formData.agreementStartDate;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => fd.append(key, formData[key]));
      if (files.idProof) fd.append('idProof', files.idProof);
      if (files.institutePhoto) fd.append('institutePhoto', files.institutePhoto);
      if (files.logo) fd.append('logo', files.logo);

      const res = await createPartner(fd);
      onSuccess(`Partner center registered! Login URL: /institute/${res.data.partner.slug}/login`);
    } catch (error) {
      onError(error.response?.data?.message || 'Failed to register partner center');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register New Partner Center" size="xl">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium ${i === step ? 'text-primary-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 rounded ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Institute Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name *</label>
                <input type="text" required value={formData.instituteName} onChange={(e) => set('instituteName', e.target.value)} className="input-field" placeholder="e.g. ABC Computer Institute" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Type</label>
                <select value={formData.instituteType} onChange={(e) => set('instituteType', e.target.value)} className="input-field">
                  <option value="new">New Institute</option>
                  <option value="existing">Existing Institute</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input type="text" value={formData.tagline} onChange={(e) => set('tagline', e.target.value)} className="input-field" placeholder="e.g. Learn Skills, Build Career" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                <input type="color" value={formData.themeColor} onChange={(e) => set('themeColor', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Logo</label>
                <div className="flex items-center gap-3">
                  {files.logo ? (
                    <img src={URL.createObjectURL(files.logo)} alt="logo" className="w-12 h-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                  )}
                  <button type="button" onClick={() => fileRefs.logo.current.click()} className="btn-secondary flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input type="file" ref={fileRefs.logo} className="hidden" accept="image/*" onChange={(e) => handleFile('logo', e)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Owner / Director Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input type="text" required value={formData.ownerName} onChange={(e) => set('ownerName', e.target.value)} className="input-field" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="text" required value={formData.phone} onChange={(e) => set('phone', e.target.value)} className="input-field" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                <input type="text" value={formData.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} className="input-field" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => set('email', e.target.value)} className="input-field" placeholder="Login email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="text" required value={formData.password} onChange={(e) => set('password', e.target.value)} className="input-field" placeholder="Login password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                <input type="text" value={formData.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value)} className="input-field" placeholder="12-digit Aadhaar" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input type="text" value={formData.panNumber} onChange={(e) => set('panNumber', e.target.value)} className="input-field" placeholder="ABCDE1234F" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Location & Infrastructure</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                <input type="text" required value={formData.address} onChange={(e) => set('address', e.target.value)} className="input-field" placeholder="Complete address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" required value={formData.city} onChange={(e) => set('city', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" required value={formData.state} onChange={(e) => set('state', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input type="text" value={formData.pincode} onChange={(e) => set('pincode', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input type="text" value={formData.landmark} onChange={(e) => set('landmark', e.target.value)} className="input-field" placeholder="Near..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input type="text" value={formData.mapsLink} onChange={(e) => set('mapsLink', e.target.value)} className="input-field" placeholder="https://maps.google.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premises Type</label>
                <select value={formData.premisesType} onChange={(e) => set('premisesType', e.target.value)} className="input-field">
                  <option value="rented">Rented</option>
                  <option value="owned">Owned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Area (sq ft)</label>
                <input type="number" value={formData.totalArea} onChange={(e) => set('totalArea', e.target.value)} className="input-field" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Classrooms</label>
                <input type="number" min="1" value={formData.classrooms} onChange={(e) => set('classrooms', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Computers</label>
                <input type="number" min="0" value={formData.computers} onChange={(e) => set('computers', e.target.value)} className="input-field" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Agreement & Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Start Date *</label>
                <input type="date" required value={formData.agreementStartDate} onChange={(e) => set('agreementStartDate', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement End Date</label>
                <input type="date" value={formData.agreementEndDate} onChange={(e) => set('agreementEndDate', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (Rs)</label>
                <input type="number" value={formData.securityDeposit} onChange={(e) => set('securityDeposit', e.target.value)} className="input-field" placeholder="e.g. 50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Fee (Rs)</label>
                <input type="number" value={formData.franchiseFee} onChange={(e) => set('franchiseFee', e.target.value)} className="input-field" placeholder="e.g. 100000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <input type="text" value="Yearly" disabled className="input-field bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input type="text" value={formData.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} className="input-field" placeholder="Optional" />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-600 mb-3">Bank Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input type="text" value={formData.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={(e) => set('bankName', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input type="text" value={formData.ifscCode} onChange={(e) => set('ifscCode', e.target.value)} className="input-field" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Documents & References</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Aadhaar / PAN)</label>
                <div className="flex items-center gap-3">
                  {files.idProof ? (
                    <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> {files.idProof.name}</span>
                  ) : (
                    <span className="text-sm text-gray-400">No file selected</span>
                  )}
                  <button type="button" onClick={() => fileRefs.idProof.current.click()} className="btn-secondary flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input type="file" ref={fileRefs.idProof} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFile('idProof', e)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Photo</label>
                <div className="flex items-center gap-3">
                  {files.institutePhoto ? (
                    <img src={URL.createObjectURL(files.institutePhoto)} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  ) : (
                    <span className="text-sm text-gray-400">No file selected</span>
                  )}
                  <button type="button" onClick={() => fileRefs.institutePhoto.current.click()} className="btn-secondary flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <input type="file" ref={fileRefs.institutePhoto} className="hidden" accept="image/*" onChange={(e) => handleFile('institutePhoto', e)} />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-600 mb-3">References</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Reference 1</p>
                  <input type="text" value={formData.ref1Name} onChange={(e) => set('ref1Name', e.target.value)} className="input-field" placeholder="Name" />
                  <input type="text" value={formData.ref1Phone} onChange={(e) => set('ref1Phone', e.target.value)} className="input-field" placeholder="Phone" />
                  <input type="text" value={formData.ref1Relation} onChange={(e) => set('ref1Relation', e.target.value)} className="input-field" placeholder="Relation" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Reference 2</p>
                  <input type="text" value={formData.ref2Name} onChange={(e) => set('ref2Name', e.target.value)} className="input-field" placeholder="Name" />
                  <input type="text" value={formData.ref2Phone} onChange={(e) => set('ref2Phone', e.target.value)} className="input-field" placeholder="Phone" />
                  <input type="text" value={formData.ref2Relation} onChange={(e) => set('ref2Relation', e.target.value)} className="input-field" placeholder="Relation" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                <input type="number" value={formData.establishedYear} onChange={(e) => set('establishedYear', e.target.value)} className="input-field" placeholder="e.g. 2020" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input type="text" value={formData.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input type="text" value={formData.facebook} onChange={(e) => set('facebook', e.target.value)} className="input-field" placeholder="Page URL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input type="text" value={formData.instagram} onChange={(e) => set('instagram', e.target.value)} className="input-field" placeholder="Profile URL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input type="text" value={formData.youtube} onChange={(e) => set('youtube', e.target.value)} className="input-field" placeholder="Channel URL" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="3" value={formData.description} onChange={(e) => set('description', e.target.value)} className="input-field" placeholder="About the institute..." />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Review Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <p><span className="font-medium">Institute:</span> {formData.instituteName || '-'}</p>
                <p><span className="font-medium">Owner:</span> {formData.ownerName || '-'}</p>
                <p><span className="font-medium">City:</span> {formData.city || '-'}</p>
                <p><span className="font-medium">Phone:</span> {formData.phone || '-'}</p>
                <p><span className="font-medium">Partner Fee:</span> Rs {formData.franchiseFee || '0'}</p>
                <p><span className="font-medium">Deposit:</span> Rs {formData.securityDeposit || '0'}</p>
                <p><span className="font-medium">Payment Mode:</span> Yearly</p>
                <p><span className="font-medium">Agreement:</span> {formData.agreementStartDate} to {formData.agreementEndDate || 'Open'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Check className="w-4 h-4" />}
            Register Partner Center
          </button>
        )}
      </div>
    </Modal>
  );
}

function EditPartnerModal({ partner, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: partner.instituteName || '',
    ownerName: partner.ownerName || '',
    email: partner.email || '',
    phone: partner.phone || '',
    alternatePhone: partner.alternatePhone || '',
    password: '',
    centerType: partner.centerType || partner.proposalDetails?.institutionType || 'Computer & IT Training',
    tagline: partner.tagline || '',
    themeColor: partner.themeColor || '#2563eb',
    
    address: partner.address || '',
    city: partner.city || '',
    state: partner.state || '',
    pincode: partner.pincode || '',
    landmark: partner.landmark || '',
    mapsLink: partner.mapsLink || '',

    totalArea: partner.totalArea || partner.proposalDetails?.spaceSqFt || '',
    classrooms: partner.classrooms || partner.proposalDetails?.classroomCount || '1',
    computers: partner.computers || partner.proposalDetails?.computers || '0',
    premisesType: partner.premisesType || 'rented',

    partnershipPlan: partner.paymentInfo?.planName || partner.proposalDetails?.partnershipPlan || 'Authorized Partner Plan',
    paidAmount: partner.paymentInfo?.paidAmount !== undefined ? partner.paymentInfo.paidAmount : (partner.franchiseFee || 0),
    paymentStatus: partner.paymentInfo?.paymentStatus || (partner.status === 'active' ? 'paid' : 'pending'),
    status: partner.status || 'active',
    showInAdmissionForm: partner.showInAdmissionForm !== false,

    bankName: partner.bankDetails?.bankName || '',
    bankAccountNumber: partner.bankDetails?.accountNumber || '',
    ifscCode: partner.bankDetails?.ifscCode || '',
    gstNumber: partner.gstNumber || '',
    description: partner.description || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        premisesType: (formData.premisesType || 'rented').toLowerCase(),
        status: (formData.status || 'active').toLowerCase(),
        totalArea: Number(formData.totalArea) || 0,
        computers: Number(formData.computers) || 0,
        classrooms: Number(formData.classrooms) || 1,
        franchiseFee: Number(formData.paidAmount) || 0,
        paymentInfo: {
          ...(partner.paymentInfo || {}),
          planName: formData.partnershipPlan,
          paidAmount: Number(formData.paidAmount) || 0,
          paymentStatus: formData.paymentStatus,
        },
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.bankAccountNumber,
          ifscCode: formData.ifscCode,
        }
      };

      if (!payload.password) {
        delete payload.password;
      }

      await updatePartner(partner._id, payload);
      onSuccess(`Center profile for "${formData.instituteName}" updated successfully!`);
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to update center profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} title={`✏️ Edit Partner Center: ${partner.franchiseId || partner.instituteName}`} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Receipt Quick Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <p className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" /> Center Affiliation & Registration Receipt
            </p>
            <p className="text-[11px] text-emerald-700">Official printable certificate & affiliation fee slip with QR code</p>
          </div>
          <a
            href={`/franchise/receipt/${partner.franchiseId || partner._id}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> View & Print Receipt ↗
          </a>
        </div>

        {/* Basic Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" /> 1. Center & Director Profile
            </h4>
            <span className="font-mono text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
              ID: {partner.franchiseId || 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Institute / Center Name *</label>
              <input
                type="text"
                required
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Center Type / Vertical</label>
              <input
                type="text"
                name="centerType"
                value={formData.centerType}
                onChange={handleChange}
                placeholder="e.g. Computer & IT Training"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Director / Owner Name *</label>
              <input
                type="text"
                required
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Registered Email *</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Reset Password (leave empty to keep unchanged)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password only if you wish to change it"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Location & Infrastructure */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> 2. Location & Infrastructure
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Address *</label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">City / District *</label>
              <input
                type="text"
                required
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">State *</label>
              <input
                type="text"
                required
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Total Space (Sq. Ft.)</label>
              <input
                type="number"
                name="totalArea"
                value={formData.totalArea}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Computers Count</label>
              <input
                type="number"
                name="computers"
                value={formData.computers}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Classrooms</label>
              <input
                type="number"
                name="classrooms"
                value={formData.classrooms}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Plan, Fee & Center Status */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> 3. Partnership Plan, Fees & Authorization Status
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Partnership Plan / Tier</label>
              <input
                type="text"
                name="partnershipPlan"
                value={formData.partnershipPlan}
                onChange={handleChange}
                placeholder="e.g. Gold - Master District Franchise"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Affiliation Fee (₹)</label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Payment Status</label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="input-field text-sm"
              >
                <option value="paid">✓ Paid (Verified)</option>
                <option value="pending">⏳ Pending Review / Pay Later</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Center Operational Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field text-sm font-bold"
              >
                <option value="active">🟢 Active (Authorized)</option>
                <option value="pending">🟡 Pending Approval</option>
                <option value="inactive">🔴 Inactive (Suspended)</option>
                <option value="terminated">⚫ Terminated</option>
              </select>
            </div>
            <div className="col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="showInAdmissionForm"
                  checked={formData.showInAdmissionForm}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Show this center in Public Student Admission Form dropdown
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
            <CreditCard className="w-4 h-4 text-indigo-600" /> 4. Bank Account Details (For Payouts)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. State Bank of India"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="Account number"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                placeholder="e.g. SBIN0001234"
                className="input-field text-sm uppercase"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Check className="w-4 h-4" />}
            Save Center Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
