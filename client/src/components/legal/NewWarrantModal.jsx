import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FileWarning, AlertCircle, CheckCircle2, User, Scale, Calendar, Building2, BookOpen } from 'lucide-react';

const DEFAULT_STATIONS = [
  { id: 1, name: 'Mumbai Police HQ & Azad Maidan Police Station' },
  { id: 2, name: 'Bandra Police Station (Zone IX)' },
  { id: 3, name: 'Shivaji Nagar Police Station (Pune Zone I)' },
  { id: 4, name: 'Andheri Police Station (Zone-10)' },
  { id: 5, name: 'Dadar Police Station' },
];

export default function NewWarrantModal({ isOpen, onClose, onWarrantCreated }) {
  const { user, stations: globalStations = [] } = useAuth();
  const stationList = globalStations.length > 0 ? globalStations : DEFAULT_STATIONS;

  const [caseNumber, setCaseNumber] = useState('CASE-2026-001');
  const [suspectName, setSuspectName] = useState('Munna Qureshi (Munna Supari)');
  const [warrantType, setWarrantType] = useState('Arrest');
  const [courtName, setCourtName] = useState('City Civil & Sessions Court Fort, Mumbai');
  const [judgeName, setJudgeName] = useState('Hon. Addl. Sessions Judge R. K. Joshi');
  const [offenseSections, setOffenseSections] = useState('IPC 302, 120-B / BNSS 103 (Organized Crime)');
  const [stationId, setStationId] = useState(user?.station_id || 1);
  const [executingOfficer, setExecutingOfficer] = useState('');
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (user?.station_id) setStationId(user.station_id);
      if (user?.first_name) {
        setExecutingOfficer(`${user.rank_title || 'Officer'} ${user.first_name} ${user.last_name}`);
      } else {
        setExecutingOfficer('Sr. PI Vikram Rane');
      }
    }
  }, [isOpen, user]);

  const selectedStation = stationList.find((s) => s.id === Number(stationId)) || stationList[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!caseNumber.trim() || !suspectName.trim() || !judgeName.trim() || !courtName.trim()) {
      setError('Case number, target person, court name, and issuing judge name are required.');
      return;
    }

    setIsSubmitting(true);
    const newWarrant = {
      id: Date.now(),
      warrant_number: `WAR-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      case_number: caseNumber.trim(),
      suspect: suspectName.trim(),
      target_person_name: suspectName.trim(),
      warrant_type: warrantType === 'Arrest' ? 'Non-Bailable Arrest Warrant (NBW)' : 'Search & Seizure Warrant (CrPC 93)',
      raw_warrant_type: warrantType,
      court_name: courtName.trim(),
      judge_name: judgeName.trim(),
      offense_sections: offenseSections.trim(),
      station_id: Number(stationId),
      station_name: selectedStation?.name,
      executing_officer_name: executingOfficer.trim(),
      issue_date: new Date().toISOString().slice(0, 10),
      expiration_date: expirationDate,
      status: 'Issued',
    };

    try {
      const res = await api.post('/warrants', {
        case_id: 1,
        suspect_id: 2,
        warrant_type: warrantType,
        issue_date: new Date().toISOString().slice(0, 10),
        expiry_date: expirationDate,
        judge_name: judgeName.trim(),
        issuing_judge: judgeName.trim(),
        court_name: courtName.trim(),
        target_person_name: suspectName.trim(),
        offense_sections: offenseSections.trim(),
        station_id: Number(stationId),
      });

      if (res && res.success && res.data) {
        if (onWarrantCreated) {
          onWarrantCreated({
            ...newWarrant,
            ...res.data,
            station_name: selectedStation?.name,
          });
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to issue judicial warrant. Please review your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Judicial Warrant (Arrest / Search)"
      subtitle="Orders apprehension or search executed under Sessions Court authority"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Case Number</label>
            <input
              type="text"
              required
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. CASE-2026-001"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Warrant Classification</label>
            <select
              value={warrantType}
              onChange={(e) => setWarrantType(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs font-semibold"
            >
              <option value="Arrest">Non-Bailable Arrest Warrant (NBW)</option>
              <option value="Search">Search & Seizure Warrant (CrPC 93)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Target Suspect / Person Named</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              required
              value={suspectName}
              onChange={(e) => setSuspectName(e.target.value)}
              placeholder="e.g. Munna Qureshi (Munna Supari)"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Issuing Court & Bench</label>
            <div className="relative">
              <Scale className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="text"
                required
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                placeholder="e.g. City Civil & Sessions Court Fort, Mumbai"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Issuing Sessions Judge</label>
            <input
              type="text"
              required
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="e.g. Hon. Addl. Sessions Judge R. K. Joshi"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Penal Sections & Statutory Charges</label>
          <div className="relative">
            <BookOpen className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              required
              value={offenseSections}
              onChange={(e) => setOffenseSections(e.target.value)}
              placeholder="e.g. IPC 302, 120-B / BNSS 103 (Organized Murder & Conspiracy)"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Executing Police Precinct</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <select
                value={stationId}
                onChange={(e) => setStationId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 text-xs"
              >
                {stationList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Expiration / Return Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-hq-border flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            {isSubmitting ? 'Issuing...' : 'Issue Court Warrant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
