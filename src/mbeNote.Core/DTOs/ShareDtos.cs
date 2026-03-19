namespace mbeNote.Core.DTOs;
public record ShareReminderRequest(string TargetEmail, int Permission); // 0=View, 1=Edit
public record ShareResponse(int Id, int ReminderId, string SharedWithEmail, string SharedWithDisplayName, int Permission, DateTime SharedAt);
