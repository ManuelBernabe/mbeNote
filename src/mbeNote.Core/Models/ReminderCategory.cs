namespace mbeNote.Core.Models;

public class ReminderCategory
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "tag";
    public string Color { get; set; } = "#3b82f6";
    public bool IsSystem { get; set; }

    public User? User { get; set; }
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}
