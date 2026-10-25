import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NewStationModal from '../components/stations/NewStationModal';
import { Building2, Plus, MapPin, Phone, Search, ShieldCheck, CheckCircle2, Shield, Archive, Users, FolderKanban } from 'lucide-react';

const INITIAL_STATIONS = [
  {
    id: 1,
    name: 'Azad Maidan Police Station (Mumbai HQ)',
    station_code: 'MUM-AZAD-01',
    zone_division: 'Zone 1, South Region',
    jurisdiction_area_sq_km: 14.50,
    location: 'Mahapalika Marg, Fort, Mumbai 400001',
    contact_details: '022-22620429 / azadmaidan.ps@mahapolice.gov.in',
    lockup_capacity: 20,
    lockup_rooms: 'Cell 1 (General Male), Cell 2 (Remand), Cell 3 (High-Security)',
    evidence_vault_location: 'Azad Maidan Malkhana Vault Ground Floor Sector-A',
    evidence_vault_capacity: 150,
    active_officers_count: 14,
    active_cases_count: 28,
  },
  {
    id: 2,
    name: 'Bandra Police Station (Zone IX)',
    station_code: 'MUM-BND-09',
    zone_division: 'Zone 9, Western Region',
    jurisdiction_area_sq_km: 18.20,
    location: 'Hill Road, Bandra West, Mumbai 400050',
    contact_details: '022-26422333 / bandra.ps@mahapolice.gov.in',
    lockup_capacity: 15,
    lockup_rooms: 'Cell 1 (General Male), Female Lockup Cell 1, Cell 2 (Remand)',
    evidence_vault_location: 'Bandra Malkhana Vault Room 104',
    evidence_vault_capacity: 100,
    active_officers_count: 12,
    active_cases_count: 19,
  },
  {
    id: 3,
    name: 'Shivaji Nagar Police Station (Pune Zone I)',
    station_code: 'PUN-SHIV-01',
    zone_division: 'Pune City Zone 1',
    jurisdiction_area_sq_km: 22.00,
    location: 'F.C. Road, Shivaji Nagar, Pune 411005',
    contact_details: '020-25536263 / shivajinagar.pune@mahapolice.gov.in',
    lockup_capacity: 18,
    lockup_rooms: 'Secure Holding Cell A, Cell B (General Male), Cell C (Remand)',
    evidence_vault_location: 'Pune Malkhana Secure Bay Room 12',
    evidence_vault_capacity: 120,
    active_officers_count: 16,
    active_cases_count: 22,
  },
  {
    id: 4,
    name: 'Andheri Police Station (Zone-10)',
    station_code: 'MUM-AND-10',
    zone_division: 'Zone 10, Western Region',
    jurisdiction_area_sq_km: 16.80,
    location: 'Veera Desai Road, Andheri - West, Mumbai-400053',
    contact_details: '022-22558852 / andherips@mahagove.ps.in',
    lockup_capacity: 12,
    lockup_rooms: 'Cell 1 (General), Cell 2 (Holding)',
    evidence_vault_location: 'Andheri Malkhana Vault Bay 3',
    evidence_vault_capacity: 80,
    active_officers_count: 8,
    active_cases_count: 14,
  },
];

export default function StationsPage() {
  const { user, addStationToState, fetchStations: refreshGlobalStations } = useAuth();
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const isSystemAdmin = user?.role === 'System-Admin';

  useEffect(() => {
    let isMounted = true;
    async function fetchStations() {
      try {
        const res = await api.get('/stations');
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setStations(res.data);
        }
      } catch (_) {
        // fallback to initial
      }
    }
    fetchStations();
    return () => { isMounted = false; };
  }, []);

  const handleStationCreated = (newStation) => {
    setStations((prev) => [newStation, ...prev]);
    if (addStationToState) addStationToState(newStation);
    if (refreshGlobalStations) refreshGlobalStations();
    setToastMessage(`Police Station "${newStation.name}" registered successfully.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredStations = stations.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.location.toLowerCase().includes(term) ||
      s.contact_details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span>Police Stations & Precinct Jurisdictions</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Statewide Command Stations, Zones & Precinct Command Roster
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              placeholder="Search station or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Individual Add Option strictly for System-Admin */}
          {isSystemAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Police Station</span>
            </button>
          )}
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map((station) => (
          <div
            key={station.id}
            className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm hover:border-blue-500/50 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-1.5">
                  {station.station_code && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/70 text-blue-300 border border-blue-800/70 font-bold">
                      {station.station_code}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    ID: #{station.id}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-white text-sm tracking-wide">
                {station.name}
              </h3>
              {station.zone_division && (
                <div className="text-[11px] font-semibold text-blue-400 mt-0.5">
                  {station.zone_division} {station.jurisdiction_area_sq_km ? `• ${station.jurisdiction_area_sq_km} sq km` : ''}
                </div>
              )}

              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-hq-muted shrink-0 mt-0.5" />
                  <span className="text-slate-400">{station.location}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Phone className="w-3.5 h-3.5 text-hq-muted shrink-0 mt-0.5" />
                  <span className="text-slate-400 font-mono text-[11px]">{station.contact_details}</span>
                </div>
              </div>

              {/* Lockup Facility & Holding Cells */}
              <div className="mt-3.5 p-2.5 bg-slate-900/80 border border-red-950/80 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-red-400 flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Lockup Facility</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Cap: <strong className="text-white">{station.lockup_capacity || 10}</strong> Detainees
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Cells: <span className="text-slate-300">{station.lockup_rooms || 'Cell 1 (General), Cell 2 (Remand)'}</span>
                </p>
              </div>

              {/* Malkhana Evidence Storage Vault */}
              <div className="mt-2.5 p-2.5 bg-slate-900/80 border border-amber-950/80 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400 flex items-center space-x-1">
                    <Archive className="w-3 h-3" />
                    <span>Malkhana Evidence Vault</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Cap: <strong className="text-white">{station.evidence_vault_capacity || 50}</strong> Lockers
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Loc: <span className="text-slate-300">{station.evidence_vault_location || 'Ground Floor Malkhana Strongroom'}</span>
                </p>
              </div>

              {/* Roster & Case Metrics */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-hq-muted block">Assigned Officers</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {station.active_officers_count ?? station.active_officers ?? 10}
                  </span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-hq-muted block">Active Cases</span>
                  <span className="font-bold text-blue-400 font-mono text-sm">
                    {station.active_cases_count ?? station.active_cases ?? 15}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-hq-border flex items-center justify-between text-[11px] text-hq-muted font-mono">
              <span className="flex items-center space-x-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Officer Access Granted</span>
              </span>
              <span className="text-blue-400 font-semibold">Precinct Net</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Station Modal */}
      <NewStationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStationCreated={handleStationCreated}
      />
    </div>
  );
}
