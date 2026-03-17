using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Quartz;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Jobs;

public class ReminderRecurrenceJob : IJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ReminderRecurrenceJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var recurrenceService = scope.ServiceProvider.GetRequiredService<IRecurrenceService>();

        var now = DateTime.UtcNow;
        var horizon = now.AddHours(48);

        // Get all active recurring reminders
        var recurringReminders = await db.Reminders
            .Where(r => r.RecurrenceRule != null && r.Status == ReminderStatus.Active)
            .ToListAsync();

        foreach (var reminder in recurringReminders)
        {
            if (string.IsNullOrEmpty(reminder.RecurrenceRule)) continue;

            var occurrences = recurrenceService.ExpandOccurrences(
                reminder.RecurrenceRule, reminder.StartDateTime, now, horizon);

            var offsets = JsonSerializer.Deserialize<int[]>(reminder.NotificationOffsets) ?? new[] { 15 };

            foreach (var occurrence in occurrences)
            {
                foreach (var minutesBefore in offsets)
                {
                    var scheduledAt = occurrence.AddMinutes(-minutesBefore);
                    if (scheduledAt <= now) continue;

                    // Check if notification already exists
                    var exists = await db.ReminderNotifications
                        .AnyAsync(n => n.ReminderId == reminder.Id && n.ScheduledAt == scheduledAt);

                    if (!exists)
                    {
                        db.ReminderNotifications.Add(new ReminderNotification
                        {
                            ReminderId = reminder.Id,
                            UserId = reminder.UserId,
                            ScheduledAt = scheduledAt,
                            Channel = reminder.NotificationChannels,
                            Message = $"{reminder.Title} - en {FormatOffset(minutesBefore)}"
                        });
                    }
                }
            }
        }

        await db.SaveChangesAsync();
    }

    private static string FormatOffset(int minutes)
    {
        if (minutes < 60) return $"{minutes} minutos";
        if (minutes < 1440) return $"{minutes / 60} hora(s)";
        return $"{minutes / 1440} día(s)";
    }
}
