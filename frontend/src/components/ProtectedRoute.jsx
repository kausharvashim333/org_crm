import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user || user.role !== 'super_admin') return <Navigate to="/admin/login" />;
  return children;
};

export const PartnerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user || !['partner', 'super_admin'].includes(user.role)) return <Navigate to="/partner/login" />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  return children;
};
