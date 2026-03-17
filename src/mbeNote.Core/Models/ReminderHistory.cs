using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class ReminderHistory
{
    public int Id { get; set; }
    public int ReminderId { get; set; }
    public int UserId { get; set; }
    public HistoryAction Action { get; set; }
    public string? PreviousState { get; set; } // JSON snapshot
    public string? NewState { get; set; }       // JSON snapshot
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Reminder? Reminder { get; set; }
    public User? User { get; set; }
}
