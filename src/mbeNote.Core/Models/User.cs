namespace mbeNote.Core.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string TimeZone { get; set; } = "Europe/Madrid";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
    public ICollection<ReminderCategory> Categories { get; set; } = new List<ReminderCategory>();
}
