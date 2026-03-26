'use client';

import { motion } from 'motion/react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { memo } from 'react';
import type { Player } from '@/lib/types';

interface PerformanceChartProps {
  podium: Player[];
  showChart: boolean;
  t: (key: string) => string;
}

const CHART_COLORS = [
  '#fbbf24', // Yellow (1st)
  '#94a3b8', // Slate (2nd)
  '#f97316', // Orange (3rd)
  '#60a5fa', // Blue (4th)
  '#34d399', // Green (5th)
];

export const PerformanceChart = memo(({ podium, showChart, t }: PerformanceChartProps) => {
  if (!showChart) return null;

  // Prepare chart data
  const chartData = Array.from({ length: (podium[0]?.scoreHistory?.length || 0) }, (_, i) => {
    const point: Record<string, string | number> = { name: `Q${i + 1}` };
    podium.slice(0, 5).forEach(p => {
      point[p.nickname] = p.scoreHistory[i];
    });
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl h-[35rem] flex flex-col flex-1 min-w-[30rem] order-1 lg:order-2"
    >
      <h3 className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-6">{t('host.performanceOverTime')}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 5, 2, 0.8)',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.5)' }}
              iconType="circle"
            />
            {podium.slice(0, 5).map((player, index) => (
              <Line
                key={player.id}
                type="monotone"
                dataKey={player.nickname}
                stroke={CHART_COLORS[index]}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS[index], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

PerformanceChart.displayName = 'PerformanceChart';
