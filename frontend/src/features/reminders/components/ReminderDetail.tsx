import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Repeat,
  Bell,
  Tag,
  Clock,
  Edit3,
  Check,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { useCompleteReminder, useDeleteReminder } from '../../../hooks/useReminders';
import { ReminderPriority, ReminderStatus } from '../../../types';
import type { ReminderResponse } from '../../../types';

const priorityConfig: Record<number, { label: string; color: string; bg: string }> = {
  [ReminderPriority.Urgent]: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' },
  [ReminderPriority.High]: { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-500/20' },
  [ReminderPriority.Medium]: { label: 'Media', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  [ReminderPriority.Low]: { label: 'Baja', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
};

interface ReminderDetailProps {
  reminder: ReminderResponse;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export function ReminderDetail({
  reminder,
  onClose,
  onEdit,
  onRefresh,
}: ReminderDetailProps) {
  const completeMutation = useCompleteReminder();
  const deleteMutation = useDeleteReminder();
  const priority = priorityConfig[reminder.priority] ?? priorityConfig[ReminderPriority.Medium];

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(reminder.id);
      toast.success('Aviso completado');
      onRefresh();
      onClose();
    } catch {
      toast.error('Error al completar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(reminder.id);
      toast.success('Aviso eliminado');
      onRefresh();
      onClose();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Color strip */}
        <div
          className="h-2 w-full"
          style={{
            backgroundColor: reminder.category?.color ?? '#3b82f6',
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  priority.bg,
                  priority.color
                )}
              >
                {priority.label}
              </span>
              {reminder.status === ReminderStatus.Completed && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Completado
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
              {reminder.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {reminder.description && (
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {reminder.description}
            </p>
          )}

          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {format(new Date(reminder.startDateTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>

            {/* Time */}
            {!reminder.isAllDay && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  {format(new Date(reminder.startDateTime), 'HH:mm')}
                  {reminder.endDateTime && (
                    <> - {format(new Date(reminder.endDateTime), 'HH:mm')}</>
                  )}
                </span>
              </div>
            )}

            {/* Location */}
            {reminder.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  {reminder.location}
                </span>
              </div>
            )}

            {/* Category */}
            {reminder.category && (
              <div className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-slate-400" />
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: reminder.category.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    {reminder.category.name}
                  </span>
                </div>
              </div>
            )}

            {/* Recurrence */}
            {reminder.recurrenceRule && (
              <div className="flex items-center gap-3 text-sm">
                <Repeat className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  Recurrente
                </span>
              </div>
            )}

            {/* Notification */}
            {reminder.notifyMinutesBefore > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Bell className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">
                  {reminder.notifyMinutesBefore >= 1440
                    ? `${reminder.notifyMinutesBefore / 1440} día(s)`
                    : reminder.notifyMinutesBefore >= 60
                    ? `${reminder.notifyMinutesBefore / 60} hora(s)`
                    : `${reminder.notifyMinutesBefore} min`}{' '}
                  antes
                </span>
              </div>
            )}

            {/* Tags */}
            {reminder.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {reminder.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          {reminder.status !== ReminderStatus.Completed && (
            <button onClick={handleComplete} className="btn-primary gap-2 flex-1">
              <Check className="h-4 w-4" /> Completar
            </button>
          )}
          <button onClick={onEdit} className="btn-secondary gap-2">
            <Edit3 className="h-4 w-4" /> Editar
          </button>
          <button onClick={handleDelete} className="btn-danger gap-2">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
