import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "../services/api";
import type {
  ConflictCheckRequest,
  CreateReminderRequest,
  ReminderListQuery,
  SnoozeRequest,
  UpdateReminderRequest,
} from "../types";

const KEYS = {
  all: ["reminders"] as const,
  lists: () => [...KEYS.all, "list"] as const,
  list: (query: ReminderListQuery) => [...KEYS.lists(), query] as const,
  details: () => [...KEYS.all, "detail"] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  upcoming: (count: number) => [...KEYS.all, "upcoming", count] as const,
  overdue: () => [...KEYS.all, "overdue"] as const,
};

export function useReminders(query: ReminderListQuery = {}) {
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => api.getReminders(query),
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.getReminder(id),
    enabled: !!id,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReminderRequest) => api.createReminder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.upcoming(5) });
    },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReminderRequest }) =>
      api.updateReminder(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReminder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useCompleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeReminder(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.overdue() });
    },
  });
}

export function useSnoozeReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SnoozeRequest }) =>
      api.snoozeReminder(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
}

export function useRestoreReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.restoreReminder(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDuplicateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.duplicateReminder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() });
    },
  });
}

export function useUpcoming(count: number = 5) {
  return useQuery({
    queryKey: KEYS.upcoming(count),
    queryFn: () => api.getUpcomingReminders(count),
  });
}

export function useOverdue() {
  return useQuery({
    queryKey: KEYS.overdue(),
    queryFn: () => api.getOverdueReminders(),
  });
}

export function useCheckConflicts() {
  return useMutation({
    mutationFn: (data: ConflictCheckRequest) => api.checkConflicts(data),
  });
}
