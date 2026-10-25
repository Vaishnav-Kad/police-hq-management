import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Critical Action',
  message = 'Are you sure you want to proceed? This operation may be recorded in the permanent audit ledger.',
  confirmText = 'Confirm Action',
  confirmVariant = 'danger',
  loading = false,
}) {
  const btnStyles = {
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start space-x-3 pt-2">
        <div className="p-2 bg-red-950/60 border border-red-800/60 rounded-lg text-red-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-hq-border mt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-xs transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition shadow flex items-center space-x-1 ${
            btnStyles[confirmVariant] || btnStyles.danger
          }`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
