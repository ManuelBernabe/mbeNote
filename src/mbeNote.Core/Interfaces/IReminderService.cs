using mbeNote.Core.DTOs;
using mbeNote.Core.Models;

namespace mbeNote.Core.Interfaces;

public interface IReminderService
{
    Task<ReminderResponse> CreateAsync(int userId, CreateReminderRequest request);
    Task<ReminderResponse> UpdateAsync(int userId, int id, UpdateReminderRequest request);
    Task DeleteAsync(int userId, int id);
    Task<ReminderResponse?> GetByIdAsync(int userId, int id);
    Task<PagedResult<ReminderResponse>> GetListAsync(int userId, ReminderListQuery query);
    Task<ReminderResponse> CompleteAsync(int userId, int id);
    Task<ReminderResponse> SnoozeAsync(int userId, int id, int minutes);
    Task<ReminderResponse> RestoreAsync(int userId, int id);
    Task<ReminderResponse> DuplicateAsync(int userId, int id);
    Task<ReminderResponse> MuteAsync(int userId, int id);
    Task<ReminderResponse> UnmuteAsync(int userId, int id);
    Task<IReadOnlyList<ReminderResponse>> GetUpcomingAsync(int userId, int count = 5);
    Task<IReadOnlyList<ReminderResponse>> GetOverdueAsync(int userId);
    Task<IReadOnlyList<ReminderResponse>> CheckConflictsAsync(int userId, DateTime start, DateTime end);
    Task<BatchOperationResult> BatchDeleteAsync(int userId, IReadOnlyList<int> ids);
    Task<BatchOperationResult> BatchCompleteAsync(int userId, IReadOnlyList<int> ids);
}

public interface IRecurrenceService
{
    IReadOnlyList<DateTime> ExpandOccurrences(string rrule, DateTime start, DateTime rangeStart, DateTime rangeEnd);
    string BuildRRule(string frequency, int interval, int[]? daysOfWeek, int? dayOfMonth, DateTime? until, int? count);
    string DescribeRRule(string rrule);
}

public interface IReminderHistoryService
{
    Task RecordAsync(int reminderId, int userId, Core.Enums.HistoryAction action, string? previousState, string? newState, string? description);
    Task<PagedResult<HistoryResponse>> GetByReminderAsync(int reminderId, int page = 1, int pageSize = 50);
    Task<PagedResult<HistoryResponse>> GetGlobalAsync(int userId, HistoryListQuery query);
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
}

public interface INotificationService
{
    Task ScheduleForReminderAsync(Reminder reminder);
    Task CancelForReminderAsync(int reminderId);
    Task<PagedResult<NotificationResponse>> GetListAsync(int userId, NotificationListQuery query);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int userId, int notificationId);
    Task MarkAllAsReadAsync(int userId);
    Task DismissAsync(int userId, int notificationId);
    Task DeleteNotificationAsync(int userId, int notificationId);
    Task DeleteAllNotificationsAsync(int userId);
}

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryResponse>> GetAllAsync(int userId);
    Task<CategoryResponse> CreateAsync(int userId, CreateCategoryRequest request);
    Task<CategoryResponse> UpdateAsync(int userId, int id, UpdateCategoryRequest request);
    Task DeleteAsync(int userId, int id);
}

public interface IAnalyticsService
{
    Task<IReadOnlyList<CompletionRateResponse>> GetCompletionRatesAsync(int userId, DateTime from, DateTime to);
    Task<IReadOnlyList<ActiveHoursResponse>> GetActiveHoursAsync(int userId);
    Task<StreakResponse> GetStreaksAsync(int userId);
    Task<IReadOnlyList<CategoryDistributionResponse>> GetCategoryDistributionAsync(int userId);
    Task<IReadOnlyList<WeeklyStatItem>> GetWeeklyStatsAsync(int userId, int weeksBack = 8);
}

public interface INaturalLanguageParserService
{
    NaturalLanguageResponse Parse(string text);
}
