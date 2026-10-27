import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import NewOfficerModal from '../components/officers/NewOfficerModal';
import EditOfficerModal from '../components/officers/EditOfficerModal';
import {
  Shield,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  UserCheck,
  Award,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  Users,
  Filter,
  Trash2,
  UserX,
  Edit2,
  AlertCircle,
} from 'lucide-react';

export default function OfficersPage() {
  const {
    user,
    stations = [],
    officers: globalOfficers = [],
    addOfficerToState,
    fetchOfficers: refreshGlobalOfficers,
  } = useAuth();
  const { lastSyncEvent } = useSocket();

  const [officers, setOfficers] = useState(globalOfficers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState('all');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'credentials'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Sync with global context whenever it updates without discarding locally added/commissioned officers
  useEffect(() => {
    if (globalOfficers && globalOfficers.length > 0) {
      setOfficers((prev) => {
        const uniquePrev = prev.filter(
          (p) => !globalOfficers.some((g) => g.id === p.id || g.badge_number === p.badge_number)
        );
        return [...uniquePrev, ...globalOfficers];
      });
    }
  }, [globalOfficers]);

  // Fetch live officers from backend on mount or when station changes
  const fetchLiveOfficers = async () => {
    try {
      const queryParam = selectedStation !== 'all' ? `?station_id=${selectedStation}` : '';
      const res = await api.get(`/officers${queryParam}`);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setOfficers((prev) => {
          const uniquePrev = prev.filter(
            (p) => !res.data.some((d) => d.id === p.id || d.badge_number === p.badge_number)
          );
          return [...uniquePrev, ...res.data];
        });
      }
    } catch (_) {
      // Retain current officers state
    }
  };

  useEffect(() => {
    fetchLiveOfficers();
  }, [selectedStation, user?.id]);

  // Real-time synchronization when any officer account is created, updated, or decommissioned
  useEffect(() => {
    if (lastSyncEvent && lastSyncEvent.entity === 'officers') {
      fetchLiveOfficers();
      if (refreshGlobalOfficers) refreshGlobalOfficers();
    }
  }, [lastSyncEvent]);

  const handleOfficerCreated = (newOfficer) => {
    // Reset filters to 'all' so that the newly commissioned officer is immediately visible in the active view
    setSelectedStation('all');
    setRoleFilter('all');
    setSearchTerm('');
    setActiveTab('roster');
    setOfficers((prev) => [
      newOfficer,
      ...prev.filter((o) => o.id !== newOfficer.id && o.badge_number !== newOfficer.badge_number),
    ]);
    if (addOfficerToState) addOfficerToState(newOfficer);
    if (refreshGlobalOfficers) refreshGlobalOfficers();
    setToastMessage({
      type: 'success',
      text: `Officer ${newOfficer.rank_title} ${newOfficer.first_name} ${newOfficer.last_name} (${newOfficer.badge_number}) commissioned successfully into the roster.`,
    });
    setTimeout(() => setToastMessage(null), 6000);
  };

  const getStationName = (stationId, fallbackName) => {
    if (fallbackName && !fallbackName.startsWith('Station #')) return fallbackName;
    const found = stations.find((s) => s.id === Number(stationId));
    return found ? found.name : `Station #${stationId}`;
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySlip = (officer) => {
    const memo = `=== MAHARASHTRA POLICE CREDENTIAL MEMO ===\nOfficer: ${officer.rank_title || 'Officer'} ${officer.first_name} ${officer.last_name}\nBadge / Login ID: ${officer.badge_number}\nSecurity Passcode: ${officer.initial_password || 'Officer@123'}\nAssigned Station: ${getStationName(officer.station_id, officer.station_name)}\nRole Clearance: ${officer.role}\nLogin URL: http://localhost:5173/login\n==========================================`;
    navigator.clipboard.writeText(memo);
    setCopiedId(officer.id || officer.badge_number);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const canEditOfficer = (officer) => {
    if (!user) return false;
    if (user.role === 'System-Admin') return true;
    if (user.role === 'Head-Officer') {
      return (
        officer.role !== 'System-Admin' &&
        Number(officer.station_id) === Number(user.station_id)
      );
    }
    return false;
  };

  const handleOfficerUpdated = (updatedOfficer) => {
    setOfficers((prev) =>
      prev.map((o) =>
        o.id === updatedOfficer.id || o.badge_number === updatedOfficer.badge_number
          ? { ...o, ...updatedOfficer }
          : o
      )
    );
    if (refreshGlobalOfficers) refreshGlobalOfficers();
    setToastMessage({
      type: 'success',
      text: `Officer ${updatedOfficer.rank_title} ${updatedOfficer.first_name} ${updatedOfficer.last_name} (${updatedOfficer.badge_number}) updated successfully.`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const canDecommission = (officer) => {
    if (!user) return false;
    if (String(officer.id) === String(user.id)) return false; // Cannot delete self
    if (user.role === 'System-Admin') return true;
    if (user.role === 'Head-Officer') {
      return (
        officer.role !== 'System-Admin' &&
        Number(officer.station_id) === Number(user.station_id)
      );
    }
    return false;
  };

  const handleDecommissionOfficer = async (officer) => {
    const confirmMsg = `Are you sure you want to decommission Officer ${officer.rank_title || ''} ${officer.first_name} ${officer.last_name} (${officer.badge_number}) from active service?\n\nThis will revoke their login access and duty status.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/officers/${officer.id}`);
      setOfficers((prev) => prev.filter((o) => o.id !== officer.id));
      if (refreshGlobalOfficers) refreshGlobalOfficers();
      setToastMessage({
        type: 'success',
        text: `Officer ${officer.first_name} ${officer.last_name} (${officer.badge_number}) decommissioned from service.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to decommission officer.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  // Full Department Filter (Search, Station, Role)
  const filteredOfficers = officers.filter((o) => {
    if (selectedStation !== 'all' && String(o.station_id) !== String(selectedStation)) {
      return false;
    }

    if (roleFilter !== 'all' && o.role !== roleFilter) {
      return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const stationName = getStationName(o.station_id, o.station_name).toLowerCase();
    return (
      (o.badge_number || '').toLowerCase().includes(term) ||
      (o.first_name || '').toLowerCase().includes(term) ||
      (o.last_name || '').toLowerCase().includes(term) ||
      (o.rank_title || '').toLowerCase().includes(term) ||
      (o.role || '').toLowerCase().includes(term) ||
      (o.email || '').toLowerCase().includes(term) ||
      stationName.includes(term)
    );
  });

  // Credential Ledger list (officers with accessible initial passwords)
  const credentialOfficers = filteredOfficers.filter((o) => {
    if (user?.role === 'System-Admin') return true;
    if (user?.role === 'Head-Officer' && String(o.station_id) === String(user?.station_id)) return true;
    if (String(o.created_by_officer_id) === String(user?.id)) return true;
    return Boolean(o.initial_password);
  });

  // Personnel count metrics
  const totalOfficers = filteredOfficers.length;
  const adminCount = filteredOfficers.filter((o) => o.role === 'System-Admin').length;
  const headCount = filteredOfficers.filter((o) => o.role === 'Head-Officer').length;
  const fieldCount = filteredOfficers.filter((o) => o.role === 'Officer').length;
  const evidenceCount = filteredOfficers.filter((o) => o.role === 'Evidence-Manager').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 border rounded-xl text-xs flex items-center space-x-2 shadow-lg animate-fade-in ${
            (typeof toastMessage === 'object' && toastMessage.type === 'error')
              ? 'bg-red-950/80 border-red-800 text-red-200'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}
        >
          {typeof toastMessage === 'object' && toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span className="font-semibold">
            {typeof toastMessage === 'object' ? toastMessage.text : toastMessage}
          </span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span>Maharashtra Police Personnel & Officer Directory</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Official Cadre of Commissioned Police Officers, Ranks, Stations & Department Clearance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Commission New Officer Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Commission New Officer</span>
          </button>
        </div>
      </div>

      {/* Personnel Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-hq-card border border-hq-border rounded-xl p-3.5 shadow-sm">
          <p className="text-[10px] text-hq-muted font-bold uppercase tracking-wider">Total Commissioned</p>
          <p className="text-xl font-bold text-white font-mono mt-1">{totalOfficers}</p>
        </div>
        <div className="bg-hq-card border border-purple-800/40 rounded-xl p-3.5 shadow-sm">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">HQ Admins</p>
          <p className="text-xl font-bold text-purple-300 font-mono mt-1">{adminCount}</p>
        </div>
        <div className="bg-hq-card border border-blue-800/40 rounded-xl p-3.5 shadow-sm">
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Precinct Heads</p>
          <p className="text-xl font-bold text-blue-300 font-mono mt-1">{headCount}</p>
        </div>
        <div className="bg-hq-card border border-emerald-800/40 rounded-xl p-3.5 shadow-sm">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Field Officers</p>
          <p className="text-xl font-bold text-emerald-300 font-mono mt-1">{fieldCount}</p>
        </div>
        <div className="bg-hq-card border border-amber-800/40 rounded-xl p-3.5 shadow-sm">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Vault Custodians</p>
          <p className="text-xl font-bold text-amber-300 font-mono mt-1">{evidenceCount}</p>
        </div>
      </div>

      {/* View Tabs & Comprehensive Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-hq-card border border-hq-border p-3.5 rounded-xl">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personnel Roster ({filteredOfficers.length})</span>
          </button>

          {(user?.role === 'System-Admin' || user?.role === 'Head-Officer') && (
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Credential Handover Ledger</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                {credentialOfficers.length}
              </span>
            </button>
          )}
        </div>

        {/* Station Filter, Role Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Station Jurisdiction Selector */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">🌐 All Maharashtra Police Stations</option>
            {stations.map((s) => (
              <option key={s.id} value={String(s.id)}>
                📍 {s.name}
              </option>
            ))}
          </select>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 text-[11px]">
            {['all', 'System-Admin', 'Head-Officer', 'Officer', 'Evidence-Manager'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  roleFilter === role
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                    : 'bg-slate-950/40 text-slate-400 hover:text-white'
                }`}
              >
                {role === 'all' ? 'All Roles' : role}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2 text-hq-muted" />
            <input
              type="text"
              placeholder="Search badge, name, rank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: PERSONNEL ROSTER TABLE */}
      {activeTab === 'roster' && (
        <div className="bg-hq-card border border-hq-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-hq-muted uppercase font-mono text-[11px] border-b border-hq-border">
                <tr>
                  <th className="p-3.5">Service Badge (Login ID)</th>
                  <th className="p-3.5">Officer Name</th>
                  <th className="p-3.5">Rank Title</th>
                  <th className="p-3.5">Assigned Precinct Station</th>
                  <th className="p-3.5">Role Clearance</th>
                  <th className="p-3.5">Contact Particulars</th>
                  <th className="p-3.5 text-right">Duty Status & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hq-border text-slate-300">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-hq-muted">
                      No police personnel found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((officer) => {
                    const isActiveUser =
                      String(user?.id) === String(officer.id) ||
                      user?.badge_number === officer.badge_number;

                    const roleBadgeClass =
                      officer.role === 'System-Admin'
                        ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                        : officer.role === 'Head-Officer'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                        : officer.role === 'Evidence-Manager'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60';

                    return (
                      <tr
                        key={officer.id || officer.badge_number}
                        className={`hover:bg-slate-900/40 transition ${
                          isActiveUser ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5 font-mono font-bold text-blue-400">
                          <div>{officer.badge_number}</div>
                          {officer.id_proof_number && (
                            <div className="text-[10px] text-slate-500 font-normal">{officer.id_proof_number}</div>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center space-x-2">
                            <span>{officer.first_name} {officer.last_name}</span>
                            {officer.blood_group && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800/80">
                                {officer.blood_group}
                              </span>
                            )}
                            {isActiveUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                                YOU
                              </span>
                            )}
                          </div>
                          {officer.emergency_contact && (
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate max-w-[200px]">
                              Emerg: {officer.emergency_contact}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          <div>{officer.rank_title || 'Police Officer'}</div>
                          {officer.joining_date && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Joined: {new Date(officer.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-hq-muted shrink-0" />
                            <span className="truncate max-w-[240px] font-medium text-white">
                              {getStationName(officer.station_id, officer.station_name)}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center space-x-1">
                            <span>✓ Lockup & Malkhana Vault Clearance</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${roleBadgeClass}`}>
                            {officer.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          <div>{officer.email || `${(officer.badge_number || '').toLowerCase()}@mahapolice.gov.in`}</div>
                          <div className="text-[10px] text-hq-muted">{officer.phone || '+91 98200 00000'}</div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-[11px] font-semibold border border-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Active Duty</span>
                            </span>
                            {canEditOfficer(officer) && (
                              <button
                                type="button"
                                onClick={() => setEditingOfficer(officer)}
                                title="Update Officer Record & Clearance"
                                className="px-2 py-1 rounded bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 hover:text-white border border-blue-800/80 transition shadow-sm flex items-center space-x-1 text-[11px] font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Edit</span>
                              </button>
                            )}
                            {canDecommission(officer) && (
                              <button
                                type="button"
                                onClick={() => handleDecommissionOfficer(officer)}
                                title="Decommission Officer from Active Service"
                                className="px-2 py-1 rounded bg-red-950/70 hover:bg-red-900/90 text-red-300 hover:text-white border border-red-800/80 transition shadow-sm flex items-center space-x-1 text-[11px] font-medium"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Decommission</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIAL HANDOVER LEDGER (System-Admin & Head-Officers) */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          {/* Explanatory Notice */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-start space-x-3 text-xs">
            <Key className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">
                Official Law Enforcement Credential Handover Ledger
              </h4>
              <p className="text-slate-300 leading-relaxed">
                This secure register displays the official Login ID (Badge Number) and initial security passcodes for officers commissioned under your jurisdiction.
                As the commanding officer or administrator, use this page to view and copy credentials so you can inform new officers of their individual logins.
                Officers must sign in individually on the login portal. Direct account switching between officers is prohibited.
              </p>
            </div>
          </div>

          <div className="bg-hq-card border border-hq-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-hq-muted uppercase font-mono text-[11px] border-b border-hq-border">
                  <tr>
                    <th className="p-3.5">Officer Login ID (Badge #)</th>
                    <th className="p-3.5">Officer Name & Rank</th>
                    <th className="p-3.5">Precinct Station</th>
                    <th className="p-3.5">Clearance Role</th>
                    <th className="p-3.5">Initial Security Passcode</th>
                    <th className="p-3.5 text-right">Handover Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hq-border text-slate-300 font-mono">
                  {credentialOfficers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-hq-muted font-sans">
                        No commissioned officer credentials found in your jurisdiction.
                      </td>
                    </tr>
                  ) : (
                    credentialOfficers.map((officer) => {
                      const officerId = officer.id || officer.badge_number;
                      const isRevealed = Boolean(revealedPasswords[officerId]);
                      const passwordText = officer.initial_password || 'Officer@123';
                      const isCopied = copiedId === officerId;

                      const roleBadgeClass =
                        officer.role === 'System-Admin'
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                          : officer.role === 'Head-Officer'
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                          : officer.role === 'Evidence-Manager'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60';

                      return (
                        <tr key={officerId} className="hover:bg-slate-900/40 transition">
                          <td className="p-3.5 font-bold text-blue-400 text-sm">
                            {officer.badge_number}
                          </td>
                          <td className="p-3.5 font-sans">
                            <p className="font-bold text-white text-xs">
                              {officer.first_name} {officer.last_name}
                            </p>
                            <p className="text-[11px] text-hq-muted">
                              {officer.rank_title || 'Police Officer'}
                            </p>
                          </td>
                          <td className="p-3.5 font-sans text-slate-300">
                            {getStationName(officer.station_id, officer.station_name)}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadgeClass}`}>
                              {officer.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-bold ${
                                  isRevealed ? 'text-emerald-400' : 'text-slate-500 tracking-widest'
                                }`}
                              >
                                {isRevealed ? passwordText : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordReveal(officerId)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title={isRevealed ? 'Hide Passcode' : 'Reveal Passcode'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => handleCopySlip(officer)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/80 text-xs font-semibold transition shadow-sm"
                              title="Copy Login Slip to send to officer"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Copied Slip!' : 'Copy Login Slip'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Officer Commissioning Modal */}
      <NewOfficerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOfficerCreated={handleOfficerCreated}
      />

      {/* Edit Officer Profile Modal */}
      <EditOfficerModal
        isOpen={Boolean(editingOfficer)}
        officer={editingOfficer}
        onClose={() => setEditingOfficer(null)}
        onOfficerUpdated={handleOfficerUpdated}
      />
    </div>
  );
}
