import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import type { ReminderResponse } from '../../../types';
import { ReminderPriority } from '../../../types';

const priorityColors: Record<number, string> = {
  [ReminderPriority.Urgent]: 'bg-red-500',
  [ReminderPriority.High]: 'bg-orange-500',
  [ReminderPriority.Medium]: 'bg-amber-400',
  [ReminderPriority.Low]: 'bg-blue-400',
};

interface UpcomingWidgetProps {
  reminders: ReminderResponse[];
}

export function UpcomingWidget({ reminders }: UpcomingWidgetProps) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Próximos avisos
        </h3>
        <Link
          to="/reminders"
          className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          Ver todos <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay avisos próximos
            </p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const date = new Date(reminder.startDateTime);
            let dateLabel = format(date, 'd MMM', { locale: es });
            if (isToday(date)) dateLabel = 'Hoy';
            if (isTomorrow(date)) dateLabel = 'Mañana';

            return (
              <div
                key={reminder.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {/* Category color dot */}
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: reminder.category?.color ?? '#94a3b8',
                  }}
                />
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dateLabel} &middot;{' '}
                    {reminder.isAllDay ? 'Todo el día' : format(date, 'HH:mm')}
                  </p>
                </div>
                {/* Priority */}
                <div
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    priorityColors[reminder.priority] ?? 'bg-slate-300'
                  )}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
