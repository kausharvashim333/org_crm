import { useState, useEffect } from 'react';
import { getPartnerDashboard } from '../../api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { Users, GraduationCap, IndianRupee, UserCog, Bell, Award, Briefcase, BookOpen, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnerDashboard().then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const { stats, recentStudents, recentInquiries, monthlyRevenue, courseEnrollment } = data || {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revData = (monthlyRevenue || []).map(r => ({ name: monthNames[r._id.month - 1], revenue: r.revenue }));
  const enrollData = (courseEnrollment || []).map(c => ({ name: c.name?.substring(0, 15), students: c.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Center Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">{user?.partner?.instituteName} ({user?.partner?.centerType || 'Partner Center'})</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            to="/partner/admission"
            className="flex-1 md:flex-none btn-primary py-2.5 px-5 text-xs font-extrabold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md rounded-xl transition-all hover:scale-102"
          >
            <FileText className="w-4 h-4 text-white" /> Online Student Admission Form
          </Link>
          <a
            href={`/institute/${user?.partner?.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> View Public Homepage
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats?.totalStudents || 0} color="primary" />
        <StatCard icon={GraduationCap} label="Active Batches" value={stats?.activeBatches || 0} color="green" />
        <StatCard icon={IndianRupee} label="Monthly Collection" value={`₹${(stats?.monthlyCollection || 0).toLocaleString()}`} color="purple" />
        <StatCard icon={UserCog} label="Staff Members" value={stats?.totalStaff || 0} color="indigo" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Pending Fees" value={`₹${(stats?.pendingFees || 0).toLocaleString()}`} color="red" />
        <StatCard icon={Bell} label="New Inquiries" value={stats?.newInquiries || 0} color="yellow" />
        <StatCard icon={Award} label="Pending Certificates" value={stats?.pendingCerts || 0} color="yellow" />
        <StatCard icon={Briefcase} label="Active Projects" value={stats?.activeProjects || 0} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Course Enrollment</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={enrollData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="students" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Students</h3>
            <Link to="/partner/students" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {(recentStudents || []).map(s => (
              <div key={s._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm font-medium">{s.fullName}</p><p className="text-xs text-gray-500">{s.phone}</p></div>
                <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span>
              </div>
            ))}
            {(!recentStudents || recentStudents.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No students yet</p>}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Inquiries</h3>
            <Link to="/partner/inquiries" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {(recentInquiries || []).map(i => (
              <div key={i._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div><p className="text-sm font-medium">{i.name}</p><p className="text-xs text-gray-500">{i.phone} | {i.courseInterest || 'N/A'}</p></div>
                <span className={`badge ${i.status === 'new' ? 'badge-info' : i.status === 'admitted' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span>
              </div>
            ))}
            {(!recentInquiries || recentInquiries.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No inquiries yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
