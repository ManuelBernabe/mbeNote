import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGlobalHistory } from '../../hooks/useHistory';
import { HistoryAction } from '../../types';
import { HistoryTimeline } from './components/HistoryTimeline';

const actionTypes = [
  { value: 'all', label: 'Todas' },
  { value: String(HistoryAction.Created), label: 'Creado' },
  { value: String(HistoryAction.Updated), label: 'Actualizado' },
  { value: String(HistoryAction.Completed), label: 'Completado' },
  { value: String(HistoryAction.Deleted), label: 'Eliminado' },
  { value: String(HistoryAction.Snoozed), label: 'Pospuesto' },
  { value: String(HistoryAction.Restored), label: 'Restaurado' },
];

export function HistoryPage() {
  const { data: historyData } = useGlobalHistory();
  const history = historyData?.items ?? [];

  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return history.filter((entry) => {
      if (actionFilter !== 'all' && String(entry.action) !== actionFilter) return false;
      if (dateFrom && new Date(entry.timestamp) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (new Date(entry.timestamp) > to) return false;
      }
      return true;
    });
  }, [history, actionFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Historial
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Registro de todas las acciones realizadas
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />

          <div className="flex flex-wrap gap-1.5">
            {actionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setActionFilter(type.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  actionFilter === type.value
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-xs text-slate-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-16 text-center"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Calendar className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            No hay entradas en el historial
          </p>
        </motion.div>
      ) : (
        <HistoryTimeline entries={filtered} />
      )}
    </div>
  );
}
