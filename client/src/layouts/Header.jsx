import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Shield, Lock, Unlock, Radio, LogOut, UserCheck } from 'lucide-react';

export default function Header() {
  const {
    user,
    stations = [],
    stationFilter,
    setStationFilter,
    logout,
  } = useAuth();
  const { activeBolo, isConnected } = useSocket();

  // Only System-Admin can switch stations statewide; all other roles (Head-Officer, Officer, Evidence-Manager) are precinct-locked
  const isStationLocked = user?.role !== 'System-Admin';

  const roleBadgeStyle =
    user?.role === 'System-Admin'
      ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
      : user?.role === 'Head-Officer'
      ? 'bg-blue-950/80 text-blue-300 border-blue-800/80'
      : user?.role === 'Evidence-Manager'
      ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';

  return (
    <header className="bg-hq-card border-b border-hq-border px-6 py-2.5 sticky top-0 z-40 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-lg shadow-inner">
            🛡️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                Maharashtra Police Headquarters
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/60">
                PHDMS v2.0
              </span>
              {isConnected && (
                <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-hq-muted">
              Mumbai Police Commissionerate • South Zone HQ (Azad Maidan)
            </p>
          </div>
        </div>

        {/* Center: Live BOLO Alert Marquee */}
        {activeBolo && (
          <div className="hidden xl:flex items-center bg-red-950/40 border border-red-800/60 rounded-full px-4 py-1 space-x-2 text-xs text-red-300 shadow">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
            <span className="font-bold tracking-wide flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-red-400" /> BOLO BROADCAST:
            </span>
            <span className="truncate max-w-md">{activeBolo.alert_message}</span>
          </div>
        )}

        {/* Right: Station Jurisdiction & Authenticated Officer Profile */}
        <div className="flex items-center space-x-4">
          {/* Station Jurisdiction Selector */}
          <div className="flex flex-col text-right">
            <div className="flex items-center justify-end space-x-1 text-[10px] text-hq-muted font-bold uppercase tracking-wider">
              {isStationLocked ? (
                <>
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-amber-400">Jurisdiction Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-emerald-400">HQ Oversight</span>
                </>
              )}
            </div>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              disabled={isStationLocked}
              className={`bg-slate-900 border text-xs rounded px-2.5 py-1 text-slate-200 focus:outline-none transition ${
                isStationLocked
                  ? 'border-slate-800 opacity-80 cursor-not-allowed'
                  : 'border-slate-700 hover:border-blue-500 focus:border-blue-500'
              }`}
            >
              {user?.role === 'System-Admin' && (
                <option value="all">🌐 All Maharashtra Stations (Statewide HQ)</option>
              )}
              {stations.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  📍 {s.name} (Station #{s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Secure Officer Identity Badge (No Impersonation Dropdown) */}
          <div className="flex items-center space-x-3 border-l border-hq-border pl-4">
            <div className="flex flex-col text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-xs font-bold text-white">
                  {user?.rank_title ? `${user.rank_title} ` : ''}
                  {user?.first_name} {user?.last_name}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border font-mono uppercase ${roleBadgeStyle}`}>
                  {user?.role}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-2 text-[10px] text-hq-muted">
                <span className="font-mono text-blue-400 font-bold">{user?.badge_number}</span>
                <span>•</span>
                <span className="truncate max-w-[160px]">{user?.station_name || `Station #${user?.station_id}`}</span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              title="Log Out of Individual Session"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-800/80 transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
