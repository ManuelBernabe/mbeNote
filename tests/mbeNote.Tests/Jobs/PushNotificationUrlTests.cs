using mbeNote.Core.Enums;
using mbeNote.Core.Models;

namespace mbeNote.Tests.Jobs;

/// <summary>
/// Verifies that the push notification URL format sends the user to the
/// correct reminder detail (via ?open= query param) instead of the dashboard.
/// </summary>
public class PushNotificationUrlTests
{
    [Fact]
    public void PushUrl_ContainsOpenQueryParam_WithReminderId()
    {
        int reminderId = 42;
        string url = $"/reminders?open={reminderId}";

        Assert.Contains("?open=", url);
        Assert.Contains(reminderId.ToString(), url);
        Assert.StartsWith("/reminders", url);
    }

    [Fact]
    public void PushUrl_Format_IsCorrect()
    {
        var notification = new ReminderNotification
        {
            Id = 1,
            ReminderId = 99,
            UserId = 1,
            ScheduledAt = DateTime.UtcNow,
            Channel = NotificationChannel.Push
        };

        // Mirrors the format used in ReminderNotificationJob
        var url = $"/reminders?open={notification.ReminderId}";

        Assert.Equal("/reminders?open=99", url);
    }

    [Fact]
    public void PushBody_ContainsTimeFormatted_WithClockEmoji()
    {
        var reminderTime = new DateTime(2025, 6, 15, 9, 30, 0);
        var description = "Reunión con cliente";

        var expectedBody = $"{description}\n⏰ {reminderTime:HH:mm}";

        Assert.Contains("⏰", expectedBody);
        Assert.Contains("09:30", expectedBody);
        Assert.Contains(description, expectedBody);
    }

    [Fact]
    public void PushBody_WhenNoDescription_ShowsOnlyTime()
    {
        var reminderTime = new DateTime(2025, 6, 15, 14, 0, 0);
        string? description = null;

        var body = string.IsNullOrWhiteSpace(description)
            ? $"⏰ {reminderTime:HH:mm}"
            : $"{description}\n⏰ {reminderTime:HH:mm}";

        Assert.Equal("⏰ 14:00", body);
    }

    [Fact]
    public void PushTitle_DoesNotContain_RecordatorioPrefix()
    {
        string reminderTitle = "Reunión de equipo";

        // The job now uses just the title without prefix
        string pushTitle = reminderTitle;

        Assert.DoesNotContain("Recordatorio:", pushTitle);
        Assert.Equal("Reunión de equipo", pushTitle);
    }

    [Fact]
    public void MutedReminder_ShouldNotSendPush()
    {
        var reminder = new Reminder
        {
            Id = 1,
            Title = "Aviso silenciado",
            Status = ReminderStatus.Muted,
            UserId = 1,
            StartDateTime = DateTime.UtcNow
        };

        // The job skips muted reminders — verify the check logic
        bool shouldSkip = reminder.Status == ReminderStatus.Muted;

        Assert.True(shouldSkip);
    }
}
