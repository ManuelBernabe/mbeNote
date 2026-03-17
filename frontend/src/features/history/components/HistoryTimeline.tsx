import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  CheckCircle2,
  Trash2,
  Clock,
  RotateCcw,
  Share2,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../../lib/utils';
import { HistoryAction } from '../../../types';
import type { HistoryResponse } from '../../../types';

const actionConfig: Record<
  number,
  { icon: any; color: string; bg: string; label: string }
> = {
  [HistoryAction.Created]: {
    icon: Plus,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    label: 'Creado',
  },
  [HistoryAction.Updated]: {
    icon: Edit3,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    label: 'Actualizado',
  },
  [HistoryAction.Completed]: {
    icon: CheckCircle2,
    color: 'text-violet-600',
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    label: 'Completado',
  },
  [HistoryAction.Deleted]: {
    icon: Trash2,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-500/20',
    label: 'Eliminado',
  },
  [HistoryAction.Snoozed]: {
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    label: 'Pospuesto',
  },
  [HistoryAction.Restored]: {
    icon: RotateCcw,
    color: 'text-cyan-600',
    bg: 'bg-cyan-100 dark:bg-cyan-500/20',
    label: 'Restaurado',
  },
  [HistoryAction.Shared]: {
    icon: Share2,
    color: 'text-pink-600',
    bg: 'bg-pink-100 dark:bg-pink-500/20',
    label: 'Compartido',
  },
};

interface HistoryTimelineProps {
  entries: HistoryResponse[];
}

export function HistoryTimeline({ entries }: HistoryTimelineProps) {
  // Group entries by date
  const grouped = entries.reduce((acc: Record<string, HistoryResponse[]>, entry) => {
    const dateKey = format(new Date(entry.performedAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => {
        const date = new Date(dateKey);
        let dateLabel: string;
        if (isToday(date)) dateLabel = 'Hoy';
        else if (isYesterday(date)) dateLabel = 'Ayer';
        else dateLabel = format(date, "EEEE, d 'de' MMMM", { locale: es });

        return (
          <div key={dateKey}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {dateLabel}
            </h3>
            <div className="relative">
              <div className="absolute bottom-0 left-5 top-0 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="space-y-1">
                {grouped[dateKey].map((entry, i) => {
                  const config =
                    actionConfig[entry.action] ?? actionConfig[HistoryAction.Updated];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group relative flex items-start gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          config.bg
                        )}
                      >
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(entry.performedAt), 'HH:mm')}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                          {entry.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
