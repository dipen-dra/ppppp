import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
        <p className="text-sm text-[#4A4A65] font-semibold animate-pulse font-mono text-xs tracking-wider">VERIFYING CREW CREDENTIALS...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If page requires superadmin privileges, redirect standard admins or users
  if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  // If page requires admin permissions and user is not admin or superadmin, push to standard user space
  if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/user/dashboard" replace />;
  }

  // If page requires standard user permissions but user is admin or superadmin, push to admin/superadmin space
  if (requiredRole === 'user' && (user.role === 'admin' || user.role === 'superadmin')) {
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;