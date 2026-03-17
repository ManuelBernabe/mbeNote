using mbeNote.Core.Enums;

namespace mbeNote.Core.DTOs;

public record HistoryResponse(
    int Id,
    int ReminderId,
    string? ReminderTitle,
    HistoryAction Action,
    string? Description,
    string? PreviousState,
    string? NewState,
    DateTime Timestamp
);

public record HistoryListQuery(
    DateTime? From,
    DateTime? To,
    HistoryAction? Action,
    int Page = 1,
    int PageSize = 50
);
