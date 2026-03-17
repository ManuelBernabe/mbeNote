using System.Text.Json;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class WebPushService
{
    private readonly AppDbContext _db;
    private readonly PushServiceClient _pushClient;
    private readonly ILogger<WebPushService> _logger;

    public WebPushService(AppDbContext db, IConfiguration config, ILogger<WebPushService> logger)
    {
        _db = db;
        _logger = logger;

        var vapidSubject = config["Vapid:Subject"] ?? "mailto:admin@mbenote.app";
        var vapidPublicKey = config["Vapid:PublicKey"] ?? "";
        var vapidPrivateKey = config["Vapid:PrivateKey"] ?? "";

        _pushClient = new PushServiceClient();
        _pushClient.DefaultAuthentication = new VapidAuthentication(vapidPublicKey, vapidPrivateKey)
        {
            Subject = vapidSubject
        };
    }

    public async Task SendToUserAsync(int userId, string title, string body, string? url = null)
    {
        var subscriptions = await _db.PushSubscriptions
            .Where(s => s.UserId == userId)
            .ToListAsync();

        if (subscriptions.Count == 0)
        {
            _logger.LogDebug("No push subscriptions for user {UserId}", userId);
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            icon = "/favicon.svg",
            badge = "/favicon.svg",
            url = url ?? "/reminders",
            timestamp = DateTimeOffset.Now.ToUnixTimeMilliseconds()
        });

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new PushSubscription
                {
                    Endpoint = sub.Endpoint,
                    Keys = { ["p256dh"] = sub.P256dh, ["auth"] = sub.Auth }
                };

                var message = new PushMessage(payload)
                {
                    Urgency = PushMessageUrgency.High
                };

                await _pushClient.RequestPushMessageDeliveryAsync(pushSubscription, message);
                _logger.LogInformation("Push sent to user {UserId} endpoint {Endpoint}", userId, sub.Endpoint[..30]);
            }
            catch (PushServiceClientException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone)
            {
                // Subscription expired, remove it
                _logger.LogWarning("Push subscription expired for user {UserId}, removing", userId);
                _db.PushSubscriptions.Remove(sub);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push to user {UserId}", userId);
            }
        }
    }

    public async Task SaveSubscriptionAsync(int userId, string endpoint, string p256dh, string auth)
    {
        var existing = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (existing != null)
        {
            existing.P256dh = p256dh;
            existing.Auth = auth;
        }
        else
        {
            _db.PushSubscriptions.Add(new Core.Models.PushSubscription
            {
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveSubscriptionAsync(int userId, string endpoint)
    {
        var sub = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (sub != null)
        {
            _db.PushSubscriptions.Remove(sub);
            await _db.SaveChangesAsync();
        }
    }
}
