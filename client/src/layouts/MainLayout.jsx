import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/common/StatusBadge';
import { Shield, Lock, Unlock, Radio } from 'lucide-react';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, stationFilter } = useAuth();

  const isStationLocked = user?.role === 'Officer' || user?.role === 'Evidence-Manager';

  return (
    <div className="min-h-screen bg-hq-bg text-hq-text flex flex-col font-sans select-none antialiased">
      {/* Top Application Bar */}
      <Header />

      {/* Role & Jurisdictional Clearance Strip */}
      <div className="bg-slate-900/90 border-b border-hq-border px-6 py-1.5 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <RoleBadge role={user?.role} />
          <span className="text-slate-300">
            Active: <strong>{user?.rank_title} {user?.first_name} {user?.last_name}</strong> (Badge #{user?.badge_number})
          </span>
          <span className="text-hq-muted">•</span>
          <span className="text-blue-400 font-medium">
            Assigned: {user?.station_name}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          {isStationLocked ? (
            <span className="text-amber-400 font-semibold flex items-center space-x-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              <Lock className="w-3 h-3" />
              <span>Precinct Boundary Enforced (ABAC Filter: Station #{user?.station_id})</span>
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold flex items-center space-x-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              <Unlock className="w-3 h-3" />
              <span>
                {stationFilter === 'all'
                  ? 'Statewide HQ Access (All Stations)'
                  : `Precinct Filter Applied (Station #${stationFilter})`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Container: Sidebar + Outlet */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-hq-bg">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
