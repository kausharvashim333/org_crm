import { useState, useEffect } from 'react';
import { getSuperAdminDashboard, getSecurityExport } from '../../api';
import StatCard from '../../components/StatCard';
import {
  Building2, Users, BookOpen, Briefcase, IndianRupee, Bell, Award,
  ShieldCheck, PlusCircle, Send, Download, History, ArrowRight, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = () => {
    setLoading(true);
    getSuperAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      const res = await getSecurityExport();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.backupMeta, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `system_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('System security & summary backup exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { stats, recentPartners, recentStudents, partnersByCity, monthlyRevenue, recentLogs } = data || {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = (monthlyRevenue || []).map(r => ({ name: monthNames[r._id.month - 1], revenue: r.revenue }));
  const cityData = (partnersByCity || []).slice(0, 6);
  const pieColors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

  const totalPendingActions = (stats?.pendingPartners || 0) + (stats?.pendingCerts || 0) + (stats?.pendingCourses || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Launchpad */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">High-level organization control & live analytics center</p>
        </div>
        
        {/* Quick Launchpad Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/franchises" className="btn-primary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold">
            <PlusCircle className="w-4 h-4" /> Add Partner
          </Link>
          <Link to="/admin/certificates" className="btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-600" /> Certificates
          </Link>
          <Link to="/admin/notifications" className="btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold">
            <Send className="w-4 h-4 text-blue-600" /> Broadcast
          </Link>
          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            {exporting ? 'Exporting...' : 'Backup'}
          </button>
        </div>
      </div>

      {/* Pending Approvals & Task Hub Banner */}
      {totalPendingActions > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border border-amber-300/60 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md animate-pulse">
                {totalPendingActions}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pending Administrative Approvals</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {stats?.pendingPartners || 0} Center Applications, {stats?.pendingCerts || 0} Certificates, and {stats?.pendingCourses || 0} Course Approvals waiting.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/franchises" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5">
                Review Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Active Partners" value={stats?.totalPartners || 0} color="primary" />
        <StatCard icon={Building2} label="Pending Approvals" value={stats?.pendingPartners || 0} color="yellow" />
        <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} color="green" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} color="purple" />
      </div>

      {/* Revenue Stream Breakdown Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Revenue Breakdown</p>
            <p className="text-base font-black text-slate-900">₹{(stats?.totalRevenue || 0).toLocaleString()} Total Collections</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-slate-600 font-medium">Center Affiliation Fees:</span>
            <strong className="text-blue-950 font-bold">₹{(stats?.franchiseRevenue || 0).toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-slate-600 font-medium">Course Sales & Fees:</span>
            <strong className="text-emerald-950 font-bold">₹{(stats?.courseRevenue || stats?.studentRevenue || 0).toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/70 rounded-xl border border-amber-100">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium">Royalty Collections:</span>
            <strong className="text-amber-950 font-bold">₹{(stats?.royaltyRevenue || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Projects" value={stats?.totalProjects || 0} color="indigo" />
        <StatCard icon={BookOpen} label="Total Courses" value={stats?.totalCourses || 0} color="yellow" />
        <StatCard icon={Bell} label="New Inquiries" value={stats?.totalInquiries || 0} color="red" />
        <StatCard icon={Award} label="Pending Certificates" value={stats?.pendingCerts || 0} color="yellow" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Monthly Revenue Collection</h3>
            <span className="text-xs text-slate-400 font-medium">Year {new Date().getFullYear()}</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Center Distribution by City</h3>
            <span className="text-xs text-slate-400 font-medium">Top Cities</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={cityData} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={85} label>
                {cityData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Trail & Recent Onboardings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Audit Log Feed */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-primary-600" /> Recent Administrative Activity
            </h3>
            <Link to="/admin/audit-logs" className="text-xs text-primary-600 hover:underline font-medium">View All Logs</Link>
          </div>
          {(!recentLogs || recentLogs.length === 0) ? (
            <div className="py-8 text-center text-slate-400 text-sm">No recent activity logs recorded</div>
          ) : (
            <div className="space-y-2.5">
              {recentLogs.map(log => (
                <div key={log._id} className="p-3 bg-slate-50 rounded-xl border flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{log.userName || log.userEmail || 'System'}</span>
                    <span className="text-slate-500 font-medium ml-1.5">• {log.action}</span>
                    <p className="text-slate-600 mt-0.5 truncate max-w-xs">{log.details || '-'}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Partner Centers */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Recent Partner Registrations
            </h3>
            <Link to="/admin/franchises" className="text-xs text-primary-600 hover:underline font-medium">View Centers</Link>
          </div>
          <div className="space-y-2.5">
            {(recentPartners || []).map((p) => (
              <div key={p._id} className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{p.instituteName}</p>
                  <p className="text-slate-500 mt-0.5">{p.city}, {p.state}</p>
                </div>
                <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
