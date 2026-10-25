import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-hq-bg text-white">
        <p className="text-xs text-hq-muted font-mono animate-pulse">
          Verifying security clearance credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Access Restricted: Insufficient Clearances
          </h2>
          <p className="text-xs text-hq-muted max-w-md mt-1">
            Your role (<strong className="text-blue-400">{user?.role}</strong>) does not have authorization to view this law enforcement module. This access attempt has been logged.
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-hq-border rounded-lg text-[11px] text-slate-400 font-mono">
          Required Clearances: {allowedRoles.join(' | ')}
        </div>
      </div>
    );
  }

  return children;
}
