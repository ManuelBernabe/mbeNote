import { create } from "zustand";

function updateBadge(count: number) {
  if (!('setAppBadge' in navigator)) return;
  if (count > 0) {
    (navigator as Navigator & { setAppBadge: (n?: number) => Promise<void> })
      .setAppBadge(count).catch(() => {});
  } else {
    (navigator as Navigator & { clearAppBadge: () => Promise<void> })
      .clearAppBadge().catch(() => {});
  }
}

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => {
    updateBadge(count);
    set({ unreadCount: count });
  },

  increment: () =>
    set((state) => {
      const next = state.unreadCount + 1;
      updateBadge(next);
      return { unreadCount: next };
    }),

  decrement: () =>
    set((state) => {
      const next = Math.max(0, state.unreadCount - 1);
      updateBadge(next);
      return { unreadCount: next };
    }),
}));
