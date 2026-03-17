using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class ReminderNotification
{
    public int Id { get; set; }
    public int ReminderId { get; set; }
    public int UserId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? DismissedAt { get; set; }
    public NotificationChannel Channel { get; set; }
    public string? Message { get; set; }

    public Reminder? Reminder { get; set; }
    public User? User { get; set; }
}
