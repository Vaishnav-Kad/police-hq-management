import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import NewWarrantModal from '../components/legal/NewWarrantModal';
import NewArrestModal from '../components/legal/NewArrestModal';
import EditCustodyModal from '../components/legal/EditCustodyModal';
import {
  Scale,
  FileWarning,
  Building2,
  Shield,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Ban,
  Unlock,
  CalendarX,
  Edit2,
} from 'lucide-react';
import { BailStatusBadge } from '../components/common/StatusBadge';

const INITIAL_HEARINGS = [
  {
    id: 1,
    court_name: 'City Civil & Sessions Court Fort, Courtroom 14',
    hearing_date: '2026-10-25',
    presiding: 'Hon. Addl. Sessions Judge R. K. Joshi',
    case_number: 'CASE-2026-001',
    accused: 'Raju Gaikwad (Chhota Raju)',
    notes: 'Ballistic admissibility hearing regarding 7.65mm pistol forensics.',
    decision: 'Pending',
    station_id: 1,
  },
  {
    id: 2,
    court_name: 'Pune District & Sessions Court, Shivajinagar',
    hearing_date: '2026-09-15',
    presiding: 'Hon. Sessions Judge S. V. Mahajan',
    case_number: 'CASE-2026-006',
    accused: 'Madam X (Rekha Deshpande)',
    notes: 'Final judgment delivered.',
    decision: 'Guilty',
    station_id: 3,
  },
];

const INITIAL_WARRANTS = [
  {
    id: 1,
    warrant_number: 'WAR-2026-001',
    case_number: 'CASE-2026-002',
    suspect: 'Munna Qureshi (Munna Supari)',
    warrant_type: 'Non-Bailable Arrest Warrant (NBW)',
    judge_name: 'Hon. Addl. Chief Metropolitan Magistrate',
    issue_date: '2026-02-18',
    expiration_date: '2026-11-30',
    status: 'Issued',
    station_id: 1,
  },
  {
    id: 2,
    warrant_number: 'WAR-2026-002',
    case_number: 'CASE-2026-004',
    suspect: 'Sunita Jadhav (Mami)',
    warrant_type: 'Search & Seizure Warrant (CrPC 93)',
    judge_name: 'Hon. Metropolitan Magistrate Bandra Court',
    issue_date: '2026-03-22',
    expiration_date: '2026-06-30',
    status: 'Executed',
    station_id: 2,
  },
];

const INITIAL_LOCKUPS = [
  {
    id: 1,
    cell: 'Lockup Cell 2 (Azad Maidan Police Station)',
    detainee: 'Raju Gaikwad (Chhota Raju)',
    booked: '12 Jan 2026, 19:30',
    officer: 'PSI Sachin Sawant',
    bail_status: 'Denied',
    case_number: 'CASE-2026-001',
    station_id: 1,
  },
  {
    id: 2,
    cell: 'Female Lockup Cell 1 (Bandra Police Station)',
    detainee: 'Sunita Jadhav (Mami)',
    booked: '22 Mar 2026, 11:15',
    officer: 'API Ananya Patil',
    bail_status: 'Granted',
    case_number: 'CASE-2026-004',
    station_id: 2,
  },
];

