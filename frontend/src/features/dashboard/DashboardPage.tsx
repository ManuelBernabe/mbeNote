import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReminders, useUpcoming, useOverdue } from '../../hooks/useReminders';
import { ReminderStatus, ReminderPriority } from '../../types';
import type { ReminderResponse } from '../../types';
import { QuickActions } from './components/QuickActions';
import { UpcomingWidget } from './components/UpcomingWidget';
import { OverdueWidget } from './components/OverdueWidget';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const { data: remindersData } = useReminders();
  const { data: upcoming = [] } = useUpcoming(5);
  const { data: overdue = [] } = useOverdue();

  const reminders = remindersData?.items ?? [];
  const now = new Date();
  const today = new Date();

  const activeReminders = reminders.filter(
    (r) => r.status === ReminderStatus.Active
  );
  const dueToday = activeReminders.filter((r) =>
    isSameDay(new Date(r.startDateTime), today)
  );
  const overdueCount = overdue.length;

  // Completion rate this week
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekReminders = reminders.filter(
    (r) => new Date(r.startDateTime) >= sevenDaysAgo
  );
  const completedThisWeek = thisWeekReminders.filter(
    (r) => r.status === ReminderStatus.Completed
  );
  const completionRate =
    thisWeekReminders.length > 0
      ? Math.round((completedThisWeek.length / thisWeekReminders.length) * 100)
      : 0;

  const stats = [
    {
      label: 'Avisos activos',
      value: activeReminders.length,
      icon: CalendarCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Para hoy',
      value: dueToday.length,
      icon: CalendarCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Vencidos',
      value: overdueCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
    {
      label: 'Completados (7d)',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Buenos días
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </motion.div>

      {/* Quick Add */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-soft"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <UpcomingWidget reminders={upcoming} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <OverdueWidget reminders={overdue} />
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div variants={itemVariants} className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Por categoría
        </h3>
        <div className="space-y-3">
          {(() => {
            const categories: Record<string, { count: number; color: string }> = {};
            activeReminders.forEach((r) => {
              const cat = r.category?.name ?? 'Sin categoría';
              const color = r.category?.color ?? '#94a3b8';
              if (!categories[cat]) categories[cat] = { count: 0, color };
              categories[cat].count++;
            });
            const total = activeReminders.length || 1;
            return Object.entries(categories).map(([name, { count, color }]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {name}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / total) * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ));
          })()}
          {activeReminders.length === 0 && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500">
              No hay avisos activos
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
