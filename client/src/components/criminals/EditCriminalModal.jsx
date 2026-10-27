import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { Users, AlertCircle, CheckCircle2, ShieldAlert, Fingerprint, MapPin, Hash, UserCheck } from 'lucide-react';

export default function EditCriminalModal({ isOpen, onClose, criminal, onCriminalUpdated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [alias, setAlias] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [threatLevel, setThreatLevel] = useState('Medium');
  const [gangAffiliation, setGangAffiliation] = useState('Independent');
  const [priorConvictionsCount, setPriorConvictionsCount] = useState(0);
  const [fingerprintId, setFingerprintId] = useState('');
  const [knownTerritory, setKnownTerritory] = useState('South Mumbai');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (criminal) {
      setFirstName(criminal.first_name || '');
      setLastName(criminal.last_name || '');
      setFatherName(criminal.father_name || '');
      setAlias(criminal.alias || '');
      setDob(criminal.dob ? (typeof criminal.dob === 'string' && criminal.dob.includes('T') ? criminal.dob.split('T')[0] : criminal.dob) : '');
      setGender(criminal.gender || 'Male');
      setIdProofNumber(criminal.id_proof_number || '');
      setThreatLevel(criminal.threat_level || 'Medium');
      setGangAffiliation(criminal.gang_affiliation || 'Independent');
      setPriorConvictionsCount(criminal.prior_convictions_count ?? 0);
      setFingerprintId(criminal.fingerprint_id || '');
      setKnownTerritory(criminal.known_territory || 'South Mumbai');
      setPhysicalDescription(criminal.physical_description || '');
      setError('');
    }
  }, [criminal, isOpen]);

  if (!isOpen || !criminal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        father_name: fatherName.trim() || null,
        alias: alias.trim() || null,
        dob: dob || null,
        gender,
        id_proof_number: idProofNumber.trim() || null,
        threat_level: threatLevel,
        gang_affiliation: gangAffiliation.trim() || 'Independent',
        prior_convictions_count: Number(priorConvictionsCount) || 0,
        fingerprint_id: fingerprintId.trim() || null,
        known_territory: knownTerritory.trim() || null,
        physical_description: physicalDescription.trim() || null,
      };

      const res = await api.put(`/criminals/${criminal.id}`, payload);
      if (res && res.success && res.data) {
        if (onCriminalUpdated) {
          onCriminalUpdated(res.data);
        }
        onClose();
        return;
      } else {
        throw new Error(res?.message || 'Failed to update criminal profile.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to update criminal dossier. Please review your data.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Criminal & Suspect Dossier"
      subtitle={`Modifies intelligence records for ${criminal.first_name} ${criminal.last_name}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Raju"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Gaikwad"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Father Name & Alias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Father's Name (S/o, D/o)
            </label>
            <input
              type="text"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              placeholder="e.g. Tukaram Gaikwad"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Underworld Alias / Street Moniker
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. Chhota Raju"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>

        {/* DOB, Gender & ID Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Aadhaar / Passport / ID
            </label>
            <input
              type="text"
              value={idProofNumber}
              onChange={(e) => setIdProofNumber(e.target.value)}
              placeholder="UIDAI / DL Number"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>
        </div>

        {/* Threat Level & Gang Syndicate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Threat Classification
            </label>
            <select
              value={threatLevel}
              onChange={(e) => setThreatLevel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="Low">Low - Minor Offender</option>
              <option value="Medium">Medium - Habitual Offender</option>
              <option value="High">High - Armed & Dangerous</option>
              <option value="Critical (MCOCA)">Critical (MCOCA / Gangster)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Gang Syndicate Affiliation
            </label>
            <input
              type="text"
              value={gangAffiliation}
              onChange={(e) => setGangAffiliation(e.target.value)}
              placeholder="e.g. D-Company, Independent"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Prior Convictions Count
            </label>
            <input
              type="number"
              min="0"
              value={priorConvictionsCount}
              onChange={(e) => setPriorConvictionsCount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>
        </div>

        {/* AFIS Fingerprint & Territory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              AFIS Biometric Fingerprint Hash
            </label>
            <input
              type="text"
              value={fingerprintId}
              onChange={(e) => setFingerprintId(e.target.value)}
              placeholder="FP-MH-XXXXX"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Primary Operating Territory / Adda
            </label>
            <input
              type="text"
              value={knownTerritory}
              onChange={(e) => setKnownTerritory(e.target.value)}
              placeholder="e.g. Dongri, Byculla, Chembur"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Physical Description & Identification Marks */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Distinctive Identification Marks & Tattoos
          </label>
          <textarea
            rows={3}
            value={physicalDescription}
            onChange={(e) => setPhysicalDescription(e.target.value)}
            placeholder="e.g. Trident (Trishul) tattoo on right wrist, deep scar near left ear, walks with slight swagger."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed text-xs"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
          >
            {isSubmitting ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Dossier Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
