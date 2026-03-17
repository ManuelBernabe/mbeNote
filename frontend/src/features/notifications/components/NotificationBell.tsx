import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useNotificationStore } from '../../../stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { toast } from 'sonner';

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    const data = await res.json();
    return data.key;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

async function subscribeToPush(reg: ServiceWorkerRegistration, vapidKey: string): Promise<PushSubscription | null> {
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
    return sub;
  } catch (err) {
    console.error('[Push] Subscribe failed:', err);
    return null;
  }
}

async function sendSubscriptionToServer(sub: PushSubscription): Promise<void> {
  const token = localStorage.getItem('token');
  const key = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (!key || !auth) return;

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    }),
  });
}

function getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  return Notification.permission;
}

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<ReturnType<typeof getPermissionState>>('default');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getPermissionState());
    const onFocus = () => setPermission(getPermissionState());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Auto-register if already granted (e.g. returning user)
  useEffect(() => {
    if (permission === 'granted') {
      (async () => {
        const reg = await registerServiceWorker();
        if (!reg) return;
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          await sendSubscriptionToServer(existingSub);
        }
      })();
    }
  }, [permission]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = async () => {
    if (permission === 'unsupported') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.info('En iPhone: pulsa "Compartir" → "Añadir a pantalla de inicio" y abre desde ahí para recibir notificaciones', { duration: 8000 });
      } else {
        toast.error('Tu navegador no soporta notificaciones push');
      }
      return;
    }

    if (permission === 'granted') {
      toast.success('Las notificaciones push ya están activadas');
      return;
    }

    if (permission === 'denied') {
      toast.error('Notificaciones bloqueadas. Haz clic en el 🔒 de la barra de dirección → Permisos → Notificaciones → Permitir', { duration: 8000 });
      return;
    }

    // Request permission and subscribe
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Permiso denegado');
        return;
      }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        toast.error('Error al obtener clave del servidor');
        return;
      }

      const reg = await registerServiceWorker();
      if (!reg) {
        toast.error('Error al registrar el Service Worker');
        return;
      }

      const sub = await subscribeToPush(reg, vapidKey);
      if (!sub) {
        toast.error('Error al suscribirse a notificaciones');
        return;
      }

      await sendSubscriptionToServer(sub);
      toast.success('¡Notificaciones push activadas! Recibirás avisos incluso con el navegador cerrado.');
    } catch (err) {
      console.error('[Push] Setup error:', err);
      toast.error('Error al configurar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const isActive = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isActive ? 'Notificaciones push activadas' : isDenied ? 'Notificaciones bloqueadas' : 'Activar notificaciones push'}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
          loading && 'opacity-50 cursor-wait',
          isActive
            ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
            : isDenied
              ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'
        )}
      >
        {isActive ? (
          <><BellRing className="h-3.5 w-3.5" /><span className="hidden sm:inline">Push ON</span></>
        ) : isDenied ? (
          <><BellOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Bloqueado</span></>
        ) : (
          <><BellRing className="h-3.5 w-3.5" /><span className="hidden sm:inline">{loading ? 'Activando...' : 'Activar push'}</span></>
        )}
      </button>

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
