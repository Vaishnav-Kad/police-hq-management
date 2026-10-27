import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Home,
  Shield,
  UserX,
  CreditCard,
  Tag,
} from 'lucide-react';

const CRIME_PRESETS = [
  'Armed Robbery & Dacoity (IPC 395/397)',
  'Homicide & Murder (IPC 302)',
  'Narcotics Trafficking (NDPS Act 21/22)',
  'Cyber Extortion & Ransomware (IT Act 66D)',
  'Vehicle Theft (IPC 379)',
  'Commercial Burglary (IPC 457/380)',
  'Counterfeit Currency (IPC 489B/489C)',
  'Arms Act Violation (Sec 25)',
  'Extortion & Threat (IPC 384/506)',
  'Assault & Grievous Hurt (IPC 324/326)',
];

const COMPLAINANT_TYPES = [
  'Citizen / Victim',
  'Eyewitness',
  'Police Informant',
  'Reporting Officer',
];

const SUSPECT_STATUSES = [
  'Named in FIR',
  'Absconding',
  'Under Investigation',
  'Unidentified',
  'Apprehended',
];

const LANDMARK_PRESETS = [
  { name: 'Azad Maidan / Fort (Zone I)', lat: '18.950200', lng: '72.831800', stationId: 1 },
  { name: 'Bandra Station / Linking Rd (Zone IX)', lat: '19.055300', lng: '72.842000', stationId: 2 },
  { name: 'BKC Financial Complex', lat: '19.065700', lng: '72.868700', stationId: 2 },
  { name: 'Sassoon Docks Waterfront', lat: '18.913500', lng: '72.824500', stationId: 1 },
  { name: 'Shivaji Nagar, Pune (Zone I)', lat: '18.530800', lng: '73.847500', stationId: 3 },
  { name: 'Andheri West / Lokhandwala (Zone I)', lat: '19.136300', lng: '72.827700', stationId: 4 },
];

