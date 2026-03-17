import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
  getHours,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useReminders } from '../../hooks/useReminders';
import { useUIStore, type CalendarView } from '../../stores/uiStore';
import type { ReminderResponse } from '../../types';
import { ReminderForm } from '../reminders/components/ReminderForm';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarPage() {
  const { data: remindersData } = useReminders();
  const reminders = remindersData?.items ?? [];
  const { calendarView, setCalendarView } = useUIStore();
  const view: CalendarView = calendarView;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    if (view === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const goNext = () => {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleSlotClick = () => {
    setShowForm(true);
  };

  const getRemindersForDay = useCallback(
    (day: Date): ReminderResponse[] =>
      reminders.filter((r) =>
        isSameDay(new Date(r.startDateTime), day)
      ),
    [reminders]
  );

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const title = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  }, [currentDate, view]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg font-semibold capitalize text-slate-900 dark:text-white">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn-secondary text-xs">
            Hoy
          </button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  view === v
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                )}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {day}
                  </div>
                )
              )}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayReminders = getRemindersForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div
                    key={i}
                    onClick={handleSlotClick}
                    className={cn(
                      'min-h-[80px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50',
                      !isCurrentMonth && 'bg-slate-50/50 dark:bg-slate-900/50',
                      i % 7 === 6 && 'border-r-0'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                        isToday(day)
                          ? 'bg-blue-500 text-white'
                          : isCurrentMonth
                          ? 'text-slate-900 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayReminders.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
                          style={{
                            backgroundColor: r.category?.color ?? '#3b82f6',
                          }}
                        >
                          {r.title}
                        </div>
                      ))}
                      {dayReminders.length > 3 && (
                        <span className="block text-center text-[10px] text-slate-400">
                          +{dayReminders.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="overflow-auto">
            <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="border-r border-slate-200 dark:border-slate-700" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-r border-slate-100 px-2 py-2 text-center last:border-r-0 dark:border-slate-800"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p
                    className={cn(
                      'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday(day)
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="flex h-14 items-start justify-end border-r border-slate-200 pr-2 pt-1 text-[10px] text-slate-400 dark:border-slate-700">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day) => {
                    const slotReminders = getRemindersForDay(day).filter(
                      (r) => getHours(new Date(r.startDateTime)) === hour
                    );
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        onClick={handleSlotClick}
                        className="h-14 cursor-pointer border-b border-r border-slate-100 p-0.5 transition-colors last:border-r-0 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-blue-500/5"
                      >
                        {slotReminders.map((r) => (
                          <div
                            key={r.id}
                            className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                            style={{
                              backgroundColor: r.category?.color ?? '#3b82f6',
                            }}
                          >
                            {r.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="overflow-auto">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {HOURS.map((hour) => {
                const hourReminders = getRemindersForDay(currentDate).filter(
                  (r) => getHours(new Date(r.startDateTime)) === hour
                );
                return (
                  <div
                    key={hour}
                    onClick={handleSlotClick}
                    className="flex min-h-[56px] cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
                  >
                    <div className="flex w-16 shrink-0 items-start justify-end border-r border-slate-200 pr-3 pt-2 text-xs text-slate-400 dark:border-slate-700">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 p-1.5">
                      {hourReminders.map((r) => (
                        <div
                          key={r.id}
                          className="mb-1 rounded-lg px-3 py-2 text-sm font-medium text-white"
                          style={{
                            backgroundColor: r.category?.color ?? '#3b82f6',
                          }}
                        >
                          <p>{r.title}</p>
                          <p className="text-xs opacity-80">
                            {format(new Date(r.startDateTime), 'HH:mm')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <ReminderForm
            onClose={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
