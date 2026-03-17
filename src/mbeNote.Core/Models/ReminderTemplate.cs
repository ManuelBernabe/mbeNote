using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class ReminderTemplate
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? RecurrenceRule { get; set; }
    public ReminderPriority Priority { get; set; } = ReminderPriority.Medium;
    public int? CategoryId { get; set; }
    public string NotificationOffsets { get; set; } = "[15]";
    public NotificationChannel NotificationChannels { get; set; } = NotificationChannel.InApp;
    public bool IsSystem { get; set; }

    public User? User { get; set; }
    public ReminderCategory? Category { get; set; }
}
