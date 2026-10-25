import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import KanbanBoard from '../components/cases/KanbanBoard';
import CaseDetailModal from '../components/cases/CaseDetailModal';
import { Kanban, Filter, ShieldCheck, RefreshCw } from 'lucide-react';

const INITIAL_FALLBACK_CASES = [
  {
    id: 1,
    case_number: 'CASE-2026-001',
    fir_number: 'FIR-2026-001',
    crime_type: 'Armed Dacoity (IPC 395/397)',
    case_status: 'In Court',
    priority: 'Critical',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    assigned_officer_name: 'PSI Sachin Sawant',
    assigned_officer_badge: 'MH-MUM-2031',
    days_active: 285,
  },
  {
    id: 2,
    case_number: 'CASE-2026-002',
    fir_number: 'FIR-2026-002',
    crime_type: 'Vehicle Theft (IPC 379)',
    case_status: 'Warrant Issued',
    priority: 'High',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    assigned_officer_name: 'PSI Sachin Sawant',
    assigned_officer_badge: 'MH-MUM-2031',
    days_active: 249,
  },
  {
    id: 3,
    case_number: 'CASE-2026-003',
    fir_number: 'FIR-2026-003',
    crime_type: 'Cyber Extortion (IT Act 66D)',
    case_status: 'Under Investigation',
    priority: 'High',
    station_id: 2,
    station_name: 'Bandra Police Stn',
    assigned_officer_name: 'API Ananya Patil',
    assigned_officer_badge: 'MH-MUM-2045',
    days_active: 235,
  },
  {
    id: 4,
    case_number: 'CASE-2026-004',
    fir_number: 'FIR-2026-004',
    crime_type: 'Narcotics Trafficking (NDPS 21/22)',
    case_status: 'Filed',
    priority: 'Medium',
    station_id: 2,
    station_name: 'Bandra Police Stn',
    assigned_officer_name: 'API Ananya Patil',
    assigned_officer_badge: 'MH-MUM-2045',
    days_active: 216,
  },
  {
    id: 5,
    case_number: 'CASE-2026-005',
    fir_number: 'FIR-2026-005',
    crime_type: 'Homicide (IPC 302)',
    case_status: 'Under Investigation',
    priority: 'Critical',
    station_id: 1,
    station_name: 'Azad Maidan HQ',
    assigned_officer_name: 'PSI Sachin Sawant',
    assigned_officer_badge: 'MH-MUM-2031',
    days_active: 211,
  },
  {
    id: 6,
    case_number: 'CASE-2026-006',
    fir_number: 'FIR-2026-006',
    crime_type: 'Arms Act Violation (Sec 25)',
    case_status: 'Closed',
    priority: 'Medium',
    station_id: 3,
    station_name: 'Shivaji Nagar Pune',
    assigned_officer_name: 'PI Vikram Shinde',
    assigned_officer_badge: 'MH-MUM-1042',
    days_active: 45,
  },
];

export default function CasesPage() {
  const { user, stationFilter } = useAuth();
  const [cases, setCases] = useState(INITIAL_FALLBACK_CASES);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
      const res = await api.get(`/cases${queryParam}`);
      if (res.success && res.data) {
        setCases(res.data);
      }
    } catch (_) {
      // Keep state or apply filtered fallback
      const filtered = stationFilter === 'all'
        ? INITIAL_FALLBACK_CASES
        : INITIAL_FALLBACK_CASES.filter((c) => String(c.station_id) === String(stationFilter));
      setCases(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [stationFilter]);

  // Listen to global FIR creation events so Kanban board auto-refreshes new cases
  useEffect(() => {
    const handleGlobalFIR = () => {
      fetchCases();
    };
    window.addEventListener('phdms_fir_created', handleGlobalFIR);
    return () => window.removeEventListener('phdms_fir_created', handleGlobalFIR);
  }, []);

  // Handle Drag-and-Drop Mutation with @hello-pangea/dnd
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;
    const caseId = parseInt(draggableId, 10);

    // Optimistically update case status in UI
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, case_status: newStage } : c))
    );

    try {
      await api.patch(`/cases/${caseId}`, { case_status: newStage });
    } catch (err) {
      console.warn('[Kanban] Live sync update failed:', err.message);
    }
  };

  // Handle Status Update from Detail Modal
  const handleStatusChangeFromModal = async (caseId, newStatus) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, case_status: newStatus } : c))
    );
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => ({ ...prev, case_status: newStatus }));
    }
    try {
      await api.patch(`/cases/${caseId}`, { case_status: newStatus });
    } catch (err) {
      console.warn('[Modal] Status sync failed:', err.message);
    }
  };

  const filteredCases = stationFilter === 'all'
    ? cases
    : cases.filter((c) => String(c.station_id) === String(stationFilter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-blue-500" />
            <span>Interactive Case Kanban Board (@hello-pangea/dnd)</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Drag cards between columns to advance legal stages • Database View: <code className="text-blue-400">vw_active_cases</code>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCases}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center space-x-1"
            title="Refresh Kanban"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-hq-border text-xs text-blue-400 font-mono font-bold">
            Cases: {filteredCases.length}
          </span>
        </div>
      </div>

      {/* Interactive Kanban Board */}
      <KanbanBoard
        cases={filteredCases}
        onDragEnd={handleDragEnd}
        onCaseClick={(c) => setSelectedCase(c)}
      />

      {/* Detailed Case Dossier Modal */}
      {selectedCase && (
        <CaseDetailModal
          isOpen={Boolean(selectedCase)}
          onClose={() => setSelectedCase(null)}
          caseItem={selectedCase}
          onStatusChange={handleStatusChangeFromModal}
        />
      )}
    </div>
  );
}
