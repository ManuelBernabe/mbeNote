import React from 'react';
import {
  Check,
  Clock,
  Edit3,
  Trash2,
  Repeat,
  MapPin,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { useCompleteReminder, useSnoozeReminder, useDeleteReminder } from '../../../hooks/useReminders';
import { ReminderPriority, ReminderStatus } from '../../../types';
import type { ReminderResponse } from '../../../types';

const priorityConfig: Record<number, { label: string; color: string; bg: string }> = {
  [ReminderPriority.Urgent]: {
    label: 'Urgente',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-500/20',
  },
  [ReminderPriority.High]: {
    label: 'Alta',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-500/20',
  },
  [ReminderPriority.Medium]: {
    label: 'Media',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/20',
  },
  [ReminderPriority.Low]: {
    label: 'Baja',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/20',
  },
};

const statusConfig: Record<number, { label: string; dot: string }> = {
  [ReminderStatus.Active]: { label: 'Activo', dot: 'bg-emerald-500' },
  [ReminderStatus.Completed]: { label: 'Completado', dot: 'bg-blue-500' },
  [ReminderStatus.Cancelled]: { label: 'Cancelado', dot: 'bg-slate-400' },
  [ReminderStatus.Snoozed]: { label: 'Pospuesto', dot: 'bg-violet-500' },
};

interface ReminderCardProps {
  reminder: ReminderResponse;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDetail: () => void;
  onRefresh: () => void;
}

export function ReminderCard({
  reminder,
  viewMode,
  onEdit,
  onDetail,
  onRefresh,
}: ReminderCardProps) {
  const completeMutation = useCompleteReminder();
  const snoozeMutation = useSnoozeReminder();
  const deleteMutation = useDeleteReminder();

  const date = new Date(reminder.startDateTime);
  const isOverdue = isPast(date) && reminder.status === ReminderStatus.Active;
  const priority = priorityConfig[reminder.priority] ?? priorityConfig[ReminderPriority.Medium];
  const status = statusConfig[reminder.status] ?? statusConfig[ReminderStatus.Active];

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await completeMutation.mutateAsync(String(reminder.id));
      toast.success('Aviso completado');
    } catch {
      toast.error('Error al completar');
    }
  };

  const handleSnooze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await snoozeMutation.mutateAsync({
        id: String(reminder.id),
        data: { minutes: 15 },
      });
      toast.success('Pospuesto 15 minutos');
    } catch {
      toast.error('Error al posponer');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(String(reminder.id));
      toast.success('Aviso eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onDetail}
        className={cn(
          'card group flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-soft',
          isOverdue && 'border-red-200 dark:border-red-500/20'
        )}
      >
        {/* Category color strip */}
        <div
          className="h-10 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: reminder.categoryColor ?? '#94a3b8' }}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {reminder.title}
            </p>
            {reminder.recurrenceRule && (
              <Repeat className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className={isOverdue ? 'text-red-500' : ''}>
              {isToday(date) ? 'Hoy' : format(date, 'd MMM', { locale: es })} &middot;{' '}
              {reminder.isAllDay ? 'Todo el día' : format(date, 'HH:mm')}
            </span>
            {reminder.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {reminder.location}
              </span>
            )}
          </div>
        </div>

        {/* Priority badge */}
        <span
          className={cn(
            'hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block',
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>

        {/* Status dot */}
        <div className="flex items-center gap-1.5">
          <div className={cn('h-2 w-2 rounded-full', status.dot)} />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {reminder.status !== ReminderStatus.Completed && (
            <button
              onClick={handleComplete}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
              title="Completar"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSnooze}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
            title="Posponer"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
            title="Editar"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onDetail}
      className={cn(
        'card group cursor-pointer overflow-hidden transition-all hover:shadow-soft',
        isOverdue && 'border-red-200 dark:border-red-500/20'
      )}
    >
      {/* Category color strip */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: reminder.categoryColor ?? '#94a3b8' }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
            {reminder.title}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              priority.bg,
              priority.color
            )}
          >
            {priority.label}
          </span>
        </div>

        {/* Description */}
        {reminder.description && (
          <p className="mb-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {reminder.description}
          </p>
        )}

        {/* Date & status */}
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'font-medium',
              isOverdue
                ? 'text-red-500'
                : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {isToday(date) ? 'Hoy' : format(date, 'd MMM', { locale: es })} &middot;{' '}
            {reminder.isAllDay ? 'Todo el día' : format(date, 'HH:mm')}
          </span>
          <div className="flex items-center gap-1">
            <div className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            <span className="text-slate-400 dark:text-slate-500">
              {status.label}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          {reminder.recurrenceRule && (
            <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Repeat className="h-3 w-3" /> Recurrente
            </span>
          )}
          {reminder.location && (
            <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <MapPin className="h-3 w-3" /> {reminder.location}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
          {reminder.status !== ReminderStatus.Completed && (
            <button
              onClick={handleComplete}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
              title="Completar"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleSnooze}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
            title="Posponer"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
            title="Editar"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
