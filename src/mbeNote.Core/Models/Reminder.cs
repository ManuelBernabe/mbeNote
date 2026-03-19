using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class Reminder
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime? EndDateTime { get; set; }
    public bool IsAllDay { get; set; }
    public string TimeZone { get; set; } = "Europe/Madrid";

    public ReminderPriority Priority { get; set; } = ReminderPriority.Medium;
    public ReminderStatus Status { get; set; } = ReminderStatus.Active;
    public bool IsDeleted { get; set; }

    public int? CategoryId { get; set; }
    public string? Location { get; set; }
    public string Color { get; set; } = "#3b82f6";

    // Recurrence (RFC 5545 RRULE string, null = one-time)
    public string? RecurrenceRule { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }

    // Notification config
    public string NotificationOffsets { get; set; } = "[15]"; // JSON array of minutes before
    public NotificationChannel NotificationChannels { get; set; } = NotificationChannel.InApp;

    // Snooze
    public DateTime? SnoozedUntil { get; set; }
    public int SnoozeCount { get; set; }

    // Links and notes (JSON array of strings)
    public string? Links { get; set; } // JSON array de strings: URLs y notas

    // External calendar sync
    public string? GoogleCalendarEventId { get; set; }
    public string? OutlookEventId { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public User? User { get; set; }
    public ReminderCategory? Category { get; set; }
    public ICollection<ReminderNotification> Notifications { get; set; } = new List<ReminderNotification>();
    public ICollection<ReminderShare> Shares { get; set; } = new List<ReminderShare>();
    public ICollection<ReminderHistory> History { get; set; } = new List<ReminderHistory>();
}
