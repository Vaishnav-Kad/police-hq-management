import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  Users,
  Archive,
  Scale,
  MapPin,
  BarChart3,
  ShieldAlert,
  Building2,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Overview & KPIs',
      icon: LayoutDashboard,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/cases',
      label: 'Case Kanban Board',
      icon: Kanban,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/firs',
      label: 'FIR Intake Ledger',
      icon: FileText,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/criminals',
      label: 'Criminal Dossiers',
      icon: Users,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/evidence',
      label: 'Malkhana Vault',
      icon: Archive,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
      highlightRole: 'Evidence-Manager',
    },
    {
      to: '/legal',
      label: 'Courts & Holding Cells',
      icon: Scale,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/map',
      label: 'Crime GIS Incident Map',
      icon: MapPin,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/analytics',
      label: 'Crime Intelligence',
      icon: BarChart3,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/stations',
      label: 'Police Stations',
      icon: Building2,
      roles: ['System-Admin'],
    },
    {
      to: '/officers',
      label: 'Police Officers',
      icon: Shield,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
    {
      to: '/audit',
      label: 'Audit & SQL Logs',
      icon: ShieldAlert,
      roles: ['System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'],
    },
  ];

  const allowedNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <aside
      className={`bg-hq-sidebar border-r border-hq-border flex flex-col transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isSpecialForUser = item.highlightRole === user?.role;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isSpecialForUser
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  collapsed ? 'mx-auto' : 'mr-3'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && isSpecialForUser && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Primary
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Collapse Toggle */}
      <div className="p-3 border-t border-hq-border flex items-center justify-between text-hq-muted text-xs">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
              Network: MahaGov Net
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Encrypted Node</span>
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition mx-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
