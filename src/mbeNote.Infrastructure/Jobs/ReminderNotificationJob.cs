using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Quartz;
using mbeNote.Infrastructure.Data;
using mbeNote.Infrastructure.Hubs;

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

        var now = DateTime.Now;
        var pendingNotifications = await db.ReminderNotifications
            .Include(n => n.Reminder)
            .Where(n => n.SentAt == null && n.ScheduledAt <= now)
            .Take(100)
            .ToListAsync();

        foreach (var notification in pendingNotifications)
        {
            notification.SentAt = now;

            // Send real-time notification via SignalR
            await hubContext.Clients.Group($"user-{notification.UserId}").SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.ReminderId,
                ReminderTitle = notification.Reminder?.Title,
                notification.Message,
                notification.ScheduledAt,
                notification.Channel
            });

            // Update unread count
            var unreadCount = await db.ReminderNotifications
                .CountAsync(n => n.UserId == notification.UserId && n.SentAt != null && n.ReadAt == null && n.DismissedAt == null);

            await hubContext.Clients.Group($"user-{notification.UserId}").SendAsync("NotificationCountUpdated", unreadCount + 1);
        }

        await db.SaveChangesAsync();
    }
}
