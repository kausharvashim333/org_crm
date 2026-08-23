import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, IndianRupee, UserCog,
  Calendar, FileText, Globe, Settings, LogOut, Building2, Briefcase,
  Bell, Award, FolderOpen, ChevronDown, MessageSquare, Megaphone, Image,
  Info, BarChart3, Camera, MessageCircle, ClipboardList, MousePointerClick,
  Contact, Palette, ShieldCheck, UserCheck, History, Lock, X, ShoppingBag, Tag
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getNotifications, markAllNotificationsRead, getOrgHomepagePublic } from '../api';

export default function Sidebar({ role, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [orgSettings, setOrgSettings] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    if (user) {
      getNotifications().then(res => setNotifications(res.data.notifications)).catch(() => {});
    }
    if (role === 'super_admin') {
      getOrgHomepagePublic().then(res => setOrgSettings(res.data.homepage?.settings)).catch(() => {});
    }
  }, [user, role]);

  const handleLogout = () => {
    logout();
    navigate(role === 'super_admin' ? '/admin/login' : '/partner/login');
  };

  const adminCategories = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      links: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'Access & Roles (RBAC)',
      icon: ShieldCheck,
      links: [
        { to: '/admin/roles', icon: ShieldCheck, label: 'Roles & Permissions' },
        { to: '/admin/staff-users', icon: UserCheck, label: 'Sub-Admin Staff' },
        { to: '/admin/audit-logs', icon: History, label: 'Activity Audit Logs' },
      ],
    },
    {
      label: 'Partner Network',
      icon: Building2,
      links: [
        { to: '/admin/franchises', icon: Building2, label: 'Partner Centers' },
        { to: '/admin/homepage?section=franchise', icon: Award, label: 'Partnership Plans' },
        { to: '/admin/royalty', icon: IndianRupee, label: 'Royalty Tracker' },
      ],
    },
    {
      label: 'Course Sales & Store',
      icon: ShoppingBag,
      links: [
        { to: '/admin/orders', icon: ShoppingBag, label: 'All Orders & Invoices' },
        { to: '/admin/coupons', icon: Tag, label: 'Discount Coupons' },
      ],
    },
    {
      label: 'Academics & Content',
      icon: BookOpen,
      links: [
        { to: '/admin/all-students', icon: Users, label: 'All Enrolled Students' },
        { to: '/admin/courses', icon: BookOpen, label: 'Course Catalog' },
        { to: '/admin/materials', icon: FolderOpen, label: 'Study Materials' },
        { to: '/admin/certificates', icon: Award, label: 'Certificates' },
      ],
    },
    {
      label: 'Operations & Comms',
      icon: Briefcase,
      links: [
        { to: '/admin/projects', icon: Briefcase, label: 'Govt. Projects' },
        { to: '/admin/inquiries', icon: Bell, label: 'Global Inquiries' },
        { to: '/admin/broadcasts', icon: Megaphone, label: 'Direct Broadcasts' },
        { to: '/admin/notifications', icon: MessageSquare, label: 'Notifications' },
      ],
    },
    {
      label: 'Website CMS & Editor',
      icon: Globe,
      links: [
        { to: '/admin/homepage', icon: Globe, label: 'Website CMS & Editor' },
      ],
    },
  ];

  const partnerCategories = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      links: [
        { to: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'Students',
      icon: Users,
      links: [
        { to: '/partner/admission', icon: FileText, label: 'New Admission' },
        { to: '/partner/students', icon: Users, label: 'All Students' },
        { to: '/partner/batches', icon: Calendar, label: 'Batches' },
      ],
    },
    {
      label: 'Finance',
      icon: IndianRupee,
      links: [
        { to: '/partner/fees', icon: IndianRupee, label: 'Fees' },
      ],
    },
    {
      label: 'Academics',
      icon: BookOpen,
      links: [
        { to: '/partner/courses', icon: BookOpen, label: 'Courses' },
        { to: '/partner/attendance', icon: Calendar, label: 'Attendance' },
        { to: '/partner/exams', icon: ClipboardList, label: 'Exams & Tests' },
        { to: '/partner/certificates', icon: Award, label: 'Certificates' },
      ],
    },
    {
      label: 'Institute',
      icon: UserCog,
      links: [
        { to: '/partner/staff', icon: UserCog, label: 'Staff' },
        { to: '/partner/inquiries', icon: Bell, label: 'Inquiries' },
        { to: '/partner/homepage', icon: Globe, label: 'Edit Homepage' },
        { to: '/partner/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const categories = role === 'super_admin' ? adminCategories : partnerCategories;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getFullUrl = (l) => l.to;
  const isCategoryActive = (cat) => cat.links.some(l => (location.pathname + location.search) === getFullUrl(l));
  const isLinkActive = (to) => (location.pathname + location.search) === to;

  const toggleCategory = (label) => {
    setOpenCategory(openCategory === label ? null : label);
  };

  useEffect(() => {
    const activeCat = categories.find(c => isCategoryActive(c));
    if (activeCat) setOpenCategory(activeCat.label);
  }, [location.pathname, location.search]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {(() => {
              const logo = role === 'super_admin' ? orgSettings?.logo : user?.partner?.logo;
              if (logo && typeof logo === 'string' && logo.trim() !== '' && logo !== 'undefined') {
                return (
                  <img
                    src={logo}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    onError={(e) => {
                      const img = e.target;
                      if (!img.dataset.retried && logo.startsWith('/uploads/')) {
                        img.dataset.retried = 'true';
                        img.src = `/api${logo}`;
                      } else if (!img.dataset.retried2 && logo.includes('/uploads/')) {
                        img.dataset.retried2 = 'true';
                        const path = logo.substring(logo.indexOf('/uploads/'));
                        img.src = `/api${path}`;
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                );
              }
              return (
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              );
            })()}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold truncate">
                {role === 'super_admin' ? (orgSettings?.orgName || 'Skill India') : (user?.partner?.instituteName || 'Institute')}
              </h1>
              <p className="text-[10px] text-slate-500 truncate">{role === 'super_admin' ? 'Super Admin' : 'Partner Portal'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {categories.map((cat) => {
            const hasMultiple = cat.links.length > 1;
            const isActive = isCategoryActive(cat);
            const isOpenCat = openCategory === cat.label;

            if (!hasMultiple) {
              const link = cat.links[0];
              return (
                <Link
                  key={cat.label}
                  to={link.to}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isLinkActive(link.to)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <link.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            }

            return (
              <div key={cat.label}>
                <button
                  onClick={() => toggleCategory(cat.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <cat.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{cat.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpenCat ? 'rotate-180' : ''}`} />
                </button>
                {isOpenCat && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-2.5">
                    {cat.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => onClose?.()}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-all ${
                          isLinkActive(link.to)
                            ? 'bg-primary-600/90 text-white'
                            : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <link.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      {/* Footer */}
      <div className="px-2.5 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-medium">{unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl border max-h-80 overflow-y-auto z-50">
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={() => { markAllNotificationsRead(); setNotifications(n => n.map(x => ({...x, isRead: true}))); }} className="text-xs text-primary-600">Mark all read</button>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n._id} className={`p-3 border-b text-sm ${!n.isRead ? 'bg-blue-50' : ''}`}>
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-600/80 text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
