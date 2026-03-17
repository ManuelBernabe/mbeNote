import React, { useState, useCallback } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import * as api from '../../../services/api';
import { useCreateReminder } from '../../../hooks/useReminders';
import { NotificationChannel, ReminderPriority } from '../../../types';

export function QuickActions() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const createMutation = useCreateReminder();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;

      setIsProcessing(true);
      try {
        // Try natural language parsing first
        const parsed = await api.parseNaturalLanguage({ text });
        await createMutation.mutateAsync({
          title: parsed.title,
          description: parsed.description,
          startDateTime: parsed.startDateTime,
          endDateTime: parsed.endDateTime,
          priority: parsed.priority ?? ReminderPriority.Medium,
          recurrenceRule: parsed.recurrenceRule,
          location: parsed.location,
          notificationChannels: NotificationChannel.InApp,
          notifyMinutesBefore: 15,
        });
        toast.success(`Aviso creado: "${parsed.title}"`);
        setInput('');
      } catch {
        // Fallback: create a simple reminder
        try {
          await createMutation.mutateAsync({
            title: text,
            startDateTime: new Date().toISOString(),
            priority: ReminderPriority.Medium,
            notificationChannels: NotificationChannel.InApp,
            notifyMinutesBefore: 15,
          });
          toast.success(`Aviso creado: "${text}"`);
          setInput('');
        } catch {
          toast.error('No se pudo crear el aviso');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [input, createMutation]
  );

  return (
    <form onSubmit={handleSubmit} className="card p-1.5">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Añade rápido... ej: "Reunión mañana a las 10"'
          className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all',
            input.trim()
              ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Añadir</span>
        </button>
      </div>
    </form>
  );
}
