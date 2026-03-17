import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";
export type CalendarView = "month" | "week" | "day";

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  calendarView: CalendarView;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setCalendarView: (view: CalendarView) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "light",
      calendarView: "month",

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setTheme: (theme) => set({ theme }),

      setCalendarView: (calendarView) => set({ calendarView }),
    }),
    {
      name: "mbenote-ui",
      partialize: (state) => ({
        theme: state.theme,
        calendarView: state.calendarView,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);
