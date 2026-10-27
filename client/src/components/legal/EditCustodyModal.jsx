import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  X,
  Building2,
  Scale,
  Shield,
  HeartPulse,
  Phone,
  Package,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const CUSTODY_TYPES = [
  'Police Custody (PCR)',
  'Judicial Custody (MCR)',
  'Hospitalised under Custody',
  'Transit Remand',
];

const BAIL_STATUSES = [
  'Pending',
  'Granted',
  'Denied',
  'Released on Bail',
];

const MEDICAL_STATUSES = [
  'Conducted - Fit for Lockup',
  'Pending Hospital Clearance',
  'Admitted for Treatment',
  'Injured during Apprehension',
  'Under Psychiatric Observation',
];

export default function EditCustodyModal({ isOpen, onClose, lockup, onCustodyUpdated }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    holding_cell_number: '',
    custody_type: 'Police Custody (PCR)',
    bail_status: 'Pending',
    bail_amount: '0',
    medical_exam_status: 'Conducted - Fit for Lockup',
    medical_officer_notes: '',
    relative_intimated: '',
    property_seized_inventory: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (lockup) {
      setFormData({
        holding_cell_number: lockup.holding_cell_number || lockup.cell || '',
        custody_type: lockup.custody_type || 'Police Custody (PCR)',
        bail_status: lockup.bail_status || 'Pending',
        bail_amount: String(lockup.bail_amount || 0),
        medical_exam_status: lockup.medical_exam_status || 'Conducted - Fit for Lockup',
        medical_officer_notes: lockup.medical_officer_notes || '',
        relative_intimated: lockup.relative_intimated || '',
        property_seized_inventory: lockup.property_seized_inventory || '',
      });
      setErrorMsg(null);
    }
  }, [lockup, isOpen]);

  if (!isOpen || !lockup) return null;

  const detaineeName = lockup.detainee || lockup.arrestee_name || lockup.display_detainee_name || 'Detainee';

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
        holding_cell_number: formData.holding_cell_number.trim(),
        custody_type: formData.custody_type,
        bail_status: formData.bail_status,
        bail_amount: Number(formData.bail_amount) || 0,
        medical_exam_status: formData.medical_exam_status,
        medical_officer_notes: formData.medical_officer_notes.trim(),
        relative_intimated: formData.relative_intimated.trim(),
        property_seized_inventory: formData.property_seized_inventory.trim(),
      };

      const res = await api.put(`/arrests/${lockup.id}`, payload);

      if (res && res.success && res.data) {
        if (onCustodyUpdated) onCustodyUpdated(res.data);
        onClose();
      } else {
        throw new Error(res?.message || 'Failed to update custody record.');
      }
    } catch (err) {
      const detailedMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to update custody records.';
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
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Update Jail Lockup Custody</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  {lockup.arrest_number || `LOCKUP #${lockup.id}`}
                </span>
              </h3>
              <p className="text-xs text-hq-muted">
                Holding Cell Assignment, Bail Remand & Statutory Compliance
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

          {/* Detainee Banner */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-400">Detained Accused:</div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{detaineeName}</span>
                {lockup.case_number && (
                  <span className="text-xs text-blue-400 font-mono">({lockup.case_number})</span>
                )}
              </div>
            </div>
            <div className="text-right text-[11px] text-hq-muted">
              <div>Station: <span className="text-slate-300 font-semibold">{lockup.station_name || 'Precinct Lockup'}</span></div>
              <div className="font-mono text-[10px] text-amber-400">CrPC 57 Production Active</div>
            </div>
          </div>

          {/* Holding Cell & Custody Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Holding Cell Number / Room <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="holding_cell_number"
                value={formData.holding_cell_number}
                onChange={handleChange}
                placeholder="e.g. Lockup Cell 2 (Ground Floor)"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Remand / Custody Classification <span className="text-red-400">*</span>
              </label>
              <select
                name="custody_type"
                value={formData.custody_type}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {CUSTODY_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bail Status & Bail Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Bail Remand Status <span className="text-red-400">*</span>
              </label>
              <select
                name="bail_status"
                value={formData.bail_status}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 font-semibold"
              >
                {BAIL_STATUSES.map((bs) => (
                  <option key={bs} value={bs}>
                    {bs}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Bail Bond Amount (₹)
              </label>
              <input
                type="number"
                name="bail_amount"
                value={formData.bail_amount}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          {/* Medical Fitness (CrPC 54) */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
              <HeartPulse className="w-4 h-4" />
              <span>Medical Fitness & Examination Status (CrPC 54)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Examination Result
                </label>
                <select
                  name="medical_exam_status"
                  value={formData.medical_exam_status}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {MEDICAL_STATUSES.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Medical Officer / Hospital Notes
                </label>
                <input
                  type="text"
                  name="medical_officer_notes"
                  value={formData.medical_officer_notes}
                  onChange={handleChange}
                  placeholder="Doctor's certificate notes..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Statutory Relative Intimation (CrPC 50A) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Relative / Legal Counsel Intimation Record (CrPC 50A)</span>
            </label>
            <input
              type="text"
              name="relative_intimated"
              value={formData.relative_intimated}
              onChange={handleChange}
              placeholder="e.g. Ramesh Gaikwad (Brother, +91 98201 11222) informed at 20:00 hrs"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Property Seizure Locker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Property Inventory Seized & Stored in Locker</span>
            </label>
            <textarea
              name="property_seized_inventory"
              value={formData.property_seized_inventory}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. 1 Leather wallet (₹1,450 cash), 1 analog wristwatch, 1 silver ring, 1 smartphone."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
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
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
            >
              {submitting ? (
                <span>Updating Custody...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Custody Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
