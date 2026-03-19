import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Bell, Calendar, Clock, BarChart3, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReminders } from '../../hooks/useReminders';
import { ReminderPriority } from '../../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const priorityLabel: Record<number, { label: string; classes: string }> = {
  [ReminderPriority.Low]:    { label: 'Baja',    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  [ReminderPriority.Medium]: { label: 'Media',   classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' },
  [ReminderPriority.High]:   { label: 'Alta',    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  [ReminderPriority.Urgent]: { label: 'Urgente', classes: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
};

const navLinks = [
  { to: '/',          icon: LayoutDashboard, label: 'Inicio' },
  { to: '/reminders', icon: Bell,            label: 'Avisos' },
  { to: '/calendar',  icon: Calendar,        label: 'Calendario' },
  { to: '/history',   icon: Clock,           label: 'Historial' },
  { to: '/analytics', icon: BarChart3,       label: 'Analítica' },
  { to: '/settings',  icon: Settings,        label: 'Ajustes' },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data } = useReminders({ pageSize: 200 });
  const reminders = data?.items ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return reminders
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, reminders]);

  // Reset query when palette opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSelectReminder = (id: number) => {
    navigate(`/reminders?open=${id}`);
    onClose();
  };

  const handleSelectNav = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="cp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar avisos..."
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white"
              />
              <kbd className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline">
                ESC
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* Reminder results */}
              {filtered.length > 0 && (
                <div className="py-2">
                  <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Avisos
                  </p>
                  {filtered.map((r) => {
                    const dotColor = r.color || r.categoryColor || '#94a3b8';
                    const prio = priorityLabel[r.priority];
                    let dateStr = '';
                    try {
                      dateStr = format(new Date(r.startDateTime), "d MMM yyyy, HH:mm", { locale: es });
                    } catch {
                      dateStr = r.startDateTime;
                    }
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleSelectReminder(r.id)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span
                          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {r.title}
                          </p>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {dateStr}
                          </p>
                        </div>
                        {prio && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${prio.classes}`}>
                            {prio.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {query.trim() && filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No se encontraron resultados
                </div>
              )}

              {/* Empty state */}
              {!query.trim() && (
                <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  Escribe para buscar avisos...
                </div>
              )}

              {/* Navigation shortcuts */}
              <div className="border-t border-slate-100 py-2 dark:border-slate-800">
                <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Páginas
                </p>
                {navLinks.map((link) => (
                  <button
                    key={link.to}
                    onClick={() => handleSelectNav(link.to)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <link.icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
