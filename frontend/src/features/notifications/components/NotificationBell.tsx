import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNotificationStore } from '../../../stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { toast } from 'sonner';

function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones push');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('Notificaciones push activadas');
      // Send a test notification
      new Notification('🔔 mbeNote', {
        body: 'Las notificaciones push están activadas. Recibirás avisos aquí.',
        icon: '/favicon.svg',
      });
    } else if (result === 'denied') {
      toast.error('Permiso denegado. Puedes cambiarlo en la configuración del navegador.');
    }
  };

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* Enable notifications button - only show if not granted */}
      {permission !== 'granted' && permission !== 'unsupported' && (
        <button
          onClick={handleEnableNotifications}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          <BellRing className="h-3.5 w-3.5" />
          Activar avisos
        </button>
      )}

      {/* Bell icon */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
          open && 'bg-slate-100 dark:bg-slate-800'
        )}
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && <NotificationDropdown onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
