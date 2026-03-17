import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNotificationStore } from '../../../stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { toast } from 'sonner';

function getPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<ReturnType<typeof getPermission>>('default');
  const ref = useRef<HTMLDivElement>(null);

  // Check permission on mount and when window regains focus (user may change in browser settings)
  useEffect(() => {
    setPermission(getPermission());
    const onFocus = () => setPermission(getPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggleNotifications = async () => {
    if (permission === 'unsupported') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.info('En iPhone/iPad: pulsa "Compartir" → "Añadir a pantalla de inicio" para recibir notificaciones push', { duration: 8000 });
      } else {
        toast.error('Tu navegador no soporta notificaciones push');
      }
      return;
    }

    if (permission === 'granted') {
      toast.info('Para desactivar las notificaciones, hazlo desde la configuración del navegador (candado en la barra de dirección)');
      return;
    }

    if (permission === 'denied') {
      toast.error('Las notificaciones están bloqueadas. Haz clic en el candado 🔒 de la barra de dirección para cambiar el permiso.');
      return;
    }

    // permission === 'default' - ask for permission
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notificaciones push activadas');
        new Notification('🔔 mbeNote', {
          body: 'Las notificaciones push están activadas. Recibirás avisos aquí.',
          icon: '/favicon.svg',
        });
      } else {
        toast.error('Permiso denegado. Puedes cambiarlo desde el candado 🔒 en la barra de dirección.');
      }
    } catch {
      toast.error('Error al solicitar permisos de notificación');
    }
  };

  const isActive = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      {/* Notification toggle button - ALWAYS visible */}
      <button
        onClick={handleToggleNotifications}
        title={
          isActive
            ? 'Notificaciones push activadas'
            : isDenied
              ? 'Notificaciones bloqueadas - clic para info'
              : 'Activar notificaciones push'
        }
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
          isActive
            ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
            : isDenied
              ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'
        )}
      >
        {isActive ? (
          <>
            <BellRing className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Push ON</span>
          </>
        ) : isDenied ? (
          <>
            <BellOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bloqueado</span>
          </>
        ) : (
          <>
            <BellRing className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activar push</span>
          </>
        )}
      </button>

      {/* Bell icon with unread badge */}
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
