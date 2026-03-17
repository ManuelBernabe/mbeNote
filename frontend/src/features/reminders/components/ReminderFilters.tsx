import React from 'react';
import { Search, X } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';
import { ReminderStatus, ReminderPriority } from '../../../types';

interface ReminderFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: String(ReminderStatus.Active), label: 'Activo' },
  { value: String(ReminderStatus.Completed), label: 'Completado' },
  { value: String(ReminderStatus.Snoozed), label: 'Pospuesto' },
  { value: String(ReminderStatus.Cancelled), label: 'Cancelado' },
];

const priorityOptions = [
  { value: 'all', label: 'Todas las prioridades' },
  { value: String(ReminderPriority.Urgent), label: 'Urgente' },
  { value: String(ReminderPriority.High), label: 'Alta' },
  { value: String(ReminderPriority.Medium), label: 'Media' },
  { value: String(ReminderPriority.Low), label: 'Baja' },
];

export function ReminderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  category,
  onCategoryChange,
}: ReminderFiltersProps) {
  const { data: categories = [] } = useCategories();
  const hasFilters =
    search || status !== 'all' || priority !== 'all' || category !== 'all';

  const clearAll = () => {
    onSearchChange('');
    onStatusChange('all');
    onPriorityChange('all');
    onCategoryChange('all');
  };

  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar avisos..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {priorityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
