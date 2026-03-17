import { useQuery } from "@tanstack/react-query";
import * as api from "../services/api";
import type { HistoryListQuery } from "../types";

const KEYS = {
  reminder: (id: string, query: HistoryListQuery) =>
    ["history", "reminder", id, query] as const,
  global: (query: HistoryListQuery) => ["history", "global", query] as const,
};

export function useReminderHistory(
  reminderId: string,
  query: HistoryListQuery = {},
) {
  return useQuery({
    queryKey: KEYS.reminder(reminderId, query),
    queryFn: () => api.getReminderHistory(reminderId, query),
    enabled: !!reminderId,
  });
}

export function useGlobalHistory(query: HistoryListQuery = {}) {
  return useQuery({
    queryKey: KEYS.global(query),
    queryFn: () => api.getGlobalHistory(query),
  });
}
