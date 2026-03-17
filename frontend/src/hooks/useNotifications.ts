import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "../services/api";
import type { NotificationListQuery } from "../types";
import { useNotificationStore } from "../stores/notificationStore";

const KEYS = {
  all: ["notifications"] as const,
  list: (query: NotificationListQuery) =>
    [...KEYS.all, "list", query] as const,
  unreadCount: () => [...KEYS.all, "unread-count"] as const,
};

export function useNotifications(query: NotificationListQuery = {}) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => api.getNotifications(query),
  });
}

export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useQuery({
    queryKey: KEYS.unreadCount(),
    queryFn: async () => {
      const count = await api.getUnreadCount();
      setUnreadCount(count);
      return count;
    },
    refetchInterval: 60_000, // poll every minute as fallback
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  const decrement = useNotificationStore((s) => s.decrement);

  return useMutation({
    mutationFn: (id: number) => api.markNotificationAsRead(String(id)),
    onSuccess: () => {
      decrement();
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onSuccess: () => {
      setUnreadCount(0);
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDismissNotification() {
  const qc = useQueryClient();
  const decrement = useNotificationStore((s) => s.decrement);

  return useMutation({
    mutationFn: (id: number) => api.dismissNotification(String(id)),
    onSuccess: () => {
      decrement();
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useMutation({
    mutationFn: () => api.deleteAllNotifications(),
    onSuccess: () => {
      setUnreadCount(0);
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
