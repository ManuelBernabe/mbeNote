import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConnection, startConnection, stopConnection } from "../services/signalr";
import { useNotificationStore } from "../stores/notificationStore";

interface SignalRNotification {
  id: number;
  reminderId: number;
  reminderTitle: string;
  message: string;
  scheduledAt: string;
  channel: number;
}

/** Request browser notification permission on first call */
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Send a browser push notification */
function sendBrowserNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: tag ?? "mbenote-reminder",
    requireInteraction: true,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 30 seconds
  setTimeout(() => notification.close(), 30000);
}

/**
 * Connects to the SignalR notifications hub on mount.
 * Listens for real-time events, shows browser push notifications,
 * and updates local state / query cache.
 */
export function useSignalR() {
  const queryClient = useQueryClient();
  const { setUnreadCount, increment } = useNotificationStore();

  // Note: permission is requested via the "Activar avisos" button in NotificationBell

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = getConnection();

    const handleNotification = (notification: SignalRNotification) => {
      increment();

      // Format time
      const time = new Date(notification.scheduledAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const title = `🔔 ${notification.reminderTitle}`;
      const body = notification.message || `Aviso programado para las ${time}`;

      // Browser push notification
      sendBrowserNotification(title, body, `reminder-${notification.reminderId}`);

      // In-app toast
      toast(notification.reminderTitle, {
        description: body,
        duration: 10000,
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = "/reminders";
          },
        },
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    };

    const handleCountUpdated = (count: number) => {
      setUnreadCount(count);
    };

    connection.on("ReceiveNotification", handleNotification);
    connection.on("NotificationCountUpdated", handleCountUpdated);

    startConnection().catch((err) => {
      console.error("SignalR connection failed:", err);
    });

    return () => {
      connection.off("ReceiveNotification", handleNotification);
      connection.off("NotificationCountUpdated", handleCountUpdated);
      stopConnection();
    };
  }, [queryClient, setUnreadCount, increment]);
}
