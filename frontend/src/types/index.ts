// ── Enums ──────────────────────────────────────────────────────────────────────

export enum ReminderPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum ReminderStatus {
  Active = 0,
  Completed = 1,
  Cancelled = 2,
  Snoozed = 3,
}

export enum NotificationChannel {
  None = 0,
  InApp = 1,
  Email = 2,
  Push = 4,
}

export enum HistoryAction {
  Created = 0,
  Updated = 1,
  Completed = 2,
  Deleted = 3,
  Snoozed = 4,
  Restored = 5,
  Shared = 6,
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  timeZone: string;
}

// ── Reminders ──────────────────────────────────────────────────────────────────

export interface ReminderResponse {
  id: number;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  isAllDay: boolean;
  timeZone: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  location?: string | null;
  color: string;
  recurrenceRule?: string | null;
  recurrenceDescription?: string | null;
  recurrenceEndDate?: string | null;
  notificationOffsets: string;
  notificationChannels: NotificationChannel;
  snoozedUntil?: string | null;
  snoozeCount: number;
  createdAt: string;
  updatedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateReminderRequest {
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  isAllDay: boolean;
  timeZone?: string | null;
  priority: ReminderPriority;
  categoryId?: number | null;
  location?: string | null;
  color?: string | null;
  recurrenceRule?: string | null;
  recurrenceEndDate?: string | null;
  notificationOffsets?: string | null;
  notificationChannels?: NotificationChannel | null;
}

export interface UpdateReminderRequest {
  title?: string | null;
  description?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  isAllDay?: boolean | null;
  timeZone?: string | null;
  priority?: ReminderPriority | null;
  status?: ReminderStatus | null;
  categoryId?: number | null;
  location?: string | null;
  color?: string | null;
  recurrenceRule?: string | null;
  recurrenceEndDate?: string | null;
  notificationOffsets?: string | null;
  notificationChannels?: NotificationChannel | null;
}

export interface ReminderListQuery {
  page?: number;
  pageSize?: number;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  categoryId?: number;
  from?: string;
  to?: string;
  search?: string;
}

export interface SnoozeRequest {
  minutes: number;
}

// ── Paged results ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Categories ─────────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  reminderCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: number;
  reminderId: number;
  reminderTitle: string;
  scheduledAt: string;
  sentAt?: string | null;
  readAt?: string | null;
  channel: NotificationChannel;
  message?: string | null;
}

export interface NotificationListQuery {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// ── History ────────────────────────────────────────────────────────────────────

export interface HistoryResponse {
  id: number;
  reminderId: number;
  reminderTitle?: string | null;
  action: HistoryAction;
  description?: string | null;
  previousState?: string | null;
  newState?: string | null;
  timestamp: string;
}

export interface HistoryListQuery {
  page?: number;
  pageSize?: number;
  action?: HistoryAction;
  from?: string;
  to?: string;
}

// ── Analytics ──────────────────────────────────────────────────────────────────

export interface CompletionRateResponse {
  date: string;
  total: number;
  completed: number;
  rate: number;
}

export interface ActiveHoursResponse {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string | null;
}

export interface CategoryDistributionResponse {
  categoryName: string;
  color: string;
  count: number;
  percentage: number;
}

// ── Natural Language ───────────────────────────────────────────────────────────

export interface NaturalLanguageRequest {
  text: string;
}

export interface NaturalLanguageResponse {
  title?: string | null;
  startDateTime?: string | null;
  recurrenceRule?: string | null;
  recurrenceDescription?: string | null;
}

export interface ConflictCheckRequest {
  startDateTime: string;
  endDateTime: string;
}
