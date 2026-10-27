import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const CRIME_COLOR_MAP = {
  'Homicide & Murder': '#ef4444', // Red
  'Armed Dacoity & Robbery': '#f43f5e', // Rose / Crimson
  'Cyber Extortion & Ransomware': '#a855f7', // Electric Purple
  'Narcotics Trafficking': '#f59e0b', // Amber / Orange
  'Motor Vehicle Theft': '#3b82f6', // Blue
  'Commercial Burglary': '#10b981', // Emerald Green
  'Extortion & Arms Act': '#e11d48', // Deep Red
  'Counterfeit Currency': '#06b6d4', // Cyan / Teal
};

export function getCrimeCategoryColor(crimeType = '') {
  const lower = crimeType.toLowerCase();
  if (lower.includes('homicide') || lower.includes('murder')) return '#ef4444';
  if (lower.includes('dacoity') || lower.includes('robbery')) return '#f43f5e';
  if (lower.includes('cyber') || lower.includes('ransomware') || lower.includes('it act')) return '#a855f7';
  if (lower.includes('narcotic') || lower.includes('ndps') || lower.includes('drug')) return '#f59e0b';
  if (lower.includes('vehicle') || lower.includes('theft')) return '#3b82f6';
  if (lower.includes('burglary') || lower.includes('housebreaking')) return '#10b981';
  if (lower.includes('counterfeit') || lower.includes('currency') || lower.includes('ficn')) return '#06b6d4';
  if (lower.includes('extortion') || lower.includes('arms')) return '#e11d48';
  return '#6366f1';
}

const DEFAULT_MONTHLY_TRENDS = [
  { month: '2025-11', incidents: 2, closed: 2 },
  { month: '2025-12', incidents: 2, closed: 2 },
  { month: '2026-01', incidents: 2, closed: 1 },
  { month: '2026-02', incidents: 2, closed: 1 },
  { month: '2026-03', incidents: 4, closed: 1 },
  { month: '2026-04', incidents: 3, closed: 1 },
  { month: '2026-05', incidents: 2, closed: 1 },
  { month: '2026-06', incidents: 2, closed: 1 },
  { month: '2026-07', incidents: 2, closed: 1 },
  { month: '2026-08', incidents: 2, closed: 1 },
  { month: '2026-09', incidents: 2, closed: 1 },
  { month: '2026-10', incidents: 3, closed: 0 },
];

const DEFAULT_CRIME_DISTRIBUTION = [
  { name: 'Armed Dacoity & Robbery', value: 17.2, count: 5, color: '#f43f5e' },
  { name: 'Commercial Burglary', value: 13.8, count: 4, color: '#10b981' },
  { name: 'Motor Vehicle Theft', value: 13.8, count: 4, color: '#3b82f6' },
  { name: 'Narcotics Trafficking', value: 13.8, count: 4, color: '#f59e0b' },
  { name: 'Homicide & Murder', value: 10.3, count: 3, color: '#ef4444' },
  { name: 'Cyber Extortion', value: 10.3, count: 3, color: '#a855f7' },
  { name: 'Counterfeit Currency', value: 10.3, count: 3, color: '#06b6d4' },
  { name: 'Extortion & Arms Act', value: 10.3, count: 3, color: '#e11d48' },
];

const DEFAULT_OFFICER_RANKINGS = [
  { name: 'Sr. PI Vikram Shinde', badge: 'MH-MUM-101', closureRate: 75.0, assigned: 4, closed: 3 },
  { name: 'PSI Priya Kadam', badge: 'MH-MUM-203', closureRate: 66.7, assigned: 3, closed: 2 },
  { name: 'API Ananya Patil', badge: 'MH-MUM-202', closureRate: 42.9, assigned: 7, closed: 3 },
  { name: 'DCP Vikram Rane', badge: 'MH-PUN-103', closureRate: 40.0, assigned: 5, closed: 2 },
  { name: 'PSI Sachin Sawant', badge: 'MH-MUM-201', closureRate: 37.5, assigned: 8, closed: 3 },
];

export function MonthlyTrendChart({ data = DEFAULT_MONTHLY_TRENDS }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatMonth = (val) => {
    if (!val || typeof val !== 'string') return val;
    const parts = val.split('-');
    if (parts.length < 2) return val;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const yearShort = parts[0].slice(2);
    return `${monthNames[monthIdx] || parts[1]} '${yearShort}`;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatMonth}
          />
          <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }}
            labelFormatter={(label) => `Month: ${formatMonth(label)}`}
            formatter={(value, name) => [
              `${value} ${name === 'Incidents Filed' ? 'Incidents' : 'Cases'}`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
          />
          <Bar dataKey="incidents" name="Incidents Filed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="closed" name="Cases Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CrimeDistributionPie({ data = DEFAULT_CRIME_DISTRIBUTION }) {
  // Ensure each entry has a consistent color
  const enrichedData = data.map((item, idx) => ({
    ...item,
    color: item.color || getCrimeCategoryColor(item.name || item.rawName),
  }));

  return (
    <div className="w-full h-80 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enrichedData}
            dataKey="value"
            nameKey="name"
            cx="45%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            label={({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')}
            labelLine={false}
          >
            {enrichedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }}
            formatter={(val, name, props) => [
              `${val}% of Total Crimes (${props.payload?.count || ''} Incidents)`,
              name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '11px', paddingLeft: '5px', maxHeight: '240px', overflowY: 'auto' }}
            formatter={(value, entry) => (
              <span className="text-slate-300 text-[11px] font-medium">
                {value}: <strong className="text-white">{entry.payload?.value}%</strong>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OfficerPerformanceChart({ data = DEFAULT_OFFICER_RANKINGS }) {
  // Rank badge styling helper
  const getRankBadgeColor = (index) => {
    if (index === 0) return '#F59E0B'; // Gold for 1st
    if (index === 1) return '#94A3B8'; // Silver for 2nd
    if (index === 2) return '#D97706'; // Bronze for 3rd
    return '#6366F1'; // Indigo for others
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={160}
            tick={{ fill: '#E5E7EB', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                    <p className="font-bold text-white text-sm flex items-center space-x-1.5">
                      <span>{item.name}</span>
                      {item.badge && <span className="text-[10px] text-blue-400 font-mono">({item.badge})</span>}
                    </p>
                    {item.stationName && (
                      <p className="text-[11px] text-gray-400">Station: {item.stationName}</p>
                    )}
                    <div className="border-t border-gray-700 pt-1.5 space-y-1">
                      <p className="text-emerald-400 font-semibold">
                        Case Closure Rate: <span className="text-white font-mono">{item.closureRate}%</span>
                      </p>
                      <p className="text-slate-300">
                        Resolved Cases: <strong className="text-emerald-300">{item.closed}</strong> / Total Assigned: <strong className="text-white">{item.assigned}</strong>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="closureRate"
            name="Case Closure Rate (%)"
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRankBadgeColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
