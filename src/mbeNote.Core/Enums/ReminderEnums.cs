namespace mbeNote.Core.Enums;

public enum ReminderPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum ReminderStatus
{
    Active = 0,
    Completed = 1,
    Cancelled = 2,
    Snoozed = 3
}

[Flags]
public enum NotificationChannel
{
    None = 0,
    InApp = 1,
    Email = 2,
    Push = 4
}

public enum SharePermission
{
    View = 0,
    Edit = 1
}

public enum CalendarProvider
{
    GoogleCalendar = 0,
    Outlook = 1
}

public enum HistoryAction
{
    Created = 0,
    Updated = 1,
    Completed = 2,
    Deleted = 3,
    Snoozed = 4,
    Restored = 5,
    Shared = 6
}
