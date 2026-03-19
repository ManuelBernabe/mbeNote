import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useReminder } from '../../hooks/useReminders';
import { ReminderDetail } from './components/ReminderDetail';
import { ReminderForm } from './components/ReminderForm';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function ReminderOpenPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: reminder, isLoading, isError } = useReminder(id);
  const [showEdit, setShowEdit] = useState(false);

  const goBack = () => navigate('/reminders', { replace: true });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !reminder) {
    // Reminder not found or error — go to reminders list
    navigate('/reminders', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {!showEdit && (
        <ReminderDetail
          reminder={reminder}
          onClose={goBack}
          onEdit={() => setShowEdit(true)}
          onRefresh={() => {
            qc.invalidateQueries({ queryKey: ['reminders'] });
          }}
        />
      )}
      {showEdit && (
        <ReminderForm
          reminder={reminder}
          onClose={goBack}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['reminders'] });
            toast.success('Aviso actualizado');
            goBack();
          }}
        />
      )}
    </div>
  );
}
