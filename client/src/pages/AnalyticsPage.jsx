import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  MonthlyTrendChart,
  CrimeDistributionPie,
  OfficerPerformanceChart,
} from '../components/charts/CrimeAnalyticsCharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Award, Activity } from 'lucide-react';

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
          if (officerRes.status === 'fulfilled' && officerRes.value?.success) {
            setOfficerStats(officerRes.value.data);
          }
          if (trendRes.status === 'fulfilled' && trendRes.value?.success && trendRes.value.data?.length > 0) {
            const mappedTrends = trendRes.value.data.map((t) => ({
              month: t.month,
              incidents: t.incident_count,
              closed: t.closed_count,
            }));
            setTrends(mappedTrends);
          }
          if (crimeRes.status === 'fulfilled' && crimeRes.value?.success && crimeRes.value.data?.length > 0) {
            const mappedPie = crimeRes.value.data.map((c) => ({
              name: c.crime_type.split('(')[0].trim(),
              value: parseFloat(c.percentage) || 10,
            }));
            setCrimeTypes(mappedPie);
          }
        }
      } catch (_) {
        // Fallback default chart datasets defined inside components
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { isMounted = false; };
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
          Historical 12-Month Incident Trajectory, Offense Distributions & Investigating Officer Metrics
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
            <span className="text-[10px] text-hq-muted font-mono">Monthly Aggregation</span>
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
            <span className="text-[10px] text-hq-muted font-mono">Statutory Categorization</span>
          </div>
          <CrimeDistributionPie data={crimeTypes || undefined} />
        </div>
      </div>

      {/* Officer Performance Horizontal Bar Chart */}
      <div className="bg-hq-card border border-hq-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-hq-border pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Investigating Officer Case Closure Rankings</span>
          </h3>
          <span className="text-[10px] text-hq-muted font-mono">Formula: (Closed × 100) / Assigned</span>
        </div>
        <OfficerPerformanceChart />
      </div>
    </div>
  );
}
