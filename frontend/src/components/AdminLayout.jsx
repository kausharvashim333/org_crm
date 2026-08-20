import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import SecurityAndPasswordModal from './SecurityAndPasswordModal';
import { Menu, GraduationCap } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = user?.role === 'super_admin' ? 'super_admin' : 'partner';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm truncate max-w-[180px]">
              {role === 'super_admin' ? 'Super Admin' : (user?.partner?.instituteName || 'Partner Portal')}
            </span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-semibold uppercase tracking-wider">
          {role === 'super_admin' ? 'Admin' : 'Partner'}
        </span>
      </div>

      {/* Sidebar Component */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
        <SecurityAndPasswordModal />
        {children}
      </div>
    </div>
  );
}
