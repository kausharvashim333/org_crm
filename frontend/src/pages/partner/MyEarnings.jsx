import { useState, useEffect } from 'react';
import { getMyEarnings, getEarningsSummary } from '../../api';
import { IndianRupee, TrendingUp, Clock, CheckCircle2, Building2, UserPlus, Wallet } from 'lucide-react';

export default function MyEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      getMyEarnings(activeTab !== 'all' ? { type: activeTab } : {}),
      getEarningsSummary(),
    ])
      .then(([earningsRes, summaryRes]) => {
        setEarnings(earningsRes.data.earnings || []);
        setSummary(summaryRes.data.summary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  const filtered = statusFilter ? earnings.filter(e => e.status === statusFilter) : earnings;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">My Earnings</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Center royalty (40%) and referral commission (20%) overview</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-indigo-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Earnings</p><p className="text-xl font-black text-slate-800">{fmt(summary.totalEarnings)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Pending</p><p className="text-xl font-black text-amber-600">{fmt(summary.pendingAmount)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">Paid</p><p className="text-xl font-black text-emerald-600">{fmt(summary.paidAmount)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-cyan-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase">This Month</p><p className="text-xl font-black text-cyan-600">{fmt(summary.thisMonthAmount)}</p></div>
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Center Royalty (40%)</p>
              <p className="text-lg font-black text-blue-600">{fmt(summary.centerRoyalty)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><UserPlus className="w-5 h-5 text-purple-600" /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Referral Commission (20%)</p>
              <p className="text-lg font-black text-purple-600">{fmt(summary.referralCommission)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'center_royalty', label: 'Center Royalty' },
            { key: 'referral_commission', label: 'Referral' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field bg-white text-slate-700 border-slate-300 text-xs rounded-xl px-3 py-2">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Earnings Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Base Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">%</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Earning</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Month</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 text-sm">No earnings found</td></tr>
              ) : filtered.map(e => (
                <tr key={e._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${e.type === 'center_royalty' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {e.type === 'center_royalty' ? <Building2 className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {e.type === 'center_royalty' ? 'Royalty' : 'Referral'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[250px] truncate">{e.description || '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-medium">{fmt(e.baseAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-bold">{e.percentage}%</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800">{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.month}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold ${e.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {e.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
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
