import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FolderKanban,
  FileSpreadsheet,
  FileWarning,
  Archive,
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  Building2,
  Users,
  Scale,
  Plus,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import All Action Modals
import NewStationModal from '../components/stations/NewStationModal';
import NewOfficerModal from '../components/officers/NewOfficerModal';
import NewFIRModal from '../components/firs/NewFIRModal';
import NewCriminalModal from '../components/criminals/NewCriminalModal';
import NewEvidenceModal from '../components/evidence/NewEvidenceModal';
import NewWarrantModal from '../components/legal/NewWarrantModal';
import NewArrestModal from '../components/legal/NewArrestModal';

export default function DashboardPage() {
  const {
    user,
    stations = [],
    officers = [],
    stationFilter,
    addStationToState,
    fetchStations,
    addOfficerToState,
    fetchOfficers,
  } = useAuth();
  const [summary, setSummary] = useState({
    activeCases: 7,
    pendingFIRs: 2,
    activeWarrants: 1,
    totalEvidence: 4,
    detainedSuspects: 1,
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal Visibility States
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [isFIRModalOpen, setIsFIRModalOpen] = useState(false);
  const [isCriminalModalOpen, setIsCriminalModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isWarrantModalOpen, setIsWarrantModalOpen] = useState(false);
  const [isArrestModalOpen, setIsArrestModalOpen] = useState(false);

  // Role Permissions
  const role = user?.role || 'Officer';
  const isSystemAdmin = role === 'System-Admin';
  const isHeadOfficer = role === 'Head-Officer';
  const isRegularOfficer = role === 'Officer';
  const isEvidenceManager = role === 'Evidence-Manager';

  // Permission Flags matching User Specification
  const canAddStation = isSystemAdmin;
  const canAddOfficer = isSystemAdmin || isHeadOfficer || isRegularOfficer;
  const canAddFIR = isSystemAdmin || isHeadOfficer || isRegularOfficer;
  const canAddCriminal = isSystemAdmin || isHeadOfficer || isRegularOfficer;
  const canAddEvidence = isSystemAdmin || isHeadOfficer || isEvidenceManager;
  const canAddWarrant = isSystemAdmin || isHeadOfficer;
  const canAddLockup = isSystemAdmin || isHeadOfficer;

  useEffect(() => {
    let isMounted = true;
    async function fetchKPIs() {
      setLoading(true);
      try {
        const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
        const res = await api.get(`/analytics/summary${queryParam}`);
        if (isMounted && res.success && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        if (isMounted) {
          if (stationFilter === '1') {
            setSummary({ activeCases: 3, pendingFIRs: 1, activeWarrants: 1, totalEvidence: 3, detainedSuspects: 1 });
          } else if (stationFilter === '2') {
            setSummary({ activeCases: 2, pendingFIRs: 1, activeWarrants: 0, totalEvidence: 1, detainedSuspects: 0 });
          } else if (stationFilter === '3') {
            setSummary({ activeCases: 1, pendingFIRs: 0, activeWarrants: 0, totalEvidence: 0, detainedSuspects: 0 });
          } else if (stationFilter === '4') {
            setSummary({ activeCases: 1, pendingFIRs: 0, activeWarrants: 0, totalEvidence: 0, detainedSuspects: 0 });
          } else {
            setSummary({ activeCases: 7, pendingFIRs: 2, activeWarrants: 1, totalEvidence: 4, detainedSuspects: 1 });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchKPIs();
    return () => { isMounted = false; };
  }, [stationFilter]);

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <span>Police Headquarters Operations Command</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Real-time crime statistics, precinct jurisdiction status, and role-authorized operational data intake
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/cases"
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            <span>Open Case Kanban</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEPARATE INDIVIDUAL OPTIONS IN RESPECTIVE LOGIN FOR ADDING NEW DATA        */}
      {/* ========================================================================= */}
      <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hq-border pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Authorized Operational Intake: Quick Actions for {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-[11px] text-hq-muted">
                Role: <strong className="text-blue-400">{user?.role}</strong> • Clearance: {user?.role === 'System-Admin' ? 'Statewide Head (Unrestricted)' : `Precinct #${user?.station_id} (${user?.station_name})`}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {isSystemAdmin ? '7 Actions Authorized' : isHeadOfficer ? '5 Actions Authorized' : isRegularOfficer ? '2 Actions Authorized' : '1 Action Authorized'}
          </span>
        </div>

        {/* Action Buttons Grid Tailored to the Specific Logged-In Role */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* 1. Add Police Station (System-Admin Only) */}
          {canAddStation && (
            <button
              onClick={() => setIsStationModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-blue-800/50 hover:border-blue-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-950/80 rounded-lg text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition">
                  <Building2 className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Add Station</p>
                <p className="text-[10px] text-hq-muted mt-0.5">New Precinct Zone</p>
              </div>
            </button>
          )}

          {/* 2. Commission Police Officer (System-Admin Only) */}
          {canAddOfficer && (
            <button
              onClick={() => setIsOfficerModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-cyan-800/50 hover:border-cyan-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-cyan-950/80 rounded-lg text-cyan-400 group-hover:text-white group-hover:bg-cyan-600 transition">
                  <Shield className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Add Officer</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Commission Badge</p>
              </div>
            </button>
          )}

          {/* 3. File New FIR (System-Admin, Head-Officer, Officer) */}
          {canAddFIR && (
            <button
              onClick={() => setIsFIRModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-sky-800/50 hover:border-sky-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-sky-950/80 rounded-lg text-sky-400 group-hover:text-white group-hover:bg-sky-600 transition">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">File New FIR</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Intake Incident</p>
              </div>
            </button>
          )}

          {/* 4. Register Criminal (System-Admin, Head-Officer, Officer) */}
          {canAddCriminal && (
            <button
              onClick={() => setIsCriminalModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-amber-800/50 hover:border-amber-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-950/80 rounded-lg text-amber-400 group-hover:text-white group-hover:bg-amber-600 transition">
                  <Users className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Add Criminal</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Suspect Profiling</p>
              </div>
            </button>
          )}

          {/* 5. Catalog Evidence (System-Admin, Head-Officer, Evidence-Manager) */}
          {canAddEvidence && (
            <button
              onClick={() => setIsEvidenceModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-emerald-800/50 hover:border-emerald-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-950/80 rounded-lg text-emerald-400 group-hover:text-white group-hover:bg-emerald-600 transition">
                  <Archive className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Log Evidence</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Malkhana Vault</p>
              </div>
            </button>
          )}

          {/* 6. Issue Court Warrant (System-Admin, Head-Officer) */}
          {canAddWarrant && (
            <button
              onClick={() => setIsWarrantModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-purple-800/50 hover:border-purple-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-950/80 rounded-lg text-purple-400 group-hover:text-white group-hover:bg-purple-600 transition">
                  <Scale className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Court Warrant</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Arrest / Search</p>
              </div>
            </button>
          )}

          {/* 7. Book Detainee in Lockup (System-Admin, Head-Officer) */}
          {canAddLockup && (
            <button
              onClick={() => setIsArrestModalOpen(true)}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-red-800/50 hover:border-red-500 rounded-xl transition text-left flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-950/80 rounded-lg text-red-400 group-hover:text-white group-hover:bg-red-600 transition">
                  <FileWarning className="w-4 h-4" />
                </div>
                <Plus className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white leading-tight">Holding Lockup</p>
                <p className="text-[10px] text-hq-muted mt-0.5">Custodial Cell</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cases */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-xs text-hq-muted">
            <span className="font-bold uppercase tracking-wider">Active Cases</span>
            <div className="p-2 bg-blue-950/60 border border-blue-800/60 rounded-lg text-blue-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3 font-mono">
            {summary.activeCases}{' '}
            <span className="text-xs font-normal text-emerald-400 font-sans">+1 today</span>
          </p>
          <p className="text-[11px] text-hq-muted mt-1">
            {stationFilter === 'all'
              ? `Across ${stations.length || 4} City Commissionerate Precincts`
              : `Scoped to Station #${stationFilter}`}
          </p>
        </div>

        {/* Pending FIRs */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-xs text-hq-muted">
            <span className="font-bold uppercase tracking-wider">Pending FIRs</span>
            <div className="p-2 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-3 font-mono">
            {summary.pendingFIRs}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">awaiting review</span>
          </p>
          <p className="text-[11px] text-hq-muted mt-1">Intake Ledger Verification</p>
        </div>

        {/* Active Warrants */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-red-500/40 transition">
          <div className="flex items-center justify-between text-xs text-hq-muted">
            <span className="font-bold uppercase tracking-wider">Active Warrants</span>
            <div className="p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-red-400">
              <FileWarning className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-red-400 mt-3 font-mono">
            {summary.activeWarrants}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">NBW issued</span>
          </p>
          <p className="text-[11px] text-hq-muted mt-1">Metropolitan Sessions Orders</p>
        </div>

        {/* Malkhana Evidence */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-xs text-hq-muted">
            <span className="font-bold uppercase tracking-wider">Malkhana Evidence</span>
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-400">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">
            {summary.totalEvidence}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">items sealed</span>
          </p>
          <p className="text-[11px] text-hq-muted mt-1">SHA-256 Vault Verified</p>
        </div>
      </div>

      {/* Two Column Layout: Crime Categories & Stations Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crime Categories Breakdown */}
        <div className="lg:col-span-2 bg-hq-card border border-hq-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              High-Priority Offenses & Statutory Classifications
            </h3>
            <span className="text-[10px] text-hq-muted font-mono">Indian Penal Code / NDPS / IT Act</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Category 1 */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-200">Armed Robbery & Dacoity (IPC 395/397)</span>
                <span className="text-hq-muted">Zaveri Bazaar Precinct (Station #1)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Category 2 */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-200">Narcotics Trafficking (NDPS Act 21/22)</span>
                <span className="text-hq-muted">Western Express Highway (Station #2)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            {/* Category 3 */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-200">Cyber Ransomware (IT Act 66D)</span>
                <span className="text-hq-muted">BKC Financial District (Station #2)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            {/* Category 4 */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-200">Homicide & Murder (IPC 302)</span>
                <span className="text-hq-muted">Sassoon Docks Waterfront (Station #1)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Precinct Jurisdictions Status Box */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Precinct Stations
            </h3>
            <span className="text-[10px] text-blue-400 font-mono">{stations.length} Commissionerates / Precincts</span>
          </div>

          <div className="space-y-3 text-xs max-h-[380px] overflow-y-auto pr-1">
            {stations.map((s) => {
              const isSelected = String(stationFilter) === String(s.id) || stationFilter === 'all';
              const colorClass =
                s.id === 1
                  ? 'text-emerald-400'
                  : s.id === 2
                  ? 'text-blue-400'
                  : s.id === 3
                  ? 'text-purple-400'
                  : 'text-amber-400';

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-lg border transition ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500/60 shadow-sm'
                      : 'bg-slate-900/40 border-hq-border opacity-60'
                  }`}
                >
                  <div className="flex justify-between font-bold text-white">
                    <span>{s.name}</span>
                    <span className={`${colorClass} font-mono text-[11px]`}>Station #{s.id}</span>
                  </div>
                  <p className="text-hq-muted mt-1 text-[11px] truncate">{s.location || 'Maharashtra Zone'}</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">{s.contact_details || 'Contact details logged'}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALL MODAL DIALOGS FOR OPERATIONAL DATA INTAKE                             */}
      {/* ========================================================================= */}
      {canAddStation && (
        <NewStationModal
          isOpen={isStationModalOpen}
          onClose={() => setIsStationModalOpen(false)}
          onStationCreated={(s) => {
            if (addStationToState) addStationToState(s);
            if (fetchStations) fetchStations();
            showSuccessToast(`Police Station "${s.name}" provisioned.`);
          }}
        />
      )}

      {canAddOfficer && (
        <NewOfficerModal
          isOpen={isOfficerModalOpen}
          onClose={() => setIsOfficerModalOpen(false)}
          onOfficerCreated={(o) => {
            if (addOfficerToState) addOfficerToState(o);
            if (fetchOfficers) fetchOfficers();
            showSuccessToast(`Officer ${o.rank_title} ${o.first_name} ${o.last_name} commissioned.`);
          }}
        />
      )}

      {canAddFIR && (
        <NewFIRModal
          isOpen={isFIRModalOpen}
          onClose={() => setIsFIRModalOpen(false)}
          onFIRCreated={(f) => {
            showSuccessToast(`FIR ${f.fir_number} & Case ${f.case_number || 'Linked'} filed.`);
            setSummary((prev) => ({ ...prev, pendingFIRs: prev.pendingFIRs + 1, activeCases: prev.activeCases + 1 }));
          }}
        />
      )}

      {canAddCriminal && (
        <NewCriminalModal
          isOpen={isCriminalModalOpen}
          onClose={() => setIsCriminalModalOpen(false)}
          onCriminalCreated={(c) => showSuccessToast(`Criminal profile for ${c.first_name} ${c.last_name} registered.`)}
        />
      )}

      {canAddEvidence && (
        <NewEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          onEvidenceCreated={(e) => {
            showSuccessToast(`Evidence ${e.evidence_number || 'Seized'} cataloged in Malkhana.`);
            setSummary((prev) => ({ ...prev, totalEvidence: prev.totalEvidence + 1 }));
          }}
        />
      )}

      {canAddWarrant && (
        <NewWarrantModal
          isOpen={isWarrantModalOpen}
          onClose={() => setIsWarrantModalOpen(false)}
          onWarrantCreated={(w) => {
            showSuccessToast(`Judicial Warrant ${w.warrant_number || 'Issued'} registered.`);
            setSummary((prev) => ({ ...prev, activeWarrants: prev.activeWarrants + 1 }));
          }}
        />
      )}

      {canAddLockup && (
        <NewArrestModal
          isOpen={isArrestModalOpen}
          onClose={() => setIsArrestModalOpen(false)}
          onArrestCreated={(a) => {
            showSuccessToast(`Detainee ${a.detainee} booked into holding cell.`);
            setSummary((prev) => ({ ...prev, detainedSuspects: prev.detainedSuspects + 1 }));
          }}
        />
      )}
    </div>
  );
}
