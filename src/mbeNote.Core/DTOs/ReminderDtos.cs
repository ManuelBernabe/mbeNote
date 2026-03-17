using mbeNote.Core.Enums;

namespace mbeNote.Core.DTOs;

public record CreateReminderRequest(
    string Title,
    string? Description,
    DateTime StartDateTime,
    DateTime? EndDateTime,
    bool IsAllDay,
    string? TimeZone,
    ReminderPriority Priority,
    int? CategoryId,
    string? Location,
    string? Color,
    string? RecurrenceRule,
    DateTime? RecurrenceEndDate,
    string? NotificationOffsets,
    NotificationChannel? NotificationChannels
);

public record UpdateReminderRequest(
    string? Title,
    string? Description,
    DateTime? StartDateTime,
    DateTime? EndDateTime,
    bool? IsAllDay,
    string? TimeZone,
    ReminderPriority? Priority,
    ReminderStatus? Status,
    int? CategoryId,
    string? Location,
    string? Color,
    string? RecurrenceRule,
    DateTime? RecurrenceEndDate,
    string? NotificationOffsets,
    NotificationChannel? NotificationChannels
);

public record SnoozeRequest(int Minutes);

public record ReminderResponse(
    int Id,
    string Title,
    string? Description,
    DateTime StartDateTime,
    DateTime? EndDateTime,
    bool IsAllDay,
    string TimeZone,
    ReminderPriority Priority,
    ReminderStatus Status,
    int? CategoryId,
    string? CategoryName,
    string? CategoryColor,
    string? Location,
    string Color,
    string? RecurrenceRule,
    string? RecurrenceDescription,
    DateTime? RecurrenceEndDate,
    string NotificationOffsets,
    NotificationChannel NotificationChannels,
    DateTime? SnoozedUntil,
    int SnoozeCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? CompletedAt
);

public record ReminderListQuery(
    DateTime? From,
    DateTime? To,
    int? CategoryId,
    ReminderStatus? Status,
    ReminderPriority? Priority,
    string? Search,
    int Page = 1,
    int PageSize = 50
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record ConflictCheckRequest(DateTime StartDateTime, DateTime EndDateTime);

public record NaturalLanguageRequest(string Text);

public record NaturalLanguageResponse(
    string? Title,
    DateTime? StartDateTime,
    string? RecurrenceRule,
    string? RecurrenceDescription
);
