import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import * as api from '../../services/api';
import type { WeeklyStatItem } from '../../types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const PIE_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

const HEATMAP_HOURS = Array.from({ length: 24 }, (_, i) => i);
const HEATMAP_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(30);
  const now = new Date();
  const from = subDays(now, dateRange).toISOString();
  const to = now.toISOString();

  const { data: streakData } = useQuery({
    queryKey: ['analytics', 'streak'],
    queryFn: api.getStreak,
  });

  const { data: categoryDist = [] } = useQuery({
    queryKey: ['analytics', 'category-distribution'],
    queryFn: api.getCategoryDistribution,
  });

  const { data: activeHours = [] } = useQuery({
    queryKey: ['analytics', 'active-hours'],
    queryFn: api.getActiveHours,
  });

  const { data: completionRate } = useQuery({
    queryKey: ['analytics', 'completion-rate', from, to],
    queryFn: () => api.getCompletionRate(from, to),
  });

  const { data: weeklyStats = [] } = useQuery<WeeklyStatItem[]>({
    queryKey: ['weekly-stats'],
    queryFn: () => api.getWeeklyStats(8),
  });

  const streak = streakData?.currentStreak ?? 0;

  // Build completion data for chart (simple daily view from the API overall rate)
  const completionData = (() => {
    const days = eachDayOfInterval({ start: subDays(now, dateRange), end: now });
    // We don't have per-day data from the API, so show overall
    const rate = completionRate?.rate ?? 0;
    return days
      .filter((_, i) => i % Math.max(1, Math.floor(dateRange / 15)) === 0)
      .map((day) => ({
        date: format(day, 'd MMM', { locale: es }),
        tasa: Math.round(rate * 100),
      }));
  })();

  // Build heatmap from activeHours
  const heatmapData = (() => {
    const grid: number[][] = Array.from({ length: 7 }, () =>
      Array(24).fill(0)
    );
    // API returns per-hour count, distribute across days evenly for display
    activeHours.forEach((h) => {
      for (let d = 0; d < 7; d++) {
        grid[d][h.hour] += Math.ceil(h.count / 7);
      }
    });
    const maxVal = Math.max(...grid.flat(), 1);
    return { grid, maxVal };
  })();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analítica
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Estadísticas y tendencias
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          {[
            { value: 7, label: '7d' },
            { value: 30, label: '30d' },
            { value: 90, label: '90d' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                dateRange === opt.value
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streak card */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10">
            <Flame className="h-7 w-7 text-orange-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {streak}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {streak === 1 ? 'día' : 'días'} de racha completando avisos
            </p>
          </div>
          {streakData?.longestStreak != null && streakData.longestStreak > streak && (
            <div className="ml-auto text-right">
              <p className="text-xl font-bold text-slate-400">{streakData.longestStreak}</p>
              <p className="text-xs text-slate-400">mejor racha</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion rate chart */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tasa de completado
            </h3>
            {completionRate && (
              <span className="ml-auto text-lg font-bold text-blue-500">
                {Math.round(completionRate.rate * 100)}%
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-slate-400"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-slate-400"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasa"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category distribution */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Distribución por categoría
            </h3>
          </div>
          {categoryDist.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-slate-400">Sin datos</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDist.map((c) => ({
                        name: c.categoryName,
                        value: c.count,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDist.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color ?? PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryDist.map((cat, i) => (
                  <div key={cat.categoryName} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          cat.color ?? PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                      {cat.categoryName}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly stats bar chart */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Semana a semana
          </h3>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStats.map((item) => ({
              week: format(new Date(item.weekStart), 'd MMM', { locale: es }),
              Creados: item.created,
              Completados: item.completed,
              completionRate: item.completionRate,
            }))}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-slate-400"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-slate-400"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                formatter={(value, name, props) => {
                  const n = String(name ?? '');
                  const payload = (props as { payload?: { completionRate?: number } }).payload;
                  if (n === 'Completados' && payload?.completionRate != null) {
                    return [`${String(value)} (Tasa: ${payload.completionRate}%)`, n];
                  }
                  return [String(value ?? ''), n];
                }}
              />
              <Legend />
              <Bar dataKey="Creados" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Completados" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Active hours heatmap */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Horas más activas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block">
            <div className="mb-1 flex gap-0.5 pl-10">
              {HEATMAP_HOURS.map((h) => (
                <div
                  key={h}
                  className="w-5 text-center text-[9px] text-slate-400"
                >
                  {h % 3 === 0 ? `${h}` : ''}
                </div>
              ))}
            </div>
            {HEATMAP_DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-8 text-right text-[10px] text-slate-400">
                  {day}
                </span>
                <div className="flex gap-0.5">
                  {HEATMAP_HOURS.map((hour) => {
                    const val = heatmapData.grid[dayIdx][hour];
                    const intensity = val / heatmapData.maxVal;
                    return (
                      <div
                        key={hour}
                        title={`${day} ${hour}:00 - ${val} avisos`}
                        className="h-5 w-5 rounded-sm transition-colors"
                        style={{
                          backgroundColor:
                            val === 0
                              ? 'rgb(241 245 249)'
                              : `rgba(59, 130, 246, ${0.15 + intensity * 0.85})`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