export default function NewFIRModal({ isOpen, onClose, onFIRCreated }) {
  const { user, stations = [] } = useAuth();

  // Basic FIR & Jurisdiction
  const [stationId, setStationId] = useState(user?.station_id || 1);
  const [crimeType, setCrimeType] = useState(CRIME_PRESETS[0]);
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [latitude, setLatitude] = useState('18.950200');
  const [longitude, setLongitude] = useState('72.831800');
  const [description, setDescription] = useState('');

  // Complainant / Informant (Who filed the FIR)
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [complainantAddress, setComplainantAddress] = useState('');
  const [complainantIdProof, setComplainantIdProof] = useState('');
  const [complainantType, setComplainantType] = useState(COMPLAINANT_TYPES[0]);

  // Accused / Suspect (On whom the FIR is filed)
  const [isAccusedKnown, setIsAccusedKnown] = useState(true);
  const [accusedName, setAccusedName] = useState('');
  const [accusedAlias, setAccusedAlias] = useState('');
  const [suspectStatus, setSuspectStatus] = useState(SUSPECT_STATUSES[0]);
  const [accusedDetails, setAccusedDetails] = useState('');

  const [activeTab, setActiveTab] = useState('incident'); // 'incident' | 'complainant' | 'accused'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isStationLocked = user?.role === 'Officer' || user?.role === 'Evidence-Manager';

  const applyLandmarkPreset = (landmark) => {
    setLatitude(landmark.lat);
    setLongitude(landmark.lng);
    if (!isStationLocked) {
      setStationId(landmark.stationId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!complainantName.trim()) {
      setActiveTab('complainant');
      setError('Please provide the Complainant / Informant full name.');
      return;
    }

    if (isAccusedKnown && !accusedName.trim()) {
      setActiveTab('accused');
      setError('Please specify the Accused name, or select "Unidentified Suspect(s)".');
      return;
    }

    if (!description.trim()) {
      setActiveTab('incident');
      setError('Please provide the formal incident narrative / complaint description.');
      return;
    }

    setIsSubmitting(true);
    const selectedStationObj = stations.find((s) => s.id === Number(stationId));
    const effectiveAccusedName = isAccusedKnown
      ? accusedName.trim()
      : 'Unidentified Suspect(s) / Unknown Assailants';
    const effectiveSuspectStatus = isAccusedKnown ? suspectStatus : 'Unidentified';

    const payload = {
      station_id: Number(stationId),
      incident_date: incidentDate,
      crime_type: crimeType,
      description: description.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      complainant_name: complainantName.trim(),
      complainant_phone: complainantPhone.trim() || undefined,
      complainant_address: complainantAddress.trim() || undefined,
      complainant_id_proof: complainantIdProof.trim() || undefined,
      complainant_type: complainantType,
      accused_name: effectiveAccusedName,
      accused_alias: accusedAlias.trim() || undefined,
      accused_details: accusedDetails.trim() || undefined,
      suspect_status: effectiveSuspectStatus,
    };

    const fallbackFIR = {
      id: Date.now(),
      fir_number: `FIR-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      date_filed: new Date().toISOString(),
      station_id: Number(stationId),
      station_name: selectedStationObj ? selectedStationObj.name : 'Azad Maidan HQ',
      crime_type: crimeType,
      latitude: String(latitude),
      longitude: String(longitude),
      filed_by_officer_name: `${user?.first_name || 'Inspector'} ${user?.last_name || 'Sawant'}`,
      filed_by_officer_badge: user?.badge_number || 'MH-MUM-201',
      status: 'Active',
      description: description.trim(),
      case_number: `CASE-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...payload,
    };

    try {
      const res = await api.post('/fir', payload);
      const createdFIR = res && res.success && res.data ? res.data : fallbackFIR;

      // Persist in custom FIRs in localStorage
      try {
        const custom = JSON.parse(localStorage.getItem('phdms_custom_firs') || '[]');
        if (!custom.some((f) => f.fir_number === createdFIR.fir_number)) {
          custom.unshift(createdFIR);
          localStorage.setItem('phdms_custom_firs', JSON.stringify(custom));
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('phdms_fir_created', { detail: createdFIR }));
      if (onFIRCreated) onFIRCreated(createdFIR);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to file First Information Report (FIR). Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File First Information Report (FIR Intake)"
      subtitle="Records official complainant, accused particulars & provisions 1:1 case dossier"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-hq-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('incident')}
            className={`px-4 py-2 font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'incident'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Incident & Crime</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('complainant')}
            className={`px-4 py-2 font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'complainant'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2. Complainant (Who Filed)</span>
            {complainantName && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accused')}
            className={`px-4 py-2 font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'accused'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>3. Accused (Against Whom)</span>
            {(accusedName || !isAccusedKnown) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
        </div>

        {/* TAB 1: INCIDENT PARTICULARS */}
        {activeTab === 'incident' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Precinct Police Station Jurisdiction
                </label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(Number(e.target.value))}
                  disabled={isStationLocked}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Crime Classification & Penal Code
                </label>
                <select
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {CRIME_PRESETS.map((crime) => (
                    <option key={crime} value={crime}>
                      {crime}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Incident Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Landmark Presets */}
            <div>
              <span className="text-[11px] text-hq-muted font-semibold block mb-1.5">
                Quick Landmark Geolocation Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LANDMARK_PRESETS.map((landmark) => (
                  <button
                    key={landmark.name}
                    type="button"
                    onClick={() => applyLandmarkPreset(landmark)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] transition"
                  >
                    📍 {landmark.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Complaint Narrative */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Formal Incident Narrative & Complaint Statement *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide factual details of the incident: occurrence sequence, weapons used, modus operandi, damages, and immediate actions taken..."
                className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* TAB 2: COMPLAINANT / INFORMANT PARTICULARS */}
        {activeTab === 'complainant' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-[11px] text-blue-300 flex items-center space-x-2">
              <User className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Section 154 CrPC / BNSS 173: Particulars of informant / complainant recording the FIR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Complainant / Informant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  placeholder="e.g. Mohanlal Zaveri"
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Complainant Capacity / Relationship
                </label>
                <select
                  value={complainantType}
                  onChange={(e) => setComplainantType(e.target.value)}
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {COMPLAINANT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={complainantPhone}
                  onChange={(e) => setComplainantPhone(e.target.value)}
                  placeholder="e.g. +91 98201 44552"
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Identity Proof (Aadhaar / Voter ID / PAN)
                </label>
                <input
                  type="text"
                  value={complainantIdProof}
                  onChange={(e) => setComplainantIdProof(e.target.value)}
                  placeholder="e.g. Aadhaar 4921-8842-1092"
                  className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Residential / Official Address</label>
              <textarea
                rows={2}
                value={complainantAddress}
                onChange={(e) => setComplainantAddress(e.target.value)}
                placeholder="e.g. Shop 14, Bullion Exchange Bldg, Zaveri Bazaar, South Mumbai"
                className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: ACCUSED / SUSPECT PARTICULARS */}
        {activeTab === 'accused' && (
          <div className="space-y-4">
            {/* Known vs Unidentified Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-hq-border rounded-xl">
              <div>
                <span className="font-bold text-white text-xs block">Accused Identification Status</span>
                <span className="text-[11px] text-hq-muted">Is the suspect identified or currently unknown?</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccusedKnown(true);
                    setSuspectStatus('Named in FIR');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isAccusedKnown
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Known / Named
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccusedKnown(false);
                    setAccusedName('Unidentified Suspect(s)');
                    setSuspectStatus('Unidentified');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !isAccusedKnown
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Unidentified / Unknown
                </button>
              </div>
            </div>

            {isAccusedKnown ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Accused Full Name *
                    </label>
                    <input
                      type="text"
                      required={isAccusedKnown}
                      value={accusedName}
                      onChange={(e) => setAccusedName(e.target.value)}
                      placeholder="e.g. Raju Gaikwad"
                      className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Alias / Street Moniker
                    </label>
                    <input
                      type="text"
                      value={accusedAlias}
                      onChange={(e) => setAccusedAlias(e.target.value)}
                      placeholder="e.g. Chhota Raju"
                      className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Legal Suspect Status</label>
                  <select
                    value={suspectStatus}
                    onChange={(e) => setSuspectStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {SUSPECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-[11px] text-purple-300">
                FIR will be recorded against <strong>Unidentified Assailants / Unknown Perpetrators</strong> under Section 154 CrPC.
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Physical Description, Identifying Marks & Modus Operandi
              </label>
              <textarea
                rows={2}
                value={accusedDetails}
                onChange={(e) => setAccusedDetails(e.target.value)}
                placeholder="e.g. Height 5ft 8in, trident tattoo on right wrist, deep scar near left ear. Fled on black Bajaj Pulsar motorbikes with country-made pistols."
                className="w-full bg-slate-900 border border-hq-border text-xs rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-hq-border flex items-center justify-between">
          <div className="text-[11px] text-hq-muted font-mono">
            {complainantName ? `By: ${complainantName}` : 'Informant: Pending'} •{' '}
            {isAccusedKnown && accusedName ? `Vs: ${accusedName}` : 'Vs: Unidentified'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Recording Official FIR...' : 'Submit & Register Official FIR'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
