import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#ef4444', '#a855f7', '#f59e0b', '#f43f5e', '#3b82f6', '#10b981'];

const DEFAULT_MONTHLY_TRENDS = [
  { month: '2025-11', incidents: 8, closed: 5 },
  { month: '2025-12', incidents: 11, closed: 7 },
  { month: '2026-01', incidents: 14, closed: 9 },
  { month: '2026-02', incidents: 10, closed: 8 },
  { month: '2026-03', incidents: 15, closed: 11 },
  { month: '2026-04', incidents: 12, closed: 9 },
  { month: '2026-05', incidents: 13, closed: 10 },
  { month: '2026-06', incidents: 16, closed: 12 },
  { month: '2026-07', incidents: 9, closed: 7 },
  { month: '2026-08', incidents: 14, closed: 10 },
  { month: '2026-09', incidents: 12, closed: 8 },
  { month: '2026-10', incidents: 7, closed: 5 },
];

const DEFAULT_CRIME_DISTRIBUTION = [
  { name: 'Armed Dacoity', value: 28, color: '#ef4444' },
  { name: 'Cyber Extortion', value: 24, color: '#a855f7' },
  { name: 'NDPS Narcotics', value: 20, color: '#f59e0b' },
  { name: 'Homicide (IPC 302)', value: 16, color: '#f43f5e' },
  { name: 'Vehicle Theft', value: 12, color: '#3b82f6' },
];

const DEFAULT_OFFICER_RANKINGS = [
  { name: 'Sr. PI Vikram Shinde', closureRate: 50, assigned: 2, closed: 1 },
  { name: 'PSI Sachin Sawant', closureRate: 33, assigned: 3, closed: 1 },
  { name: 'API Ananya Patil', closureRate: 25, assigned: 4, closed: 1 },
  { name: 'Insp. S. V. Mahajan', closureRate: 100, assigned: 1, closed: 1 },
];

export function MonthlyTrendChart({ data = DEFAULT_MONTHLY_TRENDS }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1F2937',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="incidents" name="Incidents Filed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="closed" name="Cases Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CrimeDistributionPie({ data = DEFAULT_CRIME_DISTRIBUTION }) {
  return (
    <div className="w-full h-72 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1F2937',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(value) => [`${value}% Share`, 'Percentage']}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OfficerPerformanceChart({ data = DEFAULT_OFFICER_RANKINGS }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
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
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1F2937',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(val) => [`${val}% Closure Rate`, 'Performance']}
          />
          <Bar dataKey="closureRate" name="Case Closure Rate (%)" fill="#6366F1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
