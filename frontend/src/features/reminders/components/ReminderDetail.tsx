import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlarmClock,
  ExternalLink,
  FileText,
  Share2,
  UserPlus,
} from 'lucide-react';
import { format, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { RRule } from 'rrule';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../lib/utils';
import { useCompleteReminder, useDeleteReminder, useSnoozeReminder } from '../../../hooks/useReminders';
import { ReminderPriority, ReminderStatus } from '../../../types';
import type { ReminderResponse } from '../../../types';
import * as api from '../../../services/api';

const priorityConfig: Record<number, { label: string; color: string; bg: string }> = {
  [ReminderPriority.Urgent]: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' },
  [ReminderPriority.High]: { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-500/20' },
  [ReminderPriority.Medium]: { label: 'Media', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  [ReminderPriority.Low]: { label: 'Baja', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
};

const SNOOZE_PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '2 horas', minutes: 120 },
  { label: '4 horas', minutes: 240 },
  { label: 'Mañana', minutes: 1440 },
];

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
  const snoozeMutation = useSnoozeReminder();
  const priority = priorityConfig[reminder.priority] ?? priorityConfig[ReminderPriority.Medium];
  const queryClient = useQueryClient();

  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showShareSection, setShowShareSection] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const { data: shares = [] } = useQuery({
    queryKey: ['shares', reminder.id],
    queryFn: () => api.getShares(String(reminder.id)),
    enabled: showShareSection,
  });

  const shareMutation = useMutation({
    mutationFn: (data: { targetEmail: string; permission: number }) =>
      api.shareReminder(String(reminder.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', reminder.id] });
      setShareEmail('');
      toast.success('Aviso compartido');
    },
    onError: () => toast.error('Error al compartir'),
  });

  const unshareMutation = useMutation({
    mutationFn: (shareId: number) =>
      api.unshareReminder(String(reminder.id), shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', reminder.id] });
      toast.success('Acceso revocado');
    },
    onError: () => toast.error('Error al revocar acceso'),
  });

  const handleShare = () => {
    if (!shareEmail.trim()) return;
    shareMutation.mutate({ targetEmail: shareEmail.trim(), permission: 0 });
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(String(reminder.id));
      toast.success('Aviso completado');
      onRefresh();
      onClose();
    } catch {
      toast.error('Error al completar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(String(reminder.id));
      toast.success('Aviso eliminado');
      onRefresh();
      onClose();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (!minutes || minutes < 1) return;
    try {
      await snoozeMutation.mutateAsync({ id: String(reminder.id), data: { minutes } });
      toast.success(`Pospuesto ${minutes < 60 ? `${minutes} min` : `${minutes / 60}h`}`);
      onRefresh();
      onClose();
    } catch {
      toast.error('Error al posponer');
    }
  };

  const handleCustomSnooze = () => {
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins < 1) {
      toast.error('Introduce un número válido de minutos');
      return;
    }
    handleSnooze(mins);
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
          style={{ backgroundColor: reminder.categoryColor ?? '#3b82f6' }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priority.bg, priority.color)}>
                {priority.label}
              </span>
              {reminder.status === ReminderStatus.Completed && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Completado
                </span>
              )}
              {reminder.status === ReminderStatus.Snoozed && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  Pospuesto
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
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-300">
                {format(new Date(reminder.startDateTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>

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

            {reminder.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{reminder.location}</span>
              </div>
            )}

            {reminder.categoryName && (
              <div className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-slate-400" />
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: reminder.categoryColor ?? '#94a3b8' }}
                  />
                  <span className="text-slate-700 dark:text-slate-300">{reminder.categoryName}</span>
                </div>
              </div>
            )}

            {reminder.recurrenceRule && (
              <div className="flex items-center gap-3 text-sm">
                <Repeat className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Recurrente</span>
              </div>
            )}

            {reminder.recurrenceRule && (() => {
              try {
                const rule = RRule.fromString(reminder.recurrenceRule);
                const dates = rule.between(new Date(), addYears(new Date(), 2)).slice(0, 5);
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Próximas fechas
                    </p>
                    {dates.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin ocurrencias futuras</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {dates.map((date, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          >
                            {format(date, "d MMM yyyy · HH:mm", { locale: es })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } catch {
                return null;
              }
            })()}

            {reminder.notificationOffsets && reminder.notificationOffsets !== '[]' && (
              <div className="flex items-center gap-3 text-sm">
                <Bell className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Notificación configurada</span>
              </div>
            )}
          </div>

          {/* Links and notes */}
          {reminder.links && reminder.links !== '[]' && (() => {
            try {
              const links: string[] = JSON.parse(reminder.links);
              if (!links.length) return null;
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Notas y enlaces
                  </p>
                  <div className="space-y-1.5">
                    {links.map((item, idx) =>
                      item.startsWith('http') ? (
                        <a
                          key={idx}
                          href={item}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-500 hover:underline break-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {item}
                        </a>
                      ) : (
                        <p key={idx} className="flex items-start gap-1 text-sm text-slate-600 dark:text-slate-400 break-all">
                          <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                          {item}
                        </p>
                      )
                    )}
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })()}

          {/* Share section */}
          <AnimatePresence>
            {showShareSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                  <p className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">
                    Compartir aviso
                  </p>
                  {shares.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {shares.map((share) => (
                        <div key={share.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-800">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {share.sharedWithDisplayName}
                            </p>
                            <p className="text-xs text-slate-400">{share.sharedWithEmail}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              share.permission === 0
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            )}>
                              {share.permission === 0 ? 'Ver' : 'Editar'}
                            </span>
                            <button
                              onClick={() => unshareMutation.mutate(share.id)}
                              disabled={unshareMutation.isPending}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                      className="input-field flex-1 text-sm"
                    />
                    <button
                      onClick={handleShare}
                      disabled={shareMutation.isPending || !shareEmail.trim()}
                      className="btn-primary shrink-0 gap-1.5 text-sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      Compartir
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Snooze picker */}
          <AnimatePresence>
            {showSnoozePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-300">
                    ¿Cuánto tiempo posponer?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {SNOOZE_PRESETS.map((preset) => (
                      <button
                        key={preset.minutes}
                        onClick={() => handleSnooze(preset.minutes)}
                        disabled={snoozeMutation.isPending}
                        className="rounded-lg border border-amber-300 bg-white px-2 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/40 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-amber-500/20"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Minutos personalizados"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomSnooze()}
                      className="input-field flex-1 text-sm"
                    />
                    <button
                      onClick={handleCustomSnooze}
                      disabled={snoozeMutation.isPending}
                      className="btn-secondary shrink-0 text-sm"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          {reminder.status !== ReminderStatus.Completed && (
            <button onClick={handleComplete} className="btn-primary gap-2 flex-1">
              <Check className="h-4 w-4" /> Completar
            </button>
          )}
          <button
            onClick={() => setShowSnoozePicker((v) => !v)}
            className={cn(
              'btn-secondary gap-2',
              showSnoozePicker && 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-300'
            )}
          >
            <AlarmClock className="h-4 w-4" />
            <span className="hidden sm:inline">Posponer</span>
          </button>
          <button
            onClick={() => setShowShareSection((v) => !v)}
            className={cn(
              'btn-secondary gap-2',
              showShareSection && 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/40 dark:text-blue-300'
            )}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={onEdit} className="btn-secondary gap-2">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="btn-danger gap-2">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
