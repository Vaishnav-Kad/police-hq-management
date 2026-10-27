import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Building2, AlertCircle, CheckCircle2, MapPin, Phone, Shield, Archive, Hash, Map } from 'lucide-react';

export default function NewStationModal({ isOpen, onClose, onStationCreated }) {
  const { addStationToState, fetchStations } = useAuth();
  const [name, setName] = useState('');
  const [stationCode, setStationCode] = useState('');
  const [zoneDivision, setZoneDivision] = useState('Zone 1, South Region');
  const [location, setLocation] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [jurisdictionArea, setJurisdictionArea] = useState('14.5');
  const [lockupCapacity, setLockupCapacity] = useState('15');
  const [lockupRooms, setLockupRooms] = useState('Cell 1 (General Male), Cell 2 (Remand), Female Lockup Cell 1');
  const [evidenceVaultLocation, setEvidenceVaultLocation] = useState('Ground Floor Room 104, Malkhana Strongroom');
  const [evidenceVaultCapacity, setEvidenceVaultCapacity] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !location.trim() || !contactDetails.trim()) {
      setError('Station name, physical location, and contact details are required.');
      return;
    }

    setIsSubmitting(true);
    const code = stationCode.trim() ? stationCode.trim().toUpperCase() : `MUM-${name.trim().slice(0, 3).toUpperCase()}-01`;

    const payload = {
      name: name.trim(),
      station_code: code,
      zone_division: zoneDivision.trim(),
      location: location.trim(),
      contact_details: contactDetails.trim(),
      jurisdiction_area_sq_km: Number(jurisdictionArea) || 12.0,
      lockup_capacity: Number(lockupCapacity) || 10,
      lockup_rooms: lockupRooms.trim() || 'Cell 1 (General), Cell 2 (Remand)',
      evidence_vault_location: evidenceVaultLocation.trim() || `${name.trim()} Malkhana Vault Bay 1`,
      evidence_vault_capacity: Number(evidenceVaultCapacity) || 50,
    };

    const fallbackStation = {
      id: Date.now(),
      ...payload,
      active_officers_count: 0,
      active_cases_count: 0,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await api.post('/stations', payload);
      const finalStation = res && res.success && res.data ? res.data : fallbackStation;
      if (addStationToState) addStationToState(finalStation);
      if (fetchStations) fetchStations();
      if (onStationCreated) onStationCreated(finalStation);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register Police Station. Please review your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Police Station (Precinct Provisioning)"
      subtitle="Establishes new jurisdictional precinct with designated Lockup Holding Cells & Malkhana Vault"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">Station / Precinct Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!stationCode && e.target.value.length >= 3) {
                    setStationCode(`MUM-${e.target.value.slice(0, 3).toUpperCase()}-01`);
                  }
                }}
                placeholder="e.g. Colaba Police Station"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Station Code</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="text"
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value.toUpperCase())}
                placeholder="e.g. MUM-COL-01"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs uppercase"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Zone / Police Division</label>
            <input
              type="text"
              value={zoneDivision}
              onChange={(e) => setZoneDivision(e.target.value)}
              placeholder="e.g. Zone 1, South Region"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Jurisdiction Area (Sq. Km)</label>
            <div className="relative">
              <Map className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
              <input
                type="number"
                step="0.1"
                value={jurisdictionArea}
                onChange={(e) => setJurisdictionArea(e.target.value)}
                placeholder="14.5"
                className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Physical Location / Address</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Shahid Bhagat Singh Marg, Colaba, Mumbai 400005"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Duty Desk / Control Room Contact</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-hq-muted" />
            <input
              type="text"
              required
              value={contactDetails}
              onChange={(e) => setContactDetails(e.target.value)}
              placeholder="e.g. 022-22856233 / colaba.ps@mahapolice.gov.in"
              className="w-full bg-slate-900 border border-hq-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Lockup Facility Provisioning */}
        <div className="p-3.5 bg-slate-900/90 border border-red-900/40 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-red-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Lockup Facility & Holding Cells Configuration</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Detainee Capacity</label>
              <input
                type="number"
                value={lockupCapacity}
                onChange={(e) => setLockupCapacity(e.target.value)}
                placeholder="15"
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Designated Holding Cells (comma-separated)</label>
              <input
                type="text"
                value={lockupRooms}
                onChange={(e) => setLockupRooms(e.target.value)}
                placeholder="Cell 1 (General Male), Cell 2 (Remand), Female Lockup Cell 1"
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Malkhana Evidence Vault Provisioning */}
        <div className="p-3.5 bg-slate-900/90 border border-amber-900/40 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <Archive className="w-4 h-4" />
            <span>Malkhana Evidence Vault Provisioning</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Vault Strongroom / Bay Location</label>
              <input
                type="text"
                value={evidenceVaultLocation}
                onChange={(e) => setEvidenceVaultLocation(e.target.value)}
                placeholder="Ground Floor Room 104, Malkhana Strongroom"
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Secure Locker Capacity</label>
              <input
                type="number"
                value={evidenceVaultCapacity}
                onChange={(e) => setEvidenceVaultCapacity(e.target.value)}
                placeholder="100"
                className="w-full bg-slate-950 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
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
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            {isSubmitting ? 'Provisioning...' : 'Provision Precinct & Facilities'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
