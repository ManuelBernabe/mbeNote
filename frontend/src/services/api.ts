import type {
  AuthResponse,
  CategoryResponse,
  CompletionRateResponse,
  ActiveHoursResponse,
  ConflictCheckRequest,
  CreateCategoryRequest,
  CreateReminderRequest,
  HistoryListQuery,
  HistoryResponse,
  LoginRequest,
  NaturalLanguageRequest,
  NaturalLanguageResponse,
  NotificationListQuery,
  NotificationResponse,
  PagedResult,
  RegisterRequest,
  ReminderListQuery,
  ReminderResponse,
  SnoozeRequest,
  StreakResponse,
  CategoryDistributionResponse,
  UpdateCategoryRequest,
  UpdateReminderRequest,
} from "../types";

const BASE_URL = "/api";

// ── Fetch wrapper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  if (!response.ok) {
    const body = await response.text();
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.message ?? json.title ?? body;
    } catch {
      message = body || `Error ${response.status}`;
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function toQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<AuthResponse["user"]> {
  return apiFetch("/auth/me");
}

// ── Reminders ──────────────────────────────────────────────────────────────────

export async function getReminders(
  query: ReminderListQuery = {},
): Promise<PagedResult<ReminderResponse>> {
  return apiFetch(`/reminders${toQueryString(query as Record<string, unknown>)}`);
}

export async function getReminder(id: string): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}`);
}

export async function createReminder(
  data: CreateReminderRequest,
): Promise<ReminderResponse> {
  return apiFetch("/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReminder(
  id: string,
  data: UpdateReminderRequest,
): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReminder(id: string): Promise<void> {
  return apiFetch(`/reminders/${id}`, { method: "DELETE" });
}

export async function completeReminder(id: string): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}/complete`, { method: "POST" });
}

export async function snoozeReminder(
  id: string,
  data: SnoozeRequest,
): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}/snooze`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function restoreReminder(id: string): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}/restore`, { method: "POST" });
}

export async function duplicateReminder(id: string): Promise<ReminderResponse> {
  return apiFetch(`/reminders/${id}/duplicate`, { method: "POST" });
}

export async function getUpcomingReminders(
  count: number = 5,
): Promise<ReminderResponse[]> {
  return apiFetch(`/reminders/upcoming?count=${count}`);
}

export async function getOverdueReminders(): Promise<ReminderResponse[]> {
  return apiFetch("/reminders/overdue");
}

export async function checkConflicts(
  data: ConflictCheckRequest,
): Promise<ReminderResponse[]> {
  return apiFetch("/reminders/conflicts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Categories ─────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryResponse[]> {
  return apiFetch("/categories");
}

export async function createCategory(
  data: CreateCategoryRequest,
): Promise<CategoryResponse> {
  return apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryRequest,
): Promise<CategoryResponse> {
  return apiFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}

// ── Notifications ──────────────────────────────────────────────────────────────

export async function getNotifications(
  query: NotificationListQuery = {},
): Promise<PagedResult<NotificationResponse>> {
  return apiFetch(
    `/notifications${toQueryString(query as Record<string, unknown>)}`,
  );
}

export async function getUnreadCount(): Promise<number> {
  return apiFetch("/notifications/unread-count");
}

export async function markNotificationAsRead(
  id: string,
): Promise<void> {
  return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return apiFetch("/notifications/read-all", { method: "POST" });
}

export async function dismissNotification(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

// ── History ────────────────────────────────────────────────────────────────────

export async function getReminderHistory(
  reminderId: string,
  query: HistoryListQuery = {},
): Promise<PagedResult<HistoryResponse>> {
  return apiFetch(
    `/reminders/${reminderId}/history${toQueryString(query as Record<string, unknown>)}`,
  );
}

export async function getGlobalHistory(
  query: HistoryListQuery = {},
): Promise<PagedResult<HistoryResponse>> {
  return apiFetch(
    `/history${toQueryString(query as Record<string, unknown>)}`,
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────────

export async function getCompletionRate(
  from?: string,
  to?: string,
): Promise<CompletionRateResponse> {
  return apiFetch(
    `/analytics/completion-rate${toQueryString({ from, to })}`,
  );
}

export async function getActiveHours(): Promise<ActiveHoursResponse[]> {
  return apiFetch("/analytics/active-hours");
}

export async function getStreak(): Promise<StreakResponse> {
  return apiFetch("/analytics/streak");
}

export async function getCategoryDistribution(): Promise<
  CategoryDistributionResponse[]
> {
  return apiFetch("/analytics/category-distribution");
}

// ── Natural Language ───────────────────────────────────────────────────────────

export async function parseNaturalLanguage(
  data: NaturalLanguageRequest,
): Promise<NaturalLanguageResponse> {
  return apiFetch("/reminders/parse", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
