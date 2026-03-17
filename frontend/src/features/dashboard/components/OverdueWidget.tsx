import React from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ReminderResponse } from '../../../types';

interface OverdueWidgetProps {
  reminders: ReminderResponse[];
}

export function OverdueWidget({ reminders }: OverdueWidgetProps) {
  return (
    <div className="card flex flex-col border-red-100 dark:border-red-500/20">
      <div className="flex items-center justify-between border-b border-red-100 px-5 py-4 dark:border-red-500/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Vencidos
          </h3>
          {reminders.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-400">
              {reminders.length}
            </span>
          )}
        </div>
        <Link
          to="/reminders"
          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
        >
          Ver todos <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-red-50 dark:divide-red-500/10">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Todo al día
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              No tienes avisos vencidos
            </p>
          </div>
        ) : (
          reminders.slice(0, 5).map((reminder) => {
            const date = new Date(reminder.startDateTime);
            return (
              <div
                key={reminder.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-red-50/50 dark:hover:bg-red-500/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Venció hace{' '}
                    {formatDistanceToNow(date, { locale: es })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
