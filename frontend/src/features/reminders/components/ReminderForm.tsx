import React from 'react';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { useCategories } from '../../../hooks/useCategories';
import { useCreateReminder, useUpdateReminder } from '../../../hooks/useReminders';
import { ReminderPriority, NotificationChannel, ReminderStatus } from '../../../types';
import type { ReminderResponse } from '../../../types';
import { RecurrenceBuilder } from './RecurrenceBuilder';

const reminderSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  startDateTime: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDateTime: z.string().optional(),
  isAllDay: z.boolean(),
  priority: z.number(),
  categoryId: z.string().optional(),
  location: z.string().optional(),
  recurrenceRule: z.string().optional(),
  notifyMinutesBefore: z.number(),
  sendEmail: z.boolean(),
  color: z.string().optional(),
  linksRaw: z.string().optional(),
});

const COLOR_SWATCHES = [
  '#3b82f6', // azul
  '#22c55e', // verde
  '#ef4444', // rojo
  '#f97316', // naranja
  '#a855f7', // morado
  '#ec4899', // rosa
  '#eab308', // amarillo
  '#94a3b8', // gris
];

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  reminder?: ReminderResponse | null;
  initialDate?: Date | null;
  onClose: () => void;
  onSaved: () => void;
}

const priorityOptions = [
  { value: ReminderPriority.Low, label: 'Baja', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' },
  { value: ReminderPriority.Medium, label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' },
  { value: ReminderPriority.High, label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30' },
  { value: ReminderPriority.Urgent, label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
];

const notificationPresets = [
  { value: 0, label: 'No recordar' },
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 1440, label: '1 día' },
];

export function ReminderForm({ reminder, initialDate, onClose, onSaved }: ReminderFormProps) {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();
  const isEditing = !!reminder;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: reminder?.title ?? '',
      description: reminder?.description ?? '',
      startDateTime: reminder?.startDateTime
        ? reminder.startDateTime.slice(0, 16)
        : initialDate
        ? `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}T09:00`
        : '',
      endDateTime: reminder?.endDateTime
        ? reminder.endDateTime.slice(0, 16)
        : '',
      isAllDay: reminder?.isAllDay ?? false,
      priority: reminder?.priority ?? ReminderPriority.Medium,
      categoryId: reminder?.categoryId != null ? String(reminder.categoryId) : '',
      location: reminder?.location ?? '',
      recurrenceRule: reminder?.recurrenceRule ?? '',
      notifyMinutesBefore: (() => {
        try {
          const offsets = JSON.parse(reminder?.notificationOffsets ?? '[]');
          return Array.isArray(offsets) && offsets.length > 0 ? offsets[0] : 15;
        } catch {
          return 15;
        }
      })(),
      sendEmail: reminder?.notificationChannels
        ? !!(reminder.notificationChannels & NotificationChannel.Email)
        : false,
      color: reminder?.color ?? '#3b82f6',
      linksRaw: (() => {
        try {
          const a = JSON.parse(reminder?.links ?? '[]');
          return Array.isArray(a) ? a.join('\n') : '';
        } catch {
          return '';
        }
      })(),
    },
  });

  const watchPriority = watch('priority');
  const watchNotifyMinutes = watch('notifyMinutesBefore');
  const watchIsAllDay = watch('isAllDay');
  const watchSendEmail = watch('sendEmail');
  const watchColor = watch('color');

  const isPastOrDone = isEditing && !!reminder && (
    reminder.status === ReminderStatus.Completed ||
    reminder.status === ReminderStatus.Cancelled
  );

  const onSubmit = async (data: ReminderFormData) => {
    try {
      // Send datetime as-is (local time string) so the backend stores the user's intended time
      const startDt = data.startDateTime; // "2026-03-17T18:00"
      const endDt = data.endDateTime || null;

      const linksArr = (data.linksRaw ?? '').split('\n').map(s => s.trim()).filter(Boolean);

      const payload: any = {
        title: data.title,
        description: data.description || null,
        startDateTime: startDt,
        endDateTime: endDt,
        isAllDay: data.isAllDay,
        priority: data.priority as ReminderPriority,
        categoryId: data.categoryId ? parseInt(data.categoryId, 10) : null,
        location: data.location || null,
        recurrenceRule: data.recurrenceRule || null,
        notificationOffsets: data.notifyMinutesBefore > 0 ? JSON.stringify([data.notifyMinutesBefore]) : '[]',
        notificationChannels: data.notifyMinutesBefore > 0
          ? NotificationChannel.InApp | (data.sendEmail ? NotificationChannel.Email : 0)
          : 0,
        color: data.color,
        links: linksArr.length > 0 ? JSON.stringify(linksArr) : null,
      };

      if (isEditing && reminder) {
        if (isPastOrDone) {
          payload.status = ReminderStatus.Active;
        }
        await updateMutation.mutateAsync({ id: String(reminder.id), data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al guardar el aviso');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Editar aviso' : 'Nuevo aviso'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[70vh] overflow-y-auto p-6"
        >
          <div className="space-y-4">
            {/* Reactivation banner */}
            {isPastOrDone && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                🔄 Al guardar con una nueva fecha, el aviso se <strong>reactivará</strong> automáticamente.
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Título *
              </label>
              <input
                {...register('title')}
                placeholder="Nombre del aviso"
                className="input-field"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Date/Time - PROMINENT */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  📅 Fecha y hora *
                </span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isAllDay')}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Todo el día
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Inicio
                  </label>
                  <input
                    type={watchIsAllDay ? 'date' : 'datetime-local'}
                    {...register('startDateTime')}
                    className="input-field text-sm"
                  />
                  {errors.startDateTime && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.startDateTime.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Fin (opcional)
                  </label>
                  <input
                    type={watchIsAllDay ? 'date' : 'datetime-local'}
                    {...register('endDateTime')}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripción
              </label>
              <input
                {...register('description')}
                placeholder="Descripción opcional..."
                className="input-field"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Prioridad
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('priority', opt.value)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                      watchPriority === opt.value
                        ? opt.color
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Categoría
              </label>
              <select {...register('categoryId')} className="input-field">
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('location')}
                  placeholder="Ubicación opcional"
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Recurrence */}
            <Controller
              name="recurrenceRule"
              control={control}
              render={({ field }) => (
                <RecurrenceBuilder
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Color */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Color del aviso
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setValue('color', hex)}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-all',
                      watchColor === hex
                        ? 'scale-110 border-slate-700 dark:border-white'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
                <input
                  type="color"
                  value={watchColor ?? '#3b82f6'}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-full border-2 border-slate-200 bg-transparent p-0 dark:border-slate-600"
                  title="Color personalizado"
                />
              </div>
            </div>

            {/* Notification timing */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notificar antes
              </label>
              <div className="flex flex-wrap gap-2">
                {notificationPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setValue('notifyMinutesBefore', preset.value)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                      watchNotifyMinutes === preset.value
                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {watchNotifyMinutes > 0 && (
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('sendEmail')}
                    className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Enviar también por correo
                  </span>
                </label>
              )}
            </div>

            {/* Links and notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Notas y enlaces (uno por línea)
              </label>
              <textarea
                {...register('linksRaw')}
                rows={2}
                placeholder="https://... o nota libre"
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Guardar cambios' : 'Crear aviso'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
