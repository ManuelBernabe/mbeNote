import React from 'react';
import { addDays, eachDayOfInterval, format, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ReminderResponse } from '../../../types';
import { ReminderPriority } from '../../../types';

interface AgendaViewProps {
  currentDate: Date;
  reminders: ReminderResponse[];
  onReminderClick: (reminder: ReminderResponse) => void;
  onNewReminder: (date: Date) => void;
}

const priorityColor: Record<number, string> = {
  [ReminderPriority.Low]: '#3b82f6',
  [ReminderPriority.Medium]: '#f59e0b',
  [ReminderPriority.High]: '#f97316',
  [ReminderPriority.Urgent]: '#ef4444',
};

export function AgendaView({
  currentDate,
  reminders,
  onReminderClick,
  onNewReminder,
}: AgendaViewProps) {
  const days = eachDayOfInterval({
    start: currentDate,
    end: addDays(currentDate, 13),
  });

  const daysWithReminders = days
    .map((day) => ({
      day,
      dayReminders: reminders
        .filter((r) => isSameDay(new Date(r.startDateTime), day))
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
    }))
    .filter(({ dayReminders }) => dayReminders.length > 0);

  if (daysWithReminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          No hay avisos en los próximos 14 días.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {daysWithReminders.map(({ day, dayReminders }) => (
        <div key={day.toISOString()}>
          {/* Day header */}
          <div className="mb-2 flex items-center justify-between">
            <h3
              className={cn(
                'text-sm font-semibold capitalize',
                isToday(day)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {format(day, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            <button
              onClick={() => onNewReminder(day)}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              title="Nuevo aviso en este día"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Reminders for the day */}
          <div className="space-y-1.5 pl-1">
            {dayReminders.map((reminder) => (
              <div
                key={reminder.id}
                onClick={() => onReminderClick(reminder)}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                {/* Priority dot */}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      reminder.categoryColor ??
                      priorityColor[reminder.priority] ??
                      '#94a3b8',
                  }}
                />

                {/* Time */}
                <span className="w-16 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {reminder.isAllDay
                    ? 'Todo el día'
                    : format(new Date(reminder.startDateTime), 'HH:mm')}
                </span>

                {/* Title */}
                <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {reminder.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
