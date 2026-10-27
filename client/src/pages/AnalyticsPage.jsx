import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  MonthlyTrendChart,
  CrimeDistributionPie,
  OfficerPerformanceChart,
  getCrimeCategoryColor,
} from '../components/charts/CrimeAnalyticsCharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, stationFilter } = useAuth();
  const [officerStats, setOfficerStats] = useState([]);
  const [trends, setTrends] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const queryParam = stationFilter !== 'all' ? `?station_id=${stationFilter}` : '';
        const [officerRes, trendRes, crimeRes] = await Promise.allSettled([
          api.get(`/analytics/officer-success${queryParam}`),
          api.get(`/analytics/monthly-trends${queryParam}`),
          api.get(`/analytics/crime-types${queryParam}`),
        ]);

        if (isMounted) {
          if (officerRes.status === 'fulfilled' && officerRes.value?.success && Array.isArray(officerRes.value.data)) {
            const mappedOfficers = officerRes.value.data
              .map((o) => {
                let prefix = '';
                if (o.rank_title && o.rank_title.includes('(')) {
                  prefix = o.rank_title.split('(')[1].replace(')', '').trim();
                } else if (o.rank_title) {
                  prefix = o.rank_title.split('-')[0].trim();
                }
                return {
                  name: `${prefix ? prefix + ' ' : ''}${o.officer_name}`.trim(),
                  fullName: o.officer_name,
                  badge: o.badge_number,
                  rankTitle: o.rank_title,
                  stationName: o.station_name,
                  closureRate: parseFloat(o.closure_rate_percent) || 0,
                  assigned: Number(o.total_assigned_cases) || 0,
                  closed: Number(o.closed_cases) || 0,
                  active: Number(o.active_cases) || 0,
                };
              })
              .filter((o) => o.assigned > 0)
              .sort((a, b) => b.closureRate - a.closureRate || b.closed - a.closed);
            setOfficerStats(mappedOfficers);
          }

          if (trendRes.status === 'fulfilled' && trendRes.value?.success && trendRes.value.data?.length > 0) {
            const mappedTrends = trendRes.value.data.map((t) => ({
              month: t.month,
              incidents: Number(t.incident_count) || 0,
              closed: Number(t.closed_count) || 0,
            }));
            setTrends(mappedTrends);
          }

          if (crimeRes.status === 'fulfilled' && crimeRes.value?.success && crimeRes.value.data?.length > 0) {
            const mappedPie = crimeRes.value.data.map((c) => {
              const cleanName = c.crime_type.split('(')[0].trim();
              return {
                name: cleanName,
                rawName: c.crime_type,
                value: parseFloat(c.percentage) || 0,
                count: Number(c.total_incidents) || 0,
                color: getCrimeCategoryColor(c.crime_type),
              };
            });
            setCrimeTypes(mappedPie);
          }
        }
      } catch (_) {
        // Handled via defaults in child components
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [stationFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span>Crime Intelligence & Visual Analytics (Recharts)</span>
        </h2>
        <p className="text-xs text-hq-muted mt-1">
          Historical 12-Month Incident Trajectory, Statutory Offense Distributions & Investigating Officer Leaderboard
        </p>
      </div>

      {/* Two Column Charts: Trend & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 12-Month Trend Bar Chart */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-hq-border pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>12-Month Incident & Resolution Trajectory</span>
            </h3>
            <span className="text-[10px] text-hq-muted font-mono">Continuous 12 Calendar Months</span>
          </div>
          <MonthlyTrendChart data={trends || undefined} />
        </div>

        {/* Crime Category Share Donut */}
        <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-hq-border pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <PieIcon className="w-4 h-4 text-purple-400" />
              <span>Crime Category Percentage Distribution</span>
            </h3>
            <span className="text-[10px] text-hq-muted font-mono">Semantic Color-Coded Statutory Share</span>
          </div>
          <CrimeDistributionPie data={crimeTypes || undefined} />
        </div>
      </div>

      {/* Officer Performance Horizontal Bar Chart & Leaderboard */}
      <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-hq-border pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Investigating Officer Case Closure Rankings</span>
          </h3>
          <span className="text-[10px] text-hq-muted font-mono">Metric: (Resolved Cases × 100) / Assigned Cases</span>
        </div>

        <OfficerPerformanceChart data={officerStats.length > 0 ? officerStats : undefined} />

        {/* Ranks Leaderboard Table */}
        {officerStats.length > 0 && (
          <div className="border-t border-hq-border pt-4">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Investigator Efficiency Standings</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-hq-border text-[10px] text-hq-muted font-mono uppercase">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Investigating Officer</th>
                    <th className="py-2 px-3">Badge</th>
                    <th className="py-2 px-3">Precinct Station</th>
                    <th className="py-2 px-3 text-right">Assigned</th>
                    <th className="py-2 px-3 text-right">Resolved</th>
                    <th className="py-2 px-3 text-right">Closure Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hq-border/50">
                  {officerStats.map((officer, index) => {
                    const rankColors = [
                      'text-amber-400 font-bold',
                      'text-slate-300 font-bold',
                      'text-amber-600 font-bold',
                      'text-slate-400',
                      'text-slate-400',
                    ];
                    return (
                      <tr key={officer.badge || index} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              index === 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : index === 1
                                ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                                : index === 2
                                ? 'bg-amber-700/20 text-amber-500 border border-amber-600/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center space-x-1.5">
                          <span>{officer.name}</span>
                          {index === 0 && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-blue-400">{officer.badge}</td>
                        <td className="py-2.5 px-3 text-slate-300">{officer.stationName || 'Headquarters'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-200 font-mono">{officer.assigned}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-mono font-semibold">
                          {officer.closed}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              officer.closureRate >= 60
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : officer.closureRate >= 40
                                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {officer.closureRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
