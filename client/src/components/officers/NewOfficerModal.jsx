import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, CheckCircle2, Copy, Check, Lock, Building2, User } from 'lucide-react';

const RANKS = [
  'Director General of Police (DGP)',
  'Additional Director General (ADG)',
  'Inspector General (IGP)',
  'Deputy Inspector General (DIG)',
  'Deputy Commissioner of Police (DCP)',
  'Assistant Commissioner of Police (ACP)',
  'Senior Police Inspector (Sr. PI)',
  'Police Inspector (PI)',
  'Assistant Police Inspector (API)',
  'Police Sub-Inspector (PSI)',
  'Assistant Sub-Inspector (ASI)',
  'Head Constable (HC)',
  'Police Constable (PC)',
];

const ROLES = [
  { value: 'Officer', label: 'Field Investigation Officer' },
  { value: 'Head-Officer', label: 'Precinct / Regional Head Officer' },
  { value: 'Evidence-Manager', label: 'Malkhana Vault Evidence Manager' },
  { value: 'System-Admin', label: 'System Administrator (HQ Command)' },
];

const STATIONS = [
  { id: 1, name: 'Mumbai Police HQ & Azad Maidan Police Station' },
  { id: 2, name: 'Bandra Police Station (Zone IX)' },
  { id: 3, name: 'Shivaji Nagar Police Station (Pune Zone I)' },
  { id: 4, name: 'Andheri Police Station (Zone-1)' },
];

export default function NewOfficerModal({ isOpen, onClose, onOfficerCreated }) {
  const { user, stations = [], addOfficerToState } = useAuth();
  const stationList = stations.length > 0 ? stations : STATIONS;

  const [badgeNumber, setBadgeNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rankTitle, setRankTitle] = useState(RANKS[9]); // PSI default
  const [role, setRole] = useState('Officer');
  const [stationId, setStationId] = useState(user?.station_id || 1);
  const [password, setPassword] = useState('Officer@123');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [emergencyContact, setEmergencyContact] = useState('');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-generate suggested badge number
  useEffect(() => {
    if (isOpen && !createdReceipt) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setBadgeNumber(`MH-MUM-${randomSuffix}`);
      if (user?.role !== 'System-Admin') {
        setStationId(user?.station_id || 1);
      }
    }
  }, [isOpen, user]);

  const handleClose = () => {
    setCreatedReceipt(null);
    setError('');
    setCopied(false);
    onClose();
  };

  const handleCopyCredentials = () => {
    if (!createdReceipt) return;
    const memo = `=== MAHARASHTRA POLICE CREDENTIAL MEMO ===\nOfficer: ${createdReceipt.rank_title} ${createdReceipt.first_name} ${createdReceipt.last_name}\nBadge / Login ID: ${createdReceipt.badge_number}\nTemporary Passcode: ${createdReceipt.initial_password}\nAssigned Station: ${createdReceipt.station_name}\nRole Clearance: ${createdReceipt.role}\nPortal URL: http://localhost:5173/login\n==========================================`;
    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!badgeNumber.trim() || !firstName.trim() || !lastName.trim() || !password.trim()) {
      setError('Badge number, first name, last name, and initial password are required.');
      return;
    }

    setIsSubmitting(true);
    const stationObj = stationList.find((s) => s.id === Number(stationId));
    const stationName = stationObj ? stationObj.name : `Station #${stationId}`;

    const newOfficerPayload = {
      badge_number: badgeNumber.trim().toUpperCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      rank_title: rankTitle,
      role: role,
      station_id: Number(stationId),
      station_name: stationName,
      password: password.trim(),
      initial_password: password.trim(),
      email: email.trim() || `${badgeNumber.toLowerCase()}@mahapolice.gov.in`,
      phone: phone.trim() || '+91 98200 00000',
      blood_group: bloodGroup,
      joining_date: joiningDate,
      emergency_contact: emergencyContact.trim() || 'HQ Police Control Room',
      id_proof_number: idProofNumber.trim() || `MH-POL-${badgeNumber.trim().toUpperCase()}`,
    };

    try {
      const res = await api.post('/officers', newOfficerPayload);
      const created = res && res.success && res.data ? res.data : { ...newOfficerPayload, id: Date.now() };
      created.initial_password = password.trim();
      created.station_name = stationName;

      if (addOfficerToState) addOfficerToState(created);
      if (onOfficerCreated) onOfficerCreated(created);

      setCreatedReceipt(created);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to commission officer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdReceipt ? 'Officer Credentials Handover Slip' : 'Commission New Police Officer'}
      subtitle={
        createdReceipt
          ? 'Hand over these credentials to the officer to access their individual account'
          : 'Provisions official service badge, precinct assignment & login credentials'
      }
      maxWidth="max-w-xl"
    >
      {createdReceipt ? (
        <div className="space-y-5 text-xs">
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Officer Successfully Commissioned!</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              New law enforcement account created. Provide the following official credentials to the officer to inform them of their login access:
            </p>
          </div>

          <div className="bg-slate-900 border border-hq-border rounded-xl p-4 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-hq-border/60 pb-2">
              <span className="text-hq-muted text-[11px]">Officer Name & Rank:</span>
              <span className="text-white font-bold font-sans text-xs">
                {createdReceipt.rank_title} {createdReceipt.first_name} {createdReceipt.last_name}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-hq-border/60 pb-2">
              <span className="text-hq-muted text-[11px]">Login ID (Badge No):</span>
              <span className="text-blue-400 font-bold text-sm bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                {createdReceipt.badge_number}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-hq-border/60 pb-2">
              <span className="text-hq-muted text-[11px]">Initial Security Passcode:</span>
              <span className="text-emerald-400 font-bold text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {createdReceipt.initial_password}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-hq-border/60 pb-2">
              <span className="text-hq-muted text-[11px]">Assigned Station:</span>
              <span className="text-slate-300 font-sans text-xs">{createdReceipt.station_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-hq-muted text-[11px]">Role Clearance:</span>
              <span className="text-purple-300 font-bold text-xs uppercase">{createdReceipt.role}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition shadow flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy Credentials Memo'}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow"
            >
              Done & View In Ledger
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Badge Number (Officer Login ID) *
              </label>
              <input
                type="text"
                required
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="e.g. MH-MUM-2049"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs uppercase"
              />
              <p className="text-[10px] text-hq-muted mt-1">This will be the officer's unique login username</p>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Assigned Precinct / Police Station *
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(Number(e.target.value))}
                disabled={user?.role !== 'System-Admin'}
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {stationList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {user?.role !== 'System-Admin' && (
                <p className="text-[10px] text-amber-400 mt-1">Locked to your designated precinct station</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Shinde"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Police Rank *</label>
              <select
                value={rankTitle}
                onChange={(e) => setRankTitle(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">System Role Clearance *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-semibold text-blue-400"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Login Passcode *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Officer@123"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-emerald-400 focus:outline-none focus:border-blue-500 font-mono text-xs font-bold"
              />
              <p className="text-[10px] text-hq-muted mt-1">
                You will be able to review this passcode on the Credential Handover page to inform the officer
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. r.shinde@mahapolice.gov.in"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-mono font-bold"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Joining Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Police ID Card Number</label>
              <input
                type="text"
                value={idProofNumber}
                onChange={(e) => setIdProofNumber(e.target.value)}
                placeholder="e.g. MH-POL-ID-4491"
                className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Emergency Contact / Next of Kin
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Smt. Sunita Shinde (Wife) - 98201 99999"
              className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-hq-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Commissioning Officer...' : 'Commission Officer & Generate Login'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
