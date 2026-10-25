import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { ArrowLeftRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const OFFICERS_LIST = [
  { id: 1, name: 'Addl. CP Asha Kulkarni', badge: 'MH-HQ-001' },
  { id: 2, name: 'Sr. PI Vikram Shinde', badge: 'MH-MUM-1042' },
  { id: 3, name: 'PSI Sachin Sawant', badge: 'MH-MUM-2031' },
  { id: 4, name: 'Ganesh More (Malkhana Incharge)', badge: 'MH-MUM-4011' },
];

export default function CustodyTransferModal({ isOpen, onClose, evidence, onTransferSuccess }) {
  const [transferredToId, setTransferredToId] = useState(4);
  const [reason, setReason] = useState('FSL Forensic Examination Kalina');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!evidence) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);
    try {
      const payload = {
        transferred_to_officer_id: Number(transferredToId),
        transfer_reason: reason.trim(),
      };

      const res = await api.post(`/evidences/${evidence.id}/transfer`, payload);
      if (res.success && res.data) {
        if (onTransferSuccess) {
          onTransferSuccess(res.data);
        }
        onClose();
      } else {
        setError(res.message || 'Failed to record custody transfer.');
      }
    } catch (err) {
      setError(err.message || 'Server error recording chain of custody transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chain of Custody Transfer: ${evidence.evidence_number}`}
      subtitle="Creates cryptographically auditable chain of custody transaction"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-900 border border-hq-border rounded-lg space-y-1">
          <span className="text-[10px] text-hq-muted uppercase font-bold tracking-wider">
            Item Description:
          </span>
          <p className="text-white font-medium">{evidence.description}</p>
          <div className="flex justify-between items-center text-[10px] text-blue-400 pt-1">
            <span>Storage: {evidence.storage_location}</span>
            <span>Current: {evidence.current_custodian_name || 'Malkhana Incharge'}</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Transfer Custody To Authorized Officer
          </label>
          <select
            value={transferredToId}
            onChange={(e) => setTransferredToId(Number(e.target.value))}
            className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
          >
            {OFFICERS_LIST.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.badge})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Official Reason & Transfer Purpose
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. FSL Forensic Examination, Courtroom Exhibit, Malkhana Deposit"
            className="w-full bg-slate-900 border border-hq-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-hq-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow"
          >
            {isSubmitting ? 'Transferring...' : 'Execute Custody Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
