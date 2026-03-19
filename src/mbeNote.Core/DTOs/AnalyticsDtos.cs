namespace mbeNote.Core.DTOs;

public record CompletionRateResponse(
    DateTime Date,
    int Total,
    int Completed,
    double Rate
);

public record ActiveHoursResponse(
    int Hour,
    int DayOfWeek,
    int Count
);

public record StreakResponse(
    int CurrentStreak,
    int LongestStreak,
    DateTime? LastCompletedDate
);

public record CategoryDistributionResponse(
    string CategoryName,
    string Color,
    int Count,
    double Percentage
);

public record WeeklyStatItem(DateTime WeekStart, int Created, int Completed, int Deleted, double CompletionRate);
