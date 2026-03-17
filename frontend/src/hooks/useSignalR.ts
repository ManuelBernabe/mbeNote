import { useEffect } from "react";
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

function sendBrowserNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: tag ?? "mbenote-reminder",
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 30000);
  } catch (err) {
    console.warn("[Push] Failed to create notification:", err);
  }
}

export function useSignalR() {
  const queryClient = useQueryClient();
  const { setUnreadCount, increment } = useNotificationStore();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[SignalR] No token, skipping connection");
      return;
    }

    console.log("[SignalR] Setting up connection...");
    const connection = getConnection();

    const handleNotification = (data: any) => {
      console.log("[SignalR] Received notification:", data);

      // Handle both named object and positional args from SignalR
      const notification: SignalRNotification = {
        id: data.id ?? data.Id ?? 0,
        reminderId: data.reminderId ?? data.ReminderId ?? 0,
        reminderTitle: data.reminderTitle ?? data.ReminderTitle ?? "Aviso",
        message: data.message ?? data.Message ?? "",
        scheduledAt: data.scheduledAt ?? data.ScheduledAt ?? new Date().toISOString(),
        channel: data.channel ?? data.Channel ?? 1,
      };

      increment();

      const time = new Date(notification.scheduledAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const title = `🔔 ${notification.reminderTitle}`;
      const body = notification.message || `Aviso programado para las ${time}`;

      // Browser push notification
      sendBrowserNotification(title, body, `reminder-${notification.reminderId}`);

      // In-app toast (always works, no permission needed)
      toast(notification.reminderTitle, {
        description: body,
        duration: 15000,
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = "/reminders";
          },
        },
      });

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    };

    const handleCountUpdated = (count: number) => {
      console.log("[SignalR] Unread count updated:", count);
      setUnreadCount(count);
    };

    connection.on("ReceiveNotification", handleNotification);
    connection.on("NotificationCountUpdated", handleCountUpdated);

    startConnection();

    return () => {
      connection.off("ReceiveNotification", handleNotification);
      connection.off("NotificationCountUpdated", handleCountUpdated);
      stopConnection();
    };
  }, [queryClient, setUnreadCount, increment]);
}
