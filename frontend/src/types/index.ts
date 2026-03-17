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
  expiresAt: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

// ── Reminders ──────────────────────────────────────────────────────────────────

export interface ReminderResponse {
  id: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  recurrenceRule?: string;
  notificationChannels: NotificationChannel;
  notifyMinutesBefore: number;
  categoryId?: string;
  category?: CategoryResponse;
  tags: string[];
  isAllDay: boolean;
  location?: string;
  snoozedUntil?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  priority: ReminderPriority;
  recurrenceRule?: string;
  notificationChannels: NotificationChannel;
  notifyMinutesBefore: number;
  categoryId?: string;
  tags?: string[];
  isAllDay?: boolean;
  location?: string;
}

export interface UpdateReminderRequest {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  priority?: ReminderPriority;
  recurrenceRule?: string;
  notificationChannels?: NotificationChannel;
  notifyMinutesBefore?: number;
  categoryId?: string;
  tags?: string[];
  isAllDay?: boolean;
  location?: string;
}

export interface ReminderListQuery {
  page?: number;
  pageSize?: number;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface SnoozeRequest {
  snoozedUntil: string;
}

// ── Paged results ──────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── Categories ─────────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  reminderCount: number;
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  reminderId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

export interface NotificationListQuery {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

// ── History ────────────────────────────────────────────────────────────────────

export interface HistoryResponse {
  id: string;
  reminderId: string;
  action: HistoryAction;
  description: string;
  changes?: string;
  performedAt: string;
  performedBy: string;
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
  totalReminders: number;
  completedReminders: number;
  completionRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface ActiveHoursResponse {
  hour: number;
  count: number;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}

export interface CategoryDistributionResponse {
  categoryId: string;
  categoryName: string;
  color?: string;
  count: number;
  percentage: number;
}

// ── Natural Language ───────────────────────────────────────────────────────────

export interface NaturalLanguageRequest {
  text: string;
}

export interface NaturalLanguageResponse {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  priority: ReminderPriority;
  recurrenceRule?: string;
  location?: string;
  confidence: number;
}

export interface ConflictCheckRequest {
  startDateTime: string;
  endDateTime?: string;
  excludeReminderId?: string;
}
