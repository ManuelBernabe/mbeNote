using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Quartz;
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
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ReminderNotificationJob>>();

        var now = DateTime.Now;
        var pendingNotifications = await db.ReminderNotifications
            .Include(n => n.Reminder)
            .Where(n => n.SentAt == null && n.ScheduledAt <= now)
            .Take(100)
            .ToListAsync();

        if (pendingNotifications.Count > 0)
            logger.LogInformation("Processing {Count} pending notifications", pendingNotifications.Count);

        foreach (var notification in pendingNotifications)
        {
            notification.SentAt = now;

            var title = notification.Reminder?.Title ?? "Aviso";
            var message = notification.Message ?? $"🔔 {title}";

            // 1. Send via SignalR (works when tab is open)
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
                logger.LogWarning(ex, "SignalR send failed for notification {Id}", notification.Id);
            }

            // 2. Send via Web Push (works even when browser is closed)
            try
            {
                await webPush.SendToUserAsync(
                    notification.UserId,
                    $"🔔 {title}",
                    message,
                    "/reminders"
                );
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Web Push failed for notification {Id}", notification.Id);
            }

            // Update unread count via SignalR
            var unreadCount = await db.ReminderNotifications
                .CountAsync(n => n.UserId == notification.UserId && n.SentAt != null && n.ReadAt == null && n.DismissedAt == null);

            await hubContext.Clients.Group($"user-{notification.UserId}")
                .SendAsync("NotificationCountUpdated", unreadCount + 1);
        }

        await db.SaveChangesAsync();
    }
}
