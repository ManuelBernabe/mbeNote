import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getConnection, startConnection, stopConnection } from "../services/signalr";
import { useNotificationStore } from "../stores/notificationStore";
import type { NotificationResponse } from "../types";

/**
 * Connects to the SignalR notifications hub on mount.
 * Listens for real-time events and updates local state / query cache.
 */
export function useSignalR() {
  const queryClient = useQueryClient();
  const { setUnreadCount, increment } = useNotificationStore();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = getConnection();

    // ── Event handlers ───────────────────────────────────────────────────────

    const handleNotification = (notification: NotificationResponse) => {
      increment();

      // Show toast
      toast(notification.title, {
        description: notification.message,
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
