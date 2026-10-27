import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import NewFIRModal from '../components/firs/NewFIRModal';
import Modal from '../components/common/Modal';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  UserX,
  Phone,
  Home,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Eye,
  Building2,
  Tag,
} from 'lucide-react';

const INITIAL_FIRS = [
  {
    id: 1,
    fir_number: 'FIR-2026-001',
    date_filed: '2026-01-10T09:30:00Z',
    incident_date: '2026-01-10T08:15:00Z',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    crime_type: 'Armed Dacoity & Robbery (IPC 395/397)',
    description: 'Armed dacoity reported at Zaveri Bazaar jewelry showroom. Three masked assailants brandished country-made pistols and fled on black Bajaj Pulsar motorbikes toward Marine Drive.',
    latitude: '18.950200',
    longitude: '72.831800',
    filed_by_officer_name: 'Sachin Sawant',
    filed_by_officer_badge: 'MH-MUM-201',
    status: 'Active',
    case_number: 'CASE-2026-001',
    complainant_name: 'Mohanlal Zaveri',
    complainant_phone: '+91 98201 44552',
    complainant_address: 'Shop 14, Bullion Exchange Bldg, Zaveri Bazaar, South Mumbai',
    complainant_id_proof: 'Aadhaar 4921-8842-1092',
    complainant_type: 'Citizen / Victim',
    accused_name: 'Raju Gaikwad',
    accused_alias: 'Chhota Raju',
    accused_details: 'Height 5ft 8in, trident tattoo on right wrist, deep scar near left ear. Fled on black Bajaj Pulsar motorbikes with country-made pistols.',
    suspect_status: 'Absconding',
  },
  {
    id: 2,
    fir_number: 'FIR-2026-002',
    date_filed: '2026-02-15T14:15:00Z',
    incident_date: '2026-02-15T11:30:00Z',
    station_id: 1,
    station_name: 'Mumbai Police HQ & Azad Maidan Police Station',
    crime_type: 'Motor Vehicle Theft (IPC 379)',
    description: 'White luxury executive SUV stolen from outside corporate towers at Nariman Point using electronic frequency jamming and key-cloning device.',
    latitude: '18.925600',
    longitude: '72.824200',
    filed_by_officer_name: 'Sachin Sawant',
    filed_by_officer_badge: 'MH-MUM-201',
    status: 'Active',
    case_number: 'CASE-2026-002',
    complainant_name: 'Aditya Singhania',
    complainant_phone: '+91 98202 33441',
    complainant_address: 'Flat 12B, Sea Lord Apts, Cuffe Parade, South Mumbai',
    complainant_id_proof: 'Aadhaar 3810-9281-4451',
    complainant_type: 'Citizen / Victim',
    accused_name: 'Sameer Tambe',
    accused_alias: 'Hacker Sam',
    accused_details: 'Electronic frequency jammer and key-cloning operator, burn scar on left palm, lean build.',
    suspect_status: 'Under Investigation',
  },
  {
    id: 3,
    fir_number: 'FIR-2026-003',
    date_filed: '2026-03-01T10:00:00Z',
    incident_date: '2026-02-28T23:45:00Z',
    station_id: 2,
    station_name: 'Bandra Police Station (Zone IX)',
    crime_type: 'Cyber Extortion & Ransomware (IT Act 66D)',
    description: 'Corporate ransomware payload deployed against financial services firm at Bandra-Kurla Complex (BKC); cryptocurrency ransom demanded to release decryptor.',
    latitude: '19.065700',
    longitude: '72.868700',
    filed_by_officer_name: 'Ananya Patil',
    filed_by_officer_badge: 'MH-MUM-202',
    status: 'Active',
    case_number: 'CASE-2026-003',
    complainant_name: 'Meera Nair',
    complainant_phone: '+91 98203 77889',
    complainant_address: 'FinEdge Solutions, 5th Floor, G-Block, BKC, Bandra East, Mumbai',
    complainant_id_proof: 'PAN ABCPN1294F',
    complainant_type: 'Citizen / Victim',
    accused_name: 'Unidentified Cyber Syndicate',
    accused_alias: 'DarkNet-Shadow',
    accused_details: 'Ransomware deployment operator demanding 4.5 BTC cryptocurrency ransom; operating through international proxies.',
    suspect_status: 'Unidentified',
  },
  {
    id: 4,
    fir_number: 'FIR-2026-004',
    date_filed: '2026-03-20T16:45:00Z',
    incident_date: '2026-03-20T15:20:00Z',
    station_id: 2,
    station_name: 'Bandra Police Station (Zone IX)',
    crime_type: 'Narcotics Trafficking (NDPS Act 21/22)',
    description: 'Commercial quantity consignment of 500g Mephedrone (MD) seized during nighttime highway nakabandi near Western Express Highway Bandra flyover.',
    latitude: '19.055300',
    longitude: '72.842000',
    filed_by_officer_name: 'Ananya Patil',
    filed_by_officer_badge: 'MH-MUM-202',
    status: 'Pending',
    case_number: 'CASE-2026-004',
    complainant_name: 'API Ananya Patil',
    complainant_phone: '+91 98205 56677',
    complainant_address: 'Bandra Police Station Detection Squad, Zone IX',
    complainant_id_proof: 'Service Badge MH-MUM-202',
    complainant_type: 'Reporting Officer',
    accused_name: 'Munna Qureshi',
    accused_alias: 'Munna Supari',
    accused_details: 'Height 5ft 11in, thick mustache, gold tooth upper jaw, intercepted with 500g commercial Mephedrone (MD).',
    suspect_status: 'Apprehended',
  },
];

