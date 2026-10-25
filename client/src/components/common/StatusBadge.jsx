import React from 'react';

export function PriorityBadge({ priority }) {
  const p = (priority || 'Medium').toLowerCase();
  if (p === 'critical') {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-800/60 flex items-center gap-1 inline-flex">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        Critical
      </span>
    );
  }
  if (p === 'high') {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 inline-flex">
        High
      </span>
    );
  }
  if (p === 'medium') {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60 inline-flex">
        Medium
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-normal bg-slate-800 text-slate-300 border border-slate-700 inline-flex">
      Low
    </span>
  );
}

export function CaseStatusBadge({ status }) {
  const s = status || 'Filed';
  const styles = {
    'Filed': 'bg-slate-800 text-slate-300 border-slate-700',
    'Under Investigation': 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    'Warrant Issued': 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    'In Court': 'bg-purple-950/60 text-purple-400 border-purple-800/60',
    'Closed': 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    'Cold': 'bg-slate-900 text-slate-400 border-slate-700 border-dashed',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex ${styles[s] || styles['Filed']}`}>
      {s}
    </span>
  );
}

export function BailStatusBadge({ status }) {
  const s = status || 'Pending';
  if (s === 'Granted' || s === 'Released on Bail') {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 inline-flex">
        {s}
      </span>
    );
  }
  if (s === 'Denied') {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-800/60 inline-flex">
        Bail Denied
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 inline-flex">
      Bail Pending
    </span>
  );
}

export function RoleBadge({ role }) {
  const r = role || 'Officer';
  if (r === 'System-Admin') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/60 uppercase tracking-wide inline-flex">
        System-Admin
      </span>
    );
  }
  if (r === 'Head-Officer') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/60 uppercase tracking-wide inline-flex">
        Head-Officer
      </span>
    );
  }
  if (r === 'Evidence-Manager') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 uppercase tracking-wide inline-flex">
        Malkhana Custodian
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400 border border-slate-700 uppercase tracking-wide inline-flex">
      Field Officer
    </span>
  );
}
