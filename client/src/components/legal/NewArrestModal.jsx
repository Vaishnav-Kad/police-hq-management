import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Building2, AlertCircle, CheckCircle2, User, Shield, Clock, HeartPulse, PhoneCall, Package } from 'lucide-react';

const DEFAULT_STATIONS = [
  {
    id: 1,
    name: 'Mumbai Police HQ & Azad Maidan Police Station',
    lockup_rooms: 'Cell 1 (General Male), Cell 2 (Remand), Cell 3 (High-Security)',
  },
  {
    id: 2,
    name: 'Bandra Police Station (Zone IX)',
    lockup_rooms: 'Cell 1 (General Male), Female Lockup Cell 1, Cell 2 (Remand)',
  },
  {
    id: 3,
    name: 'Shivaji Nagar Police Station (Pune Zone I)',
    lockup_rooms: 'Secure Holding Cell A, Cell B (General Male), Cell C (Remand)',
  },
  {
    id: 4,
    name: 'Andheri Police Station (Zone-10)',
    lockup_rooms: 'Cell 1 (General), Cell 2 (Holding)',
  },
  {
    id: 5,
    name: 'Dadar Police Station',
    lockup_rooms: 'Cell 1 (General), Cell 2 (Custody)',
  },
];

export default function NewArrestModal({ isOpen, onClose, onArrestCreated }) {
  const { user, stations: globalStations = [] } = useAuth();
  const stationList = globalStations.length > 0 ? globalStations : DEFAULT_STATIONS;

  const [stationId, setStationId] = useState(user?.station_id || 1);
  const [detaineeName, setDetaineeName] = useState('');
  const [caseNumber, setCaseNumber] = useState('CASE-2026-001');
  const [holdingCell, setHoldingCell] = useState('Cell 1 (General Male)');
  const [custodyType, setCustodyType] = useState('Police Custody (PCR)');
  const [arrestingOfficer, setArrestingOfficer] = useState('');
  const [bailStatus, setBailStatus] = useState('Denied');
  const [medicalExamStatus, setMedicalExamStatus] = useState('Conducted - Fit for Lockup');
  const [medicalOfficerNotes, setMedicalOfficerNotes] = useState('Govt Hospital Duty MO - Fit for custodial intake.');
  const [relativeIntimated, setRelativeIntimated] = useState('');
  const [propertyInventory, setPropertyInventory] = useState('Wallet, mobile phone, keys, belt retained in locker.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedStation = stationList.find((s) => s.id === Number(stationId)) || stationList[0];

  // Parse rooms for the selected station
  const stationCells = selectedStation?.lockup_rooms
    ? selectedStation.lockup_rooms.split(',').map((c) => c.trim())
    : ['Lockup Cell 1', 'Lockup Cell 2'];

  useEffect(() => {
    if (isOpen) {
      if (user?.station_id) setStationId(user.station_id);
      if (user?.first_name) {
        setArrestingOfficer(`${user.rank_title || 'Officer'} ${user.first_name} ${user.last_name}`);
      } else {
        setArrestingOfficer('PSI Sachin Sawant');
      }
      if (stationCells.length > 0) {
        setHoldingCell(stationCells[0]);
      }
    }
  }, [isOpen, user]);

  const bookingTime = new Date();
  const deadlineTime = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!detaineeName.trim()) {
      setError('Detainee full name is required.');
      return;
    }

    setIsSubmitting(true);
    const newDetainee = {
      id: Date.now(),
      cell: `${holdingCell} (${selectedStation?.name || 'Precinct Station'})`,
      detainee: detaineeName.trim(),
      arrestee_name: detaineeName.trim(),
      booked: bookingTime.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      booking_timestamp: bookingTime.toISOString(),
      magistrate_production_deadline: deadlineTime.toISOString(),
      officer: arrestingOfficer.trim(),
      bail_status: bailStatus,
      case_number: caseNumber.trim(),
      station_id: Number(stationId),
      station_name: selectedStation?.name,
      custody_type: custodyType,
      medical_exam_status: medicalExamStatus,
      medical_officer_notes: medicalOfficerNotes.trim(),
      relative_intimated: relativeIntimated.trim() || 'Intimated via Control Room Desk',
      property_seized_inventory: propertyInventory.trim(),
    };

    try {
      const res = await api.post('/arrests', {
        case_id: 1,
        suspect_id: 1,
        station_id: Number(stationId),
        holding_cell_number: `${holdingCell} (${selectedStation?.name})`,
        bail_status: bailStatus,
        arrestee_name: detaineeName.trim(),
        custody_type: custodyType,
        magistrate_production_deadline: deadlineTime.toISOString(),
        medical_exam_status: medicalExamStatus,
        medical_officer_notes: medicalOfficerNotes.trim(),
        relative_intimated: relativeIntimated.trim() || 'Intimated via Control Room Desk',
        property_seized_inventory: propertyInventory.trim(),
      });

      if (res && res.success && res.data) {
        if (onArrestCreated) {
          onArrestCreated({
            ...newDetainee,
            ...res.data,
            detainee: res.data.arrestee_name || detaineeName.trim(),
            cell: res.data.holding_cell_number || `${holdingCell} (${selectedStation?.name})`,
          });
        }
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to book detainee into holding cell. Please review your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Detainee into Police Lockup / Holding Cell"
      subtitle="Registers custodial apprehension under Indian CrPC / BNSS legal mandates"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 24-Hour Magistrate Production Mandate Notice */}
        <div className="p-3 bg-blue-950/50 border border-blue-800/60 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-blue-300 font-semibold">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Mandatory CrPC Sec 57 / BNSS Sec 58 (24-Hour Production Mandate):</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">
            Produce before Magistrate by {deadlineTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tomorrow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Precinct Police Station</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <select
                value={stationId}
                onChange={(e) => {
                  setStationId(Number(e.target.value));
                  const st = stationList.find((s) => s.id === Number(e.target.value));
                  if (st?.lockup_rooms) {
                    const cells = st.lockup_rooms.split(',').map((c) => c.trim());
                    if (cells.length > 0) setHoldingCell(cells[0]);
                  }
                }}
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
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
            <label className="block text-slate-300 font-semibold mb-1">Designated Holding Cell</label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <select
                value={holdingCell}
                onChange={(e) => setHoldingCell(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
              >
                {stationCells.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Accused / Detainee Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              required
              value={detaineeName}
              onChange={(e) => setDetaineeName(e.target.value)}
              placeholder="e.g. Aslam Batla / Raju Gaikwad"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Affiliated Case Number</label>
            <input
              type="text"
              required
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. CASE-2026-001"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-xs uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Custody Classification</label>
            <select
              value={custodyType}
              onChange={(e) => setCustodyType(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs font-semibold"
            >
              <option value="Police Custody (PCR)">Police Custody Remand (PCR)</option>
              <option value="Judicial Custody (MCR)">Judicial Custody Remand (MCR)</option>
              <option value="Preventive Detention">Preventive Detention (CrPC Sec 151)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Initial Bail Admissibility</label>
            <select
              value={bailStatus}
              onChange={(e) => setBailStatus(e.target.value)}
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs font-semibold"
            >
              <option value="Denied">Bail Denied (Judicial Remand)</option>
              <option value="Pending">Bail Pending (Court Hearing)</option>
              <option value="Granted">Bail Granted (Surety Required)</option>
            </select>
          </div>
        </div>

        {/* CrPC Sec 54 Medical Examination */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <HeartPulse className="w-4 h-4" />
            <span>CrPC Sec 54 Mandatory Medical Examination</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Examination Status</label>
              <select
                value={medicalExamStatus}
                onChange={(e) => setMedicalExamStatus(e.target.value)}
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="Conducted - Fit for Lockup">Conducted - Fit for Lockup</option>
                <option value="Pending Medical Exam">Pending Medical Exam</option>
                <option value="Conducted - Hospitalized">Conducted - Injured / Hospitalized</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Examining Doctor / Hospital Remarks</label>
              <input
                type="text"
                value={medicalOfficerNotes}
                onChange={(e) => setMedicalOfficerNotes(e.target.value)}
                placeholder="Dr. S. Kulkarni (Govt Hospital) - Fit."
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* CrPC Sec 50A Intimation & Jama Talashi Property */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              CrPC Sec 50A Intimated Relative / Advocate
            </label>
            <div className="relative">
              <PhoneCall className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="text"
                value={relativeIntimated}
                onChange={(e) => setRelativeIntimated(e.target.value)}
                placeholder="e.g. Smt. Kavita Gaikwad (Wife) - 9820112233"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Arresting / Intake Officer
            </label>
            <input
              type="text"
              required
              value={arrestingOfficer}
              onChange={(e) => setArrestingOfficer(e.target.value)}
              placeholder="e.g. PSI Sachin Sawant"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Jama Talashi (Personal Effects Retained in Custody)
          </label>
          <div className="relative">
            <Package className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              value={propertyInventory}
              onChange={(e) => setPropertyInventory(e.target.value)}
              placeholder="Wallet, Rs. 1450 cash, Samsung smartphone, wristwatch, belt"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
            />
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
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            {isSubmitting ? 'Booking...' : 'Book into Precinct Lockup'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
