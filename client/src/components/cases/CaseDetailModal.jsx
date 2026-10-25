import React, { useState } from 'react';
import Modal from '../common/Modal';
import { PriorityBadge, CaseStatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { DownloadDossierButton } from '../dossier/CaseDossierPDF';
import {
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Archive,
  Scale,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CaseDetailModal({
  isOpen,
  onClose,
  caseItem,
  onStatusChange,
  onReassignOfficer,
}) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(caseItem?.case_status || 'Filed');
  const [assignedOfficer, setAssignedOfficer] = useState(caseItem?.assigned_officer_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!caseItem) return null;

  const canEdit =
    user?.role === 'System-Admin' ||
    user?.role === 'Head-Officer' ||
    (user?.role === 'Officer' && String(caseItem.station_id) === String(user.station_id));

  const canReassign = user?.role === 'System-Admin' || user?.role === 'Head-Officer';

  const handleStatusUpdate = async (newStatus) => {
    setSelectedStatus(newStatus);
    setIsUpdating(true);
    setFeedback(null);
    try {
      if (onStatusChange) {
        await onStatusChange(caseItem.id, newStatus);
      }
      setFeedback({ type: 'success', message: `Case status advanced to ${newStatus}` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update case status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Case Dossier: ${caseItem.case_number}`}
      subtitle={`FIR Link: ${caseItem.fir_number || 'Direct'} • Precinct: ${caseItem.station_name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Status / Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/60 border border-red-800/80 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Header Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-900/90 border border-hq-border rounded-xl">
          <div>
            <span className="text-[10px] text-hq-muted uppercase font-bold tracking-wider">Priority</span>
            <div className="mt-1">
              <PriorityBadge priority={caseItem.priority} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-hq-muted uppercase font-bold tracking-wider">Current Stage</span>
            <div className="mt-1">
              <CaseStatusBadge status={caseItem.case_status} />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-hq-muted uppercase font-bold tracking-wider">Days Active</span>
            <p className="text-sm font-bold text-white font-mono mt-0.5">
              {caseItem.days_active || 0} Days
            </p>
          </div>
          <div>
            <span className="text-[10px] text-hq-muted uppercase font-bold tracking-wider">Precinct Station</span>
            <p className="text-xs font-semibold text-blue-400 mt-0.5 truncate">
              {caseItem.station_name}
            </p>
          </div>
        </div>

        {/* Crime Type & Description */}
        <div className="p-3.5 bg-slate-900/60 border border-hq-border rounded-xl space-y-1.5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Offense Classification & Charges</span>
          </h4>
          <p className="text-xs font-semibold text-slate-200">{caseItem.crime_type}</p>
          <p className="text-xs text-hq-muted leading-relaxed">
            {caseItem.description ||
              'Investigation initiated pursuant to registered First Information Report. Formal panchnama and forensic evaluations in progress.'}
          </p>
        </div>

        {/* Lead Investigating Officer */}
        <div className="p-3.5 bg-slate-900/60 border border-hq-border rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned Investigating Officer</span>
            </h4>
            {canReassign && (
              <span className="text-[10px] text-blue-400 font-semibold cursor-pointer hover:underline">
                Reassign Officer
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-medium">
              {caseItem.assigned_officer_name || 'Unassigned'}
            </span>
            <span className="text-[11px] text-hq-muted font-mono">
              Badge: {caseItem.assigned_officer_badge || 'N/A'}
            </span>
          </div>
        </div>

        {/* Stage Progression Action Bar (RBAC & ABAC Enforced) */}
        {canEdit ? (
          <div className="p-3.5 bg-slate-900/90 border border-blue-900/40 rounded-xl space-y-2">
            <label className="text-[10px] text-hq-muted uppercase font-bold tracking-wider block">
              Advance Case Lifecycle Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
              {['Filed', 'Under Investigation', 'Warrant Issued', 'In Court', 'Closed'].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate(stage)}
                  className={`py-1.5 px-2 rounded-lg font-semibold text-[11px] transition text-center truncate ${
                    caseItem.case_status === stage
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-hq-muted italic">
            🔒 Read-only view: You cannot modify case stages outside your assigned precinct or with your current clearance.
          </div>
        )}

        {/* Export Official Dossier PDF Button */}
        <div className="pt-3 border-t border-hq-border flex items-center justify-between">
          <span className="text-[11px] text-hq-muted">Official Case File Generation:</span>
          <DownloadDossierButton caseData={caseItem} />
        </div>
      </div>
    </Modal>
  );
}
