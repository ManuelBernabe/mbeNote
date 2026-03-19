using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Quartz;
using mbeNote.Core.Enums;
using mbeNote.Infrastructure.Data;
using mbeNote.Infrastructure.Hubs;
using mbeNote.Infrastructure.Services;

namespace mbeNote.Infrastructure.Jobs;

public class ReminderNotificationJob : IJob
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ReminderNotificationJob(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();
        var webPush = scope.ServiceProvider.GetRequiredService<WebPushService>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ReminderNotificationJob>>();

        var now = DateTime.Now;
        var pendingNotifications = await db.ReminderNotifications
            .Include(n => n.Reminder)
            .Where(n => n.SentAt == null && n.ScheduledAt <= now)
            .Take(50)
            .ToListAsync();

        if (pendingNotifications.Count == 0) return;

        logger.LogInformation("Processing {Count} pending notifications", pendingNotifications.Count);

        // Mark ALL as sent immediately to prevent duplicate processing
        foreach (var n in pendingNotifications)
            n.SentAt = now;
        await db.SaveChangesAsync();

        // Now send them (already marked as sent, so next job cycle won't re-pick them)
        foreach (var notification in pendingNotifications)
        {
            // Skip if reminder is muted
            if (notification.Reminder?.Status == ReminderStatus.Muted)
            {
                notification.DismissedAt = now;
                await db.SaveChangesAsync();
                continue;
            }

            var title = notification.Reminder?.Title ?? "Aviso";
            var message = notification.Message ?? title;
            var reminderTime = notification.Reminder?.StartDateTime ?? notification.ScheduledAt;

            // 1. SignalR (in-app)
            try
            {
                await hubContext.Clients.Group($"user-{notification.UserId}").SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.ReminderId,
                    ReminderTitle = title,
                    Message = message,
                    notification.ScheduledAt,
                    notification.Channel
                });
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "SignalR failed for notification {Id}", notification.Id);
            }

            // 2. Web Push (desktop + iPhone PWA)
            try
            {
                var reminderTimeFormatted = reminderTime.ToString("HH:mm");
                var pushBody = string.IsNullOrWhiteSpace(notification.Reminder?.Description)
                    ? $"⏰ {reminderTimeFormatted}"
                    : $"{notification.Reminder.Description}\n⏰ {reminderTimeFormatted}";

                await webPush.SendToUserAsync(
                    notification.UserId,
                    title,
                    pushBody,
                    "/reminders",
                    reminderTime
                );
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Web Push failed for notification {Id}", notification.Id);
            }

            // 3. Email (via Resend HTTP API - works on Railway)
            try
            {
                var user = await db.Users.FindAsync(notification.UserId);
                if (user != null)
                {
                    await emailService.SendReminderEmailAsync(
                        user.Email,
                        title,
                        title,
                        reminderTime,
                        notification.Reminder?.Description
                    );
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Email failed for notification {Id}", notification.Id);
            }

            // Update unread count
            var unreadCount = await db.ReminderNotifications
                .CountAsync(n => n.UserId == notification.UserId && n.SentAt != null && n.ReadAt == null && n.DismissedAt == null);

            await hubContext.Clients.Group($"user-{notification.UserId}")
                .SendAsync("NotificationCountUpdated", unreadCount);
        }
    }
}
