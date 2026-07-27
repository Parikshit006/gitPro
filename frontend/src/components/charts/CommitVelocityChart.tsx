/* ============================================================
   GitPro — Commit Velocity Chart Component
   ============================================================ */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ActivityEntry } from '../../lib/types';

interface CommitVelocityChartProps {
  data: readonly ActivityEntry[];
  height?: number;
}

export function CommitVelocityChart({ data, height = 300 }: CommitVelocityChartProps) {
  if (!data || data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-muted">No activity data</div>;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--text)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--text)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--text)' }}
            labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="commits" 
            stroke="var(--text)" 
            fillOpacity={1} 
            fill="url(#colorCommits)" 
            activeDot={{ r: 6, fill: 'var(--text)', stroke: 'var(--bg)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
