using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CompletionRateResponse>> GetCompletionRatesAsync(int userId, DateTime from, DateTime to)
    {
        var reminders = await _db.Reminders
            .IgnoreQueryFilters()
            .Where(r => r.UserId == userId && r.CreatedAt >= from && r.CreatedAt <= to)
            .GroupBy(r => r.CreatedAt.Date)
            .Select(g => new CompletionRateResponse(
                g.Key,
                g.Count(),
                g.Count(r => r.Status == ReminderStatus.Completed),
                g.Count() == 0 ? 0 : Math.Round((double)g.Count(r => r.Status == ReminderStatus.Completed) / g.Count() * 100, 1)
            ))
            .OrderBy(c => c.Date)
            .ToListAsync();

        return reminders;
    }

    public async Task<IReadOnlyList<ActiveHoursResponse>> GetActiveHoursAsync(int userId)
    {
        var history = await _db.ReminderHistory
            .Where(h => h.UserId == userId && h.Timestamp >= DateTime.UtcNow.AddDays(-30))
            .GroupBy(h => new { h.Timestamp.Hour, DayOfWeek = (int)h.Timestamp.DayOfWeek })
            .Select(g => new ActiveHoursResponse(g.Key.Hour, g.Key.DayOfWeek, g.Count()))
            .ToListAsync();

        return history;
    }

    public async Task<StreakResponse> GetStreaksAsync(int userId)
    {
        var completedDates = await _db.Reminders
            .Where(r => r.UserId == userId && r.Status == ReminderStatus.Completed && r.CompletedAt != null)
            .Select(r => r.CompletedAt!.Value.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToListAsync();

        if (completedDates.Count == 0)
            return new StreakResponse(0, 0, null);

        // Current streak
        var currentStreak = 0;
        var today = DateTime.UtcNow.Date;
        var checkDate = today;

        foreach (var date in completedDates)
        {
            if (date == checkDate || date == checkDate.AddDays(-1))
            {
                currentStreak++;
                checkDate = date.AddDays(-1);
            }
            else break;
        }

        // Longest streak
        var longestStreak = 0;
        var streak = 1;
        var sorted = completedDates.OrderBy(d => d).ToList();
        for (int i = 1; i < sorted.Count; i++)
        {
            if (sorted[i] == sorted[i - 1].AddDays(1))
                streak++;
            else
                streak = 1;

            longestStreak = Math.Max(longestStreak, streak);
        }
        longestStreak = Math.Max(longestStreak, streak);

        return new StreakResponse(currentStreak, longestStreak, completedDates.FirstOrDefault());
    }

    public async Task<IReadOnlyList<CategoryDistributionResponse>> GetCategoryDistributionAsync(int userId)
    {
        var total = await _db.Reminders.CountAsync(r => r.UserId == userId);
        if (total == 0)
            return Array.Empty<CategoryDistributionResponse>();

        var distribution = await _db.Reminders
            .Where(r => r.UserId == userId)
            .GroupBy(r => new { r.CategoryId, Name = r.Category != null ? r.Category.Name : "Sin categoría", Color = r.Category != null ? r.Category.Color : "#94a3b8" })
            .Select(g => new CategoryDistributionResponse(
                g.Key.Name,
                g.Key.Color,
                g.Count(),
                Math.Round((double)g.Count() / total * 100, 1)
            ))
            .OrderByDescending(c => c.Count)
            .ToListAsync();

        return distribution;
    }
}
