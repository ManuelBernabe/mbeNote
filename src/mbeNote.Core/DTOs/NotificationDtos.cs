using mbeNote.Core.Enums;

namespace mbeNote.Core.DTOs;

public record NotificationResponse(
    int Id,
    int ReminderId,
    string ReminderTitle,
    DateTime ScheduledAt,
    DateTime? SentAt,
    DateTime? ReadAt,
    NotificationChannel Channel,
    string? Message
);

public record NotificationListQuery(
    bool UnreadOnly = false,
    int Page = 1,
    int PageSize = 20
);
