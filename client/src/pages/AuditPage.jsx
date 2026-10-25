import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  ShieldAlert,
  History,
  User,
  Database,
  Clock,
  Terminal,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AuditPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sql'); // Default to SQL inspector per user request
  const [logs, setLogs] = useState([]);
  const [sqlQueries, setSqlQueries] = useState([]);
  const [sqlFilter, setSqlFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [sqlLoading, setSqlLoading] = useState(false);

  const initialLogs = [
    {
      id: 1,
      officer_name: 'Asha Kulkarni',
      officer_badge: 'MH-HQ-001',
      action: 'BOLO_ALERT_ISSUED',
      target_table: 'Alerts',
      record_id: 1,
      details: '{"message":"Munna Qureshi sighted near Dadar TT","severity":"High"}',
      timestamp: '2026-10-22 17:30:15',
      station_name: 'Mumbai HQ & Azad Maidan',
    },
    {
      id: 2,
      officer_name: 'Ganesh More',
      officer_badge: 'MH-MUM-4011',
      action: 'EVIDENCE_CATALOGED',
      target_table: 'Evidences',
      record_id: 1,
      details: '{"evidence_number":"EVD-2026-001","type":"Firearm"}',
      timestamp: '2026-10-22 15:45:00',
      station_name: 'Mumbai HQ & Azad Maidan',
    },
    {
      id: 3,
      officer_name: 'Vikram Shinde',
      officer_badge: 'MH-MUM-1042',
      action: 'WARRANT_ISSUED',
      target_table: 'Warrants',
      record_id: 1,
      details: '{"warrant_type":"Arrest","suspect_id":2}',
      timestamp: '2026-10-22 14:10:22',
      station_name: 'Bandra Police Station',
    },
    {
      id: 4,
      officer_name: 'Sachin Sawant',
      officer_badge: 'MH-MUM-2031',
      action: 'FIR_FILED',
      target_table: 'FIR',
      record_id: 1,
      details: '{"fir_number":"FIR-2026-001","crime_type":"Armed Dacoity"}',
      timestamp: '2026-10-22 11:20:00',
      station_name: 'Mumbai HQ & Azad Maidan',
    },
  ];

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (_) {
      setLogs(initialLogs);
    } finally {
      setLoading(false);
    }
  };

  const fetchSqlQueries = async () => {
    setSqlLoading(true);
    try {
      const res = await api.get('/audit-logs/sql-queries');
      if (res.success && Array.isArray(res.data)) {
        setSqlQueries(res.data);
      }
    } catch (_) {
      // Keep state
    } finally {
      setSqlLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    fetchSqlQueries();
    const interval = setInterval(fetchSqlQueries, 3000); // Live poll every 3s
    return () => clearInterval(interval);
  }, []);

  const filteredSqlQueries = sqlQueries.filter((q) => {
    if (sqlFilter === 'ALL') return true;
    return q.type === sqlFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span>Database Audit & Live SQL Execution Inspector</span>
          </h2>
          <p className="text-xs text-hq-muted mt-1">
            Real-Time MySQL Query Stream, Insert/Delete Operations, and Immutable Audit Trails
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-hq-border text-xs">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'sql'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live SQL Queries ({sqlQueries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Trail Ledger</span>
          </button>
        </div>
      </div>

      {/* SQL Inspector View */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          {/* File location reminder & Controls */}
          <div className="bg-slate-900/90 border border-blue-900/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">
                  Live Persistent SQL Log File on Disk:
                </p>
                <code className="text-emerald-300 font-mono text-[11px]">
                  server/logs/sql_queries.log
                </code>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Type Filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['ALL', 'INSERT', 'UPDATE', 'DELETE', 'SELECT'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSqlFilter(type)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                      sqlFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchSqlQueries}
                disabled={sqlLoading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh SQL Log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sqlLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* SQL Queries Stream Table */}
          <div className="bg-hq-card border border-hq-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-hq-muted uppercase text-[10px] border-b border-hq-border">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Operation</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Exact SQL Statement Executed</th>
                    <th className="p-3">Bound Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hq-border text-slate-300">
                  {filteredSqlQueries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-hq-muted font-sans text-xs">
                        No queries matching filter "{sqlFilter}". Perform an action (e.g. file FIR, add officer, commission station) to stream queries.
                      </td>
                    </tr>
                  ) : (
                    filteredSqlQueries.map((query) => {
                      const typeBadgeColor =
                        query.type === 'INSERT'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                          : query.type === 'DELETE'
                          ? 'bg-red-950/80 text-red-400 border border-red-700/60'
                          : query.type === 'UPDATE'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-700/60'
                          : 'bg-blue-950/80 text-blue-400 border border-blue-700/60';

                      return (
                        <tr key={query.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(query.timestamp).toLocaleTimeString('en-IN', {
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeBadgeColor}`}>
                              {query.type}
                            </span>
                          </td>
                          <td className="p-3 text-emerald-400 whitespace-nowrap text-[11px]">
                            {query.durationMs}ms
                          </td>
                          <td className="p-3 font-mono text-[11px] text-white break-all max-w-xl">
                            <span className={query.type === 'INSERT' ? 'text-emerald-200' : query.type === 'DELETE' ? 'text-red-200' : 'text-slate-200'}>
                              {query.sql}
                            </span>
                            {query.error && (
                              <p className="text-red-400 font-sans text-[10px] mt-0.5">
                                Error: {query.error}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-amber-300 font-mono max-w-xs truncate">
                            {query.params && query.params.length > 0
                              ? JSON.stringify(query.params)
                              : '<none>'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Operational Audit Trail View */}
      {activeTab === 'audit' && (
        <div className="bg-hq-card border border-hq-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-hq-muted uppercase font-mono text-[11px] border-b border-hq-border">
                <tr>
                  <th className="p-3.5">Log #</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Officer / Badge</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Audit Payload Details</th>
                  <th className="p-3.5">Precinct Station</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hq-border text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 font-mono text-hq-muted font-bold">#{log.id}</td>
                    <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-white">{log.officer_name}</p>
                      <p className="text-[10px] text-blue-400 font-mono">{log.officer_badge}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/60 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{log.target_table}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </td>
                    <td className="p-3.5 text-slate-300">{log.station_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}