export default function FIRPage() {
  const { user, stationFilter, stations = [] } = useAuth();
  const { lastSyncEvent } = useSocket();
  const [firs, setFirs] = useState(INITIAL_FIRS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDossierFIR, setSelectedDossierFIR] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const canFileFIR = user?.role === 'System-Admin' || user?.role === 'Head-Officer' || user?.role === 'Officer';

  const mergeWithCustomFirs = (serverFirs) => {
    try {
      const custom = JSON.parse(localStorage.getItem('phdms_custom_firs') || '[]');
      const combined = [...serverFirs];
      custom.forEach((c) => {
        if (!combined.some((f) => f.fir_number === c.fir_number || (f.id && f.id === c.id))) {
          combined.unshift(c);
        }
      });
      return combined;
    } catch (_) {
      return serverFirs;
    }
  };

  const fetchFIRs = async () => {
    setLoading(true);
    try {
      const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
      const res = await api.get(`/fir${queryParam}`);
      if (res && res.success && res.data) {
        setFirs(mergeWithCustomFirs(res.data));
      }
    } catch (_) {
      const filtered = stationFilter === 'all'
        ? INITIAL_FIRS
        : INITIAL_FIRS.filter((f) => String(f.station_id) === String(stationFilter));
      setFirs(mergeWithCustomFirs(filtered));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFIRs();
  }, [stationFilter]);

  // Real-time synchronization when any user files or updates an FIR
  useEffect(() => {
    if (lastSyncEvent && lastSyncEvent.entity === 'firs') {
      fetchFIRs();
    }
  }, [lastSyncEvent]);

  // Listen to global FIR creation events from anywhere in the app
  useEffect(() => {
    const handleGlobalFIR = (e) => {
      if (e.detail) {
        setFirs((prev) => {
          if (prev.some((f) => f.fir_number === e.detail.fir_number)) return prev;
          return [e.detail, ...prev];
        });
        setToastMessage(`FIR ${e.detail.fir_number} & Case ${e.detail.case_number || 'Linked'} successfully recorded.`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    };
    window.addEventListener('phdms_fir_created', handleGlobalFIR);
    return () => window.removeEventListener('phdms_fir_created', handleGlobalFIR);
  }, []);

  const handleFIRCreated = (newFIR) => {
    setFirs((prev) => [newFIR, ...prev]);
    setToastMessage(`FIR ${newFIR.fir_number} registered successfully.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const getStationDisplayName = (fir) => {
    if (fir.station_name) return fir.station_name;
    const found = stations.find((s) => s.id === Number(fir.station_id));
    return found ? found.name : `Station #${fir.station_id}`;
  };

  const filteredFirs = (stationFilter === 'all'
    ? firs
    : firs.filter((f) => String(f.station_id) === String(stationFilter))
  ).filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const stationName = getStationDisplayName(f).toLowerCase();
    return (
      (f.fir_number || '').toLowerCase().includes(term) ||
      (f.crime_type || '').toLowerCase().includes(term) ||
      (f.description || '').toLowerCase().includes(term) ||
      (f.complainant_name || '').toLowerCase().includes(term) ||
      (f.accused_name || '').toLowerCase().includes(term) ||
      (f.accused_alias || '').toLowerCase().includes(term) ||
      stationName.includes(term) ||
      (f.filed_by_officer_name || '').toLowerCase().includes(term)
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

      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>First Information Reports (FIR Intake Ledger)</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Section 154 CrPC / BNSS 173 Register • Complainant & Accused Particulars • 1:1 Case Dossier Link
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-[11px] bg-slate-900 border border-hq-border rounded-lg p-1">
            {['all', 'Active', 'Pending', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              placeholder="Search FIR, complainant, accused..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {canFileFIR && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>File New FIR</span>
            </button>
          )}
        </div>
      </div>

      {/* FIR Ledger Table */}
      <div className="bg-hq-card border border-hq-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-hq-muted uppercase font-mono text-[11px] border-b border-hq-border">
              <tr>
                <th className="p-3.5">FIR & Case No.</th>
                <th className="p-3.5">Date & Incident</th>
                <th className="p-3.5">Precinct Station</th>
                <th className="p-3.5">Complainant (Who Filed)</th>
                <th className="p-3.5">Accused / Suspect (Against Whom)</th>
                <th className="p-3.5">Filing Officer</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hq-border text-slate-300">
              {filteredFirs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-hq-muted text-xs">
                    No First Information Reports found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredFirs.map((fir) => {
                  const suspectStatusClass =
                    fir.suspect_status === 'Absconding'
                      ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                      : fir.suspect_status === 'Apprehended'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : fir.suspect_status === 'Unidentified'
                      ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                      : 'bg-blue-950/60 text-blue-400 border border-blue-800/60';

                  return (
                    <tr key={fir.id || fir.fir_number} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-blue-400 text-sm">{fir.fir_number}</div>
                        {fir.case_number && (
                          <div className="text-[10px] text-hq-muted font-sans mt-0.5">
                            Case: <strong className="text-slate-300 font-mono">{fir.case_number}</strong>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {new Date(fir.date_filed).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-hq-muted font-mono">
                          {new Date(fir.date_filed).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-white truncate max-w-[170px]">
                          {getStationDisplayName(fir)}
                        </div>
                        <div className="text-[10px] text-hq-muted font-mono">
                          {fir.latitude && fir.longitude ? `GPS: ${fir.latitude}, ${fir.longitude}` : 'Precinct Grid'}
                        </div>
                      </td>

                      {/* Complainant (Who Filed) */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            {fir.complainant_name || 'Citizen Informant'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {fir.complainant_phone || 'Contact on file'}
                        </div>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-slate-900 border border-slate-700 text-slate-300 font-sans">
                          {fir.complainant_type || 'Citizen / Victim'}
                        </span>
                      </td>

                      {/* Accused / Suspect (Against Whom) */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5">
                          <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            {fir.accused_name || 'Unidentified Suspect(s)'}
                          </span>
                        </div>
                        {fir.accused_alias && (
                          <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                            Alias: "{fir.accused_alias}"
                          </div>
                        )}
                        <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono ${suspectStatusClass}`}>
                          {fir.suspect_status || 'Named in FIR'}
                        </span>
                      </td>

                      {/* Filing Officer */}
                      <td className="p-3.5">
                        <div className="text-white font-medium">{fir.filed_by_officer_name || 'Inspector on Duty'}</div>
                        <div className="text-[10px] text-blue-400 font-mono">{fir.filed_by_officer_badge || 'MH-HQ-POLICE'}</div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDossierFIR(fir)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Dossier</span>
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

      {/* New FIR Submission Modal */}
      <NewFIRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFIRCreated={handleFIRCreated}
      />

      {/* Formal Legal FIR Dossier View Modal */}
      {selectedDossierFIR && (
        <Modal
          isOpen={Boolean(selectedDossierFIR)}
          onClose={() => setSelectedDossierFIR(null)}
          title={`Official FIR Dossier • ${selectedDossierFIR.fir_number}`}
          subtitle={`Maharashtra Police First Information Report under Section 154 CrPC`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {/* Insignia & Header Banner */}
            <div className="bg-slate-900 border border-hq-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xl">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase">
                    Maharashtra Police Commissionerate
                  </h3>
                  <p className="text-[11px] text-hq-muted">
                    {getStationDisplayName(selectedDossierFIR)}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-blue-400 font-bold text-sm">{selectedDossierFIR.fir_number}</div>
                <div className="text-[10px] text-hq-muted">
                  Recorded: {new Date(selectedDossierFIR.date_filed).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Crime Classification */}
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">
                Penal Classification & Acts
              </span>
              <p className="text-white font-bold text-sm mt-0.5">{selectedDossierFIR.crime_type}</p>
            </div>

            {/* Complainant & Accused Side-by-Side Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Complainant / Informant Card (Who Filed) */}
              <div className="bg-slate-900 border border-hq-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-hq-border/60 pb-1.5">
                  <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
                    <User className="w-4 h-4" />
                    <span>Informant / Complainant (Who Filed)</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-950 text-blue-300 border border-blue-800">
                    {selectedDossierFIR.complainant_type || 'Citizen / Victim'}
                  </span>
                </div>
                <div className="space-y-1 font-sans">
                  <p className="text-white font-bold text-xs">
                    {selectedDossierFIR.complainant_name || 'Citizen Informant'}
                  </p>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Phone: {selectedDossierFIR.complainant_phone || 'Not Recorded'}
                  </p>
                  <p className="text-[11px] text-slate-300 font-mono">
                    ID Proof: {selectedDossierFIR.complainant_id_proof || 'Verified by Officer'}
                  </p>
                  <p className="text-[11px] text-hq-muted leading-relaxed">
                    Address: {selectedDossierFIR.complainant_address || 'Within station precinct'}
                  </p>
                </div>
              </div>

              {/* Accused / Suspect Card (Against Whom) */}
              <div className="bg-slate-900 border border-hq-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-hq-border/60 pb-1.5">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                    <UserX className="w-4 h-4" />
                    <span>Accused / Suspect (Against Whom)</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono bg-amber-950 text-amber-300 border border-amber-800">
                    {selectedDossierFIR.suspect_status || 'Named in FIR'}
                  </span>
                </div>
                <div className="space-y-1 font-sans">
                  <p className="text-white font-bold text-xs">
                    {selectedDossierFIR.accused_name || 'Unidentified Suspect(s)'}
                  </p>
                  {selectedDossierFIR.accused_alias && (
                    <p className="text-[11px] text-amber-300 font-mono">
                      Alias / Moniker: "{selectedDossierFIR.accused_alias}"
                    </p>
                  )}
                  <p className="text-[11px] text-hq-muted leading-relaxed">
                    Identifying Particulars:{' '}
                    {selectedDossierFIR.accused_details ||
                      'Physical details under investigation by detection squad.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Formal Statement Narrative */}
            <div className="bg-slate-900 border border-hq-border rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] text-hq-muted font-bold uppercase tracking-wider block">
                Formal Incident Description & Sequence of Occurrence
              </span>
              <p className="text-slate-200 leading-relaxed text-xs">
                {selectedDossierFIR.description}
              </p>
            </div>

            {/* Geolocation & Investigating Officer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 font-mono text-[11px] bg-slate-900/60 border border-hq-border rounded-xl p-3">
              <div>
                <span className="text-hq-muted font-sans block text-[10px]">Occurrence Location:</span>
                <span>
                  GPS: {selectedDossierFIR.latitude}, {selectedDossierFIR.longitude}
                </span>
              </div>
              <div className="text-right">
                <span className="text-hq-muted font-sans block text-[10px]">Recording Police Officer:</span>
                <span className="text-white font-bold">
                  {selectedDossierFIR.filed_by_officer_name} ({selectedDossierFIR.filed_by_officer_badge})
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDossierFIR(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
