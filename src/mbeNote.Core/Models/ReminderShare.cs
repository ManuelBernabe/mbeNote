using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class ReminderShare
{
    public int Id { get; set; }
    public int ReminderId { get; set; }
    public int SharedWithUserId { get; set; }
    public SharePermission Permission { get; set; } = SharePermission.View;
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    public Reminder? Reminder { get; set; }
    public User? SharedWithUser { get; set; }
}
