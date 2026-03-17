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
import { ReminderPriority, NotificationChannel } from '../../../types';
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
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  reminder?: ReminderResponse | null;
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
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 1440, label: '1 día' },
];

export function ReminderForm({ reminder, onClose, onSaved }: ReminderFormProps) {
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
        ? new Date(reminder.startDateTime).toISOString().slice(0, 16)
        : '',
      endDateTime: reminder?.endDateTime
        ? new Date(reminder.endDateTime).toISOString().slice(0, 16)
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
    },
  });

  const watchPriority = watch('priority');
  const watchNotifyMinutes = watch('notifyMinutesBefore');
  const watchIsAllDay = watch('isAllDay');

  const onSubmit = async (data: ReminderFormData) => {
    try {
      // Send datetime as-is (local time string) so the backend stores the user's intended time
      const startDt = data.startDateTime; // "2026-03-17T18:00"
      const endDt = data.endDateTime || null;

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
        notificationOffsets: JSON.stringify([data.notifyMinutesBefore]),
        notificationChannels: NotificationChannel.InApp,
      };

      if (isEditing && reminder) {
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
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Título
              </label>
              <input
                {...register('title')}
                placeholder="Nombre del aviso"
                className="input-field"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Descripción opcional..."
                className="input-field resize-none"
              />
            </div>

            {/* All day toggle */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register('isAllDay')}
                className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Todo el día
              </span>
            </label>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Inicio
                </label>
                <input
                  type={watchIsAllDay ? 'date' : 'datetime-local'}
                  {...register('startDateTime')}
                  className="input-field"
                />
                {errors.startDateTime && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.startDateTime.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fin
                </label>
                <input
                  type={watchIsAllDay ? 'date' : 'datetime-local'}
                  {...register('endDateTime')}
                  className="input-field"
                />
              </div>
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
