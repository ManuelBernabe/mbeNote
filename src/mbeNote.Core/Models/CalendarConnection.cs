using mbeNote.Core.Enums;

namespace mbeNote.Core.Models;

public class CalendarConnection
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public CalendarProvider Provider { get; set; }
    public string EncryptedAccessToken { get; set; } = string.Empty;
    public string? EncryptedRefreshToken { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public string? CalendarId { get; set; }
    public bool SyncEnabled { get; set; } = true;
    public DateTime? LastSyncedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
