import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  X,
  Shield,
  User,
  Building2,
  Mail,
  Phone,
  Key,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const RANKS = [
  'Director General of Police (DGP)',
  'Addl. Director General (ADG)',
  'Commissioner of Police (CP)',
  'Joint Commissioner of Police (JCP)',
  'Addl. Commissioner of Police (Addl CP)',
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
  { value: 'System-Admin', label: 'System-Admin (Full HQ Command & All Stations)' },
  { value: 'Head-Officer', label: 'Head-Officer (Precinct Station Commander)' },
  { value: 'Officer', label: 'Officer (Field Investigation & Law Enforcement)' },
  { value: 'Evidence-Manager', label: 'Evidence-Manager (Malkhana Vault Custodian)' },
];

export default function EditOfficerModal({ isOpen, onClose, officer, onOfficerUpdated }) {
  const { user, stations = [] } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    rank_title: 'Police Sub-Inspector (PSI)',
    role: 'Officer',
    station_id: '1',
    email: '',
    phone: '',
    blood_group: 'B+',
    emergency_contact: '',
    id_proof_number: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (officer) {
      setFormData({
        first_name: officer.first_name || '',
        last_name: officer.last_name || '',
        rank_title: officer.rank_title || 'Police Sub-Inspector (PSI)',
        role: officer.role || 'Officer',
        station_id: String(officer.station_id || '1'),
        email: officer.email || '',
        phone: officer.phone || '',
        blood_group: officer.blood_group || 'B+',
        emergency_contact: officer.emergency_contact || '',
        id_proof_number: officer.id_proof_number || '',
        password: '',
      });
      setErrorMsg(null);
    }
  }, [officer, isOpen]);

  if (!isOpen || !officer) return null;

  const isHeadOfficer = user?.role === 'Head-Officer';
  const isSysAdmin = user?.role === 'System-Admin';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        rank_title: formData.rank_title,
        role: formData.role,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        blood_group: formData.blood_group,
        emergency_contact: formData.emergency_contact.trim(),
        id_proof_number: formData.id_proof_number.trim(),
      };

      // Only System-Admin can transfer officers across stations
      if (isSysAdmin) {
        payload.station_id = Number(formData.station_id);
      }

      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password.trim();
      }

      const res = await api.put(`/officers/${officer.id}`, payload);

      if (res && res.success && res.data) {
        if (onOfficerUpdated) onOfficerUpdated(res.data);
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to update officer profile.');
      }
    } catch (err) {
      const detailedMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to update officer records.';
      setErrorMsg(detailedMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-hq-card border border-hq-border rounded-xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-hq-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Update Officer Profile</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {officer.badge_number}
                </span>
              </h3>
              <p className="text-xs text-hq-muted">
                Maharashtra Police Department Personnel Cadre & Clearance Modification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-red-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Badge Number (Immutable Identifier) */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Official Service Badge Number:</span>
              <span className="font-mono font-bold text-blue-400 text-sm">{officer.badge_number}</span>
            </div>
            <span className="text-[10px] text-hq-muted font-mono">Immutable Government ID</span>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Rank & Role Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Designated Rank Title <span className="text-red-400">*</span>
              </label>
              <select
                name="rank_title"
                value={formData.rank_title}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                System Role Clearance <span className="text-red-400">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {ROLES.filter((r) => !isHeadOfficer || r.value !== 'System-Admin').map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {isHeadOfficer && (
                <p className="text-[10px] text-amber-400/80 mt-1">
                  * Head-Officers cannot grant System-Admin credentials.
                </p>
              )}
            </div>
          </div>

          {/* Station Assignment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Assigned Precinct Police Station <span className="text-red-400">*</span></span>
              {isHeadOfficer && (
                <span className="text-[10px] text-amber-400 font-mono">
                  Locked to precinct: transfers require State HQ Admin
                </span>
              )}
            </label>
            <select
              name="station_id"
              value={formData.station_id}
              onChange={handleChange}
              disabled={isHeadOfficer}
              className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 ${
                isHeadOfficer ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {stations.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} ({s.location || 'Precinct Station'})
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Official Department Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="officer@mahapolice.gov.in"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98200 00000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Blood Group, Emergency Contact & ID Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Next of Kin / Contact"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Aadhaar / ID Proof No.
              </label>
              <input
                type="text"
                name="id_proof_number"
                value={formData.id_proof_number}
                onChange={handleChange}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
            <label className="block text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Security Passcode (Optional)</span>
            </label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to preserve current password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-hq-muted">
              Entering a new passcode will re-hash credentials with bcrypt and update the handover ledger.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-hq-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              {submitting ? (
                <span>Updating Profile...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Officer Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
