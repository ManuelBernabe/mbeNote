import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../../lib/utils';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
  useDeleteAllNotifications,
} from '../../../hooks/useNotifications';
import type { NotificationResponse } from '../../../types';
import { toast } from 'sonner';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data: notificationsData } = useNotifications();
  const notifications = notificationsData?.items ?? [];
  const markReadMutation = useMarkAsRead();
  const markAllReadMutation = useMarkAllAsRead();
  const deleteMutation = useDismissNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  // Group by date
  const grouped = notifications.reduce(
    (acc: Record<string, NotificationResponse[]>, n) => {
      const dateKey = format(new Date(n.sentAt ?? n.scheduledAt), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(n);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;
    deleteAllMutation.mutate(undefined, {
      onSuccess: () => toast.success('Notificaciones eliminadas'),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Notificaciones
        </h3>
        <div className="flex items-center gap-1">
          {notifications.some((n) => !n.readAt) && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Leídas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Borrar todas las notificaciones"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Borrar
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Bell className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">Sin notificaciones</p>
          </div>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="sticky top-0 bg-slate-50 px-4 py-1.5 dark:bg-slate-800/80">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {getDateLabel(dateKey)}
                </span>
              </div>
              {grouped[dateKey].map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.readAt) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                  className={cn(
                    'group flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    !notification.readAt &&
                      'bg-blue-50/50 dark:bg-blue-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm',
                        notification.readAt
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'font-medium text-slate-900 dark:text-white'
                      )}
                    >
                      {notification.reminderTitle}
                    </p>
                    {notification.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      {format(new Date(notification.sentAt ?? notification.scheduledAt), 'HH:mm')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.readAt && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="rounded p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10"
                      title="Borrar notificación"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