export default function LegalPage() {
  const { user, stationFilter } = useAuth();
  const { lastSyncEvent } = useSocket();
  const [hearings, setHearings] = useState(INITIAL_HEARINGS);
  const [warrants, setWarrants] = useState(INITIAL_WARRANTS);
  const [lockups, setLockups] = useState(INITIAL_LOCKUPS);

  const [isWarrantModalOpen, setIsWarrantModalOpen] = useState(false);
  const [isArrestModalOpen, setIsArrestModalOpen] = useState(false);
  const [editingLockup, setEditingLockup] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // System-Admin and Head-Officer can add warrants & lockup detainees
  const canManageLegal = user?.role === 'System-Admin' || user?.role === 'Head-Officer';

  // Permission check for station command / state HQ
  const canManageLegalItem = (itemStationId) => {
    if (!user) return false;
    if (user.role === 'System-Admin') return true;
    if (user.role === 'Head-Officer') {
      if (!itemStationId) return true;
      return Number(itemStationId) === Number(user.station_id);
    }
    return false;
  };

  const loadData = useCallback(async () => {
    try {
      const [wRes, aRes, hRes] = await Promise.allSettled([
        api.get('/warrants'),
        api.get('/arrests'),
        api.get('/court-dates'),
      ]);
      if (wRes.status === 'fulfilled' && wRes.value?.success && wRes.value.data?.length > 0) {
        setWarrants(wRes.value.data);
      }
      if (aRes.status === 'fulfilled' && aRes.value?.success && aRes.value.data?.length > 0) {
        setLockups(aRes.value.data);
      }
      if (hRes.status === 'fulfilled' && hRes.value?.success && hRes.value.data?.length > 0) {
        setHearings(hRes.value.data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization when any user modifies warrants, arrests or hearings
  useEffect(() => {
    if (lastSyncEvent && ['arrests', 'warrants', 'court_dates'].includes(lastSyncEvent.entity)) {
      loadData();
    }
  }, [lastSyncEvent, loadData]);

  const handleWarrantCreated = (newW) => {
    setWarrants((prev) => [newW, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Judicial Warrant ${newW.warrant_number || 'Issued'} registered.`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleArrestCreated = (newA) => {
    setLockups((prev) => [newA, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Detainee ${newA.detainee || newA.arrestee_name} booked into holding cell.`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCustodyUpdated = (updatedLockup) => {
    setLockups((prev) =>
      prev.map((l) => (l.id === updatedLockup.id ? { ...l, ...updatedLockup } : l))
    );
    setToastMessage({
      type: 'success',
      text: `Custody record for ${updatedLockup.arrestee_name || updatedLockup.detainee || updatedLockup.display_detainee_name || 'Detainee'} updated successfully.`,
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCancelWarrant = async (warrant) => {
    const warrantNo = warrant.warrant_number || `WAR-2026-00${warrant.id}`;
    if (!window.confirm(`Are you sure you want to officially cancel Judicial Warrant ${warrantNo}?`)) {
      return;
    }
    try {
      await api.patch(`/warrants/${warrant.id}/status`, { status: 'Cancelled' });
      setWarrants((prev) =>
        prev.map((w) => (w.id === warrant.id ? { ...w, status: 'Cancelled' } : w))
      );
      setToastMessage({
        type: 'success',
        text: `Judicial Warrant ${warrantNo} officially cancelled.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to cancel warrant.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleDeleteWarrant = async (warrant) => {
    const warrantNo = warrant.warrant_number || `WAR-2026-00${warrant.id}`;
    if (!window.confirm(`Are you sure you want to permanently remove Judicial Warrant ${warrantNo} from judicial records?`)) {
      return;
    }
    try {
      await api.delete(`/warrants/${warrant.id}`);
      setWarrants((prev) => prev.filter((w) => w.id !== warrant.id));
      setToastMessage({
        type: 'success',
        text: `Judicial Warrant ${warrantNo} permanently removed.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to remove warrant.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleReleaseDetainee = async (lockup) => {
    const detaineeName = lockup.detainee || lockup.arrestee_name || 'Detainee';
    if (!window.confirm(`Are you sure you want to discharge detainee ${detaineeName} from holding cell and record Release on Bail?`)) {
      return;
    }
    try {
      await api.patch(`/arrests/${lockup.id}/bail`, { bail_status: 'Released on Bail' });
      setLockups((prev) =>
        prev.map((l) =>
          l.id === lockup.id ? { ...l, bail_status: 'Released on Bail', release_timestamp: new Date().toISOString() } : l
        )
      );
      setToastMessage({
        type: 'success',
        text: `Detainee ${detaineeName} discharged from custody on bail.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to release detainee.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleDeleteLockup = async (lockup) => {
    const detaineeName = lockup.detainee || lockup.arrestee_name || 'Detainee';
    if (!window.confirm(`Are you sure you want to expunge the holding cell custody record for ${detaineeName}? This will remove them from the active lockup roster.`)) {
      return;
    }
    try {
      await api.delete(`/arrests/${lockup.id}`);
      setLockups((prev) => prev.filter((l) => l.id !== lockup.id));
      setToastMessage({
        type: 'success',
        text: `Custody record for ${detaineeName} removed from lockup register.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to expunge custody record.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleCancelHearing = async (hearing) => {
    if (!window.confirm(`Are you sure you want to cancel the court trial hearing at ${hearing.court_name} for case ${hearing.case_number}?`)) {
      return;
    }
    try {
      await api.delete(`/court-dates/${hearing.id}`);
      setHearings((prev) => prev.filter((h) => h.id !== hearing.id));
      setToastMessage({
        type: 'success',
        text: `Court hearing for case ${hearing.case_number} cancelled.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to cancel court hearing.',
      });
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const filteredHearings =
    stationFilter === 'all'
      ? hearings
      : hearings.filter((h) => String(h.station_id) === String(stationFilter));

  const filteredWarrants =
    stationFilter === 'all'
      ? warrants
      : warrants.filter((w) => String(w.station_id || w.case_station_id) === String(stationFilter));

  const filteredLockups =
    stationFilter === 'all'
      ? lockups
      : lockups.filter((l) => String(l.station_id) === String(stationFilter));

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 border rounded-xl text-xs flex items-center space-x-2 shadow-lg animate-fade-in ${
            typeof toastMessage === 'object' && toastMessage.type === 'error'
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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <span>Judicial Courts, Warrants & Holding Cells</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Trial Schedules, Judicial Warrants, Holding Cell Custody & Bail Remands
          </p>
        </div>

        {/* Separate Action Buttons for Authorized Roles */}
        {canManageLegal && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWarrantModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Court Warrant</span>
            </button>
            <button
              onClick={() => setIsArrestModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book in Lockup</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Grid: Court Warrants & Holding Cells */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Judicial Warrants Section */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <FileWarning className="w-4 h-4 text-amber-400" />
              <span>Active Judicial Warrants</span>
            </h3>
            <span className="text-[10px] text-hq-muted font-mono">Sessions Orders</span>
          </div>

          <div className="space-y-3 text-xs">
            {filteredWarrants.length === 0 ? (
              <div className="p-6 text-center text-hq-muted border border-dashed border-hq-border rounded-lg">
                No active judicial warrants found for selected precinct.
              </div>
            ) : (
              filteredWarrants.map((w) => {
                const canManage = canManageLegalItem(w.station_id || w.case_station_id);
                const isCancellable = w.status !== 'Cancelled' && w.status !== 'Executed';
                return (
                  <div key={w.id} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center font-bold text-white">
                      <span className="text-amber-400 font-mono">{w.warrant_number || `WAR-2026-00${w.id}`}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'Issued'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : w.status === 'Cancelled'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <div className="text-slate-200 font-semibold">{w.warrant_type}</div>
                    <p className="text-slate-300">
                      Target Accused: <strong className="text-white">{w.target_person_name || w.suspect || w.suspect_name}</strong>
                    </p>
                    {w.court_name && (
                      <p className="text-[11px] text-purple-300">
                        Court: <span className="text-slate-300">{w.court_name}</span> {w.judge_name || w.issuing_judge ? `(${w.judge_name || w.issuing_judge})` : ''}
                      </p>
                    )}
                    {w.offense_sections && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Charges: <span className="text-amber-300/90">{w.offense_sections}</span>
                      </p>
                    )}
                    <div className="text-[11px] text-hq-muted flex justify-between pt-1 border-t border-slate-800/60">
                      <span>Case: <strong className="text-blue-400">{w.case_number}</strong> {w.station_name ? `• ${w.station_name}` : ''}</span>
                      <span>Expires: <strong className="text-slate-300 font-mono">{w.expiration_date || w.expiry_date}</strong></span>
                    </div>

                    {canManage && (
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                        {isCancellable && (
                          <button
                            type="button"
                            onClick={() => handleCancelWarrant(w)}
                            title="Cancel / Recall Warrant"
                            className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Cancel Warrant</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteWarrant(w)}
                          title="Permanently Remove Warrant"
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lockup & Holding Cells Section */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-red-400" />
              <span>Police Holding Cells & Lockups</span>
            </h3>
            <span className="text-[10px] text-hq-muted font-mono">In-Custody Roster</span>
          </div>

          <div className="space-y-3 text-xs">
            {filteredLockups.length === 0 ? (
              <div className="p-6 text-center text-hq-muted border border-dashed border-hq-border rounded-lg">
                No detainees currently booked in holding cells for selected precinct.
              </div>
            ) : (
              filteredLockups.map((l) => {
                const canManage = canManageLegalItem(l.station_id);
                const isNotReleased = l.bail_status !== 'Released on Bail';
                return (
                  <div key={l.id} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-center font-bold text-white">
                      <span className="text-slate-200 font-mono">{l.cell || l.holding_cell_number}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/70 text-red-300 border border-red-800/70">
                          {l.custody_type || 'Police Custody (PCR)'}
                        </span>
                        <BailStatusBadge status={l.bail_status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-sm">{l.detainee || l.arrestee_name || l.display_detainee_name}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/60">
                        CrPC 57: 24h Mandate Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Medical Status (CrPC 54)</span>
                        <span className="text-emerald-400 font-semibold">{l.medical_exam_status || 'Fit for Lockup'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Intimated Relative (CrPC 50A)</span>
                        <span className="text-slate-300 truncate block">{l.relative_intimated || 'Family Intimation Logged'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Booked: {l.booked || (l.booking_timestamp ? new Date(l.booking_timestamp).toLocaleDateString('en-IN') : 'Recent')}</span>
                      <span>Officer: <strong className="text-slate-200">{l.officer || l.arresting_officer_name || 'Assigned Officer'}</strong></span>
                    </div>
                    {l.case_number && (
                      <p className="text-[11px] text-hq-muted">
                        Linked Case: <strong className="text-blue-400">{l.case_number}</strong> {l.station_name ? `• ${l.station_name}` : ''}
                      </p>
                    )}

                    {canManage && (
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => setEditingLockup(l)}
                          title="Update Holding Cell, Bail Remand & Medical Status"
                          className="px-2.5 py-1 rounded bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 border border-blue-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Update Custody</span>
                        </button>
                        {isNotReleased && (
                          <button
                            type="button"
                            onClick={() => handleReleaseDetainee(l)}
                            title="Discharge Detainee from Jail on Bail"
                            className="px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Discharge on Bail</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteLockup(l)}
                          title="Expunge Custody Record"
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Expunge Record</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Court Trial Calendar Section */}
      <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Court Trial Hearing Calendar</span>
          </h3>
          <span className="text-[10px] text-hq-muted font-mono">Sessions & High Court</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {filteredHearings.length === 0 ? (
            <div className="col-span-full p-6 text-center text-hq-muted border border-dashed border-hq-border rounded-lg">
              No court hearings scheduled for selected precinct.
            </div>
          ) : (
            filteredHearings.map((h) => {
              const canManage = canManageLegalItem(h.station_id);
              return (
                <div key={h.id} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>{h.court_name}</span>
                      <span className="text-amber-400 font-mono">
                        {h.hearing_date
                          ? typeof h.hearing_date === 'string' && h.hearing_date.includes('T')
                            ? h.hearing_date.split('T')[0]
                            : h.hearing_date
                          : ''}
                      </span>
                    </div>
                    <p className="text-slate-300">Presiding: {h.presiding || h.judge_name}</p>
                    <p className="text-[11px] text-hq-muted">
                      Case: <strong className="text-blue-400">{h.case_number}</strong> • Accused: {h.accused || h.accused_name || 'Accused'}
                    </p>
                    {h.notes && (
                      <p className="text-xs text-slate-400 italic">"{h.notes}"</p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end pt-2 border-t border-slate-800/60 mt-2">
                      <button
                        type="button"
                        onClick={() => handleCancelHearing(h)}
                        title="Cancel Court Trial Hearing"
                        className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/70 text-[11px] font-semibold transition flex items-center space-x-1"
                      >
                        <CalendarX className="w-3 h-3" />
                        <span>Cancel Hearing</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals for Legal Actions */}
      <NewWarrantModal
        isOpen={isWarrantModalOpen}
        onClose={() => setIsWarrantModalOpen(false)}
        onWarrantCreated={handleWarrantCreated}
      />

      <NewArrestModal
        isOpen={isArrestModalOpen}
        onClose={() => setIsArrestModalOpen(false)}
        onArrestCreated={handleArrestCreated}
      />

      <EditCustodyModal
        isOpen={Boolean(editingLockup)}
        lockup={editingLockup}
        onClose={() => setEditingLockup(null)}
        onCustodyUpdated={handleCustodyUpdated}
      />
    </div>
  );
}
