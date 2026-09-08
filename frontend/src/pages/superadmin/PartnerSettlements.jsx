import { useState, useEffect } from 'react';
import { getAllEarnings, settleEarnings, settleAllEarnings } from '../../api';
import { useToast } from '../../context/ToastContext';
import { IndianRupee, Clock, CheckCircle2, Building2, UserPlus, Wallet, Users, Calendar } from 'lucide-react';

export default function PartnerSettlements() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [settling, setSettling] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (monthFilter) params.month = monthFilter;
    getAllEarnings(params)
      .then(res => setData(res.data))
      .catch(() => showError('Failed to load earnings data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [typeFilter, statusFilter, monthFilter]);

  const handleSettlePartner = async (partnerId, month) => {
    setSettling(true);
    try {
      const res = await settleEarnings({ partnerId, month });
      showSuccess(res.data.message);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Settlement failed');
    } finally {
      setSettling(false);
    }
  };

  const handleSettleAll = async () => {
    if (!monthFilter) {
      return showError('Please select a month to settle all pending earnings');
    }
    setSettling(true);
    try {
      const res = await settleAllEarnings({ month: monthFilter });
      showSuccess(res.data.message);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Settlement failed');
    } finally {
      setSettling(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
  const { earnings = [], summary = {}, byPartner = [] } = data || {};

  // Generate month options (last 12 months)
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    monthOptions.push({ val, label });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Partner Settlements</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage center royalty (40%) and referral commission (20%) settlements</p>
        </div>
        <button onClick={handleSettleAll} disabled={settling || !monthFilter}
          className="btn-primary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
          <CheckCircle2 className="w-4 h-4" /> Settle All ({monthFilter || 'select month'})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-indigo-600" /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Earnings</p><p className="text-xl font-black text-slate-800">{fmt(summary.totalAmount)}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase">Pending</p><p className="text-xl font-black text-amber-600">{fmt(summary.totalPending)}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase">Settled</p><p className="text-xl font-black text-emerald-600">{fmt(summary.totalPaid)}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-600" /></div>
          <div><p className="text-[10px] font-bold text-slate-500 uppercase">Partners</p><p className="text-xl font-black text-cyan-600">{byPartner.length}</p></div>
        </div>
      </div>

      {/* Partner-wise Summary */}
      {byPartner.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="px-4 py-3 text-sm font-bold text-slate-700 border-b border-slate-100">Partner-wise Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Partner</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">City</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Royalty (40%)</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Referral (20%)</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Pending</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Paid</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byPartner.map(p => (
                  <tr key={p.partnerId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{p.instituteName}</p>
                      <p className="text-[10px] text-slate-400">{p.franchiseId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.city || '-'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-blue-600">{fmt(p.centerRoyalty)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-purple-600">{fmt(p.referralCommission)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-600">{fmt(p.pending)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-600">{fmt(p.paid)}</td>
                    <td className="px-4 py-3 text-xs font-black text-slate-800">{fmt(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field bg-white text-slate-700 border-slate-300 text-xs rounded-xl px-3 py-2">
          <option value="">All Types</option>
          <option value="center_royalty">Center Royalty</option>
          <option value="referral_commission">Referral Commission</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field bg-white text-slate-700 border-slate-300 text-xs rounded-xl px-3 py-2">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="input-field bg-white text-slate-700 border-slate-300 text-xs rounded-xl px-3 py-2">
          <option value="">All Months</option>
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      {/* Detailed Earnings Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Partner</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Base</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">%</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Month</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earnings.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-12 text-slate-400 text-sm">No earnings found</td></tr>
              ) : earnings.map(e => (
                <tr key={e._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">{e.partnerId?.instituteName || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400">{e.partnerId?.franchiseId || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${e.type === 'center_royalty' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {e.type === 'center_royalty' ? <Building2 className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {e.type === 'center_royalty' ? 'Royalty' : 'Referral'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px] truncate">{e.description || '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{fmt(e.baseAmount)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{e.percentage}%</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800">{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.month}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold ${e.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {e.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.status === 'pending' && (
                      <button onClick={() => handleSettlePartner(e.partnerId?._id, e.month)} disabled={settling}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all disabled:opacity-50">
                        Settle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
