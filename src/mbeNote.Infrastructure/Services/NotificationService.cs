using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task ScheduleForReminderAsync(Reminder reminder)
    {
        // Remove existing unset notifications for this reminder
        var existing = await _db.ReminderNotifications
            .Where(n => n.ReminderId == reminder.Id && n.SentAt == null)
            .ToListAsync();
        _db.ReminderNotifications.RemoveRange(existing);

        // Parse notification offsets
        var offsets = JsonSerializer.Deserialize<int[]>(reminder.NotificationOffsets) ?? new[] { 15 };

        foreach (var minutesBefore in offsets)
        {
            var scheduledAt = reminder.StartDateTime.AddMinutes(-minutesBefore);
            if (scheduledAt <= DateTime.UtcNow) continue;

            _db.ReminderNotifications.Add(new ReminderNotification
            {
                ReminderId = reminder.Id,
                UserId = reminder.UserId,
                ScheduledAt = scheduledAt,
                Channel = reminder.NotificationChannels,
                Message = $"{reminder.Title} - en {FormatOffset(minutesBefore)}"
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task CancelForReminderAsync(int reminderId)
    {
        var pending = await _db.ReminderNotifications
            .Where(n => n.ReminderId == reminderId && n.SentAt == null)
            .ToListAsync();
        _db.ReminderNotifications.RemoveRange(pending);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<NotificationResponse>> GetListAsync(int userId, NotificationListQuery query)
    {
        var q = _db.ReminderNotifications
            .Include(n => n.Reminder)
            .Where(n => n.UserId == userId && n.SentAt != null && n.DismissedAt == null);

        if (query.UnreadOnly)
            q = q.Where(n => n.ReadAt == null);

        q = q.OrderByDescending(n => n.ScheduledAt);

        var totalCount = await q.CountAsync();
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(n => new NotificationResponse(
                n.Id,
                n.ReminderId,
                n.Reminder != null ? n.Reminder.Title : "",
                n.ScheduledAt,
                n.SentAt,
                n.ReadAt,
                n.Channel,
                n.Message
            ))
            .ToListAsync();

        return new PagedResult<NotificationResponse>(items, totalCount, query.Page, query.PageSize);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _db.ReminderNotifications
            .CountAsync(n => n.UserId == userId && n.SentAt != null && n.ReadAt == null && n.DismissedAt == null);
    }

    public async Task MarkAsReadAsync(int userId, int notificationId)
    {
        var notification = await _db.ReminderNotifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification != null)
        {
            notification.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var unread = await _db.ReminderNotifications
            .Where(n => n.UserId == userId && n.ReadAt == null && n.SentAt != null)
            .ToListAsync();

        foreach (var n in unread)
            n.ReadAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task DismissAsync(int userId, int notificationId)
    {
        var notification = await _db.ReminderNotifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification != null)
        {
            notification.DismissedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private static string FormatOffset(int minutes)
    {
        if (minutes < 60) return $"{minutes} minutos";
        if (minutes < 1440) return $"{minutes / 60} hora(s)";
        return $"{minutes / 1440} día(s)";
    }
}
