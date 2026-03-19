import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlarmClock } from 'lucide-react';
import { toast } from 'sonner';
import { useSnoozeReminder } from '../../../hooks/useReminders';

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '2 horas', minutes: 120 },
  { label: '4 horas', minutes: 240 },
  { label: 'Mañana', minutes: 1440 },
];

interface SnoozePickerModalProps {
  reminderId: number;
  reminderTitle: string;
  onClose: () => void;
  onSnoozed?: () => void;
}

export function SnoozePickerModal({ reminderId, reminderTitle, onClose, onSnoozed }: SnoozePickerModalProps) {
  const snoozeMutation = useSnoozeReminder();
  const [customMinutes, setCustomMinutes] = useState('');

  const handleSnooze = async (minutes: number) => {
    try {
      await snoozeMutation.mutateAsync({ id: String(reminderId), data: { minutes } });
      toast.success(`"${reminderTitle}" pospuesto ${minutes < 60 ? `${minutes} min` : minutes === 1440 ? '1 día' : `${minutes / 60}h`}`);
      onSnoozed?.();
      onClose();
    } catch {
      toast.error('Error al posponer');
    }
  };

  const handleCustom = () => {
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins < 1) { toast.error('Introduce un número válido'); return; }
    handleSnooze(mins);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlarmClock className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-white">Posponer aviso</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">"{reminderTitle}"</p>

          {/* Preset grid */}
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => handleSnooze(p.minutes)}
                disabled={snoozeMutation.isPending}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              placeholder="Minutos personalizados"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
              className="input-field flex-1 text-sm"
            />
            <button
              onClick={handleCustom}
              disabled={snoozeMutation.isPending || !customMinutes}
              className="btn-secondary shrink-0 text-sm disabled:opacity-40"
            >
              OK
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
