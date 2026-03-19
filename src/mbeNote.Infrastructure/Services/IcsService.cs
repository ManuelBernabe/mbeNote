using System.Text;
using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using Ical.Net.Serialization;
using Microsoft.EntityFrameworkCore;
using mbeNote.Core.Enums;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class IcsService
{
    private readonly AppDbContext _db;
    public IcsService(AppDbContext db) => _db = db;

    public async Task<string> ExportAsync(int userId, IReadOnlyList<int>? ids = null)
    {
        var query = _db.Reminders.Where(r => r.UserId == userId && !r.IsDeleted);
        if (ids != null && ids.Count > 0) query = query.Where(r => ids.Contains(r.Id));
        var reminders = await query.ToListAsync();

        var calendar = new Calendar();
        calendar.Properties.Add(new CalendarProperty("X-WR-CALNAME", "mbeNote"));

        foreach (var r in reminders)
        {
            var evt = new CalendarEvent
            {
                Uid = $"mbenote-{r.Id}@mbenote.app",
                Summary = r.Title,
                Description = r.Description,
                Location = r.Location,
                DtStart = r.IsAllDay ? new CalDateTime(r.StartDateTime.Date, true) : new CalDateTime(r.StartDateTime),
                DtStamp = new CalDateTime(r.CreatedAt),
            };
            if (r.EndDateTime.HasValue)
                evt.DtEnd = r.IsAllDay ? new CalDateTime(r.EndDateTime.Value.Date) : new CalDateTime(r.EndDateTime.Value);
            if (!string.IsNullOrEmpty(r.RecurrenceRule))
                evt.RecurrenceRules.Add(new RecurrencePattern(r.RecurrenceRule.Replace("RRULE:", "")));
            calendar.Events.Add(evt);
        }

        return new CalendarSerializer().SerializeToString(calendar);
    }

    public async Task<int> ImportAsync(int userId, string icsContent)
    {
        var calendar = Calendar.Load(icsContent);
        int count = 0;
        foreach (var evt in calendar.Events)
        {
            var reminder = new Reminder
            {
                UserId = userId,
                Title = evt.Summary ?? "Importado",
                Description = evt.Description,
                Location = evt.Location,
                StartDateTime = evt.DtStart?.Value ?? DateTime.Now,
                EndDateTime = evt.DtEnd?.Value,
                IsAllDay = evt.IsAllDay,
                Status = ReminderStatus.Active,
                Priority = ReminderPriority.Medium,
                NotificationOffsets = "[15]",
                NotificationChannels = NotificationChannel.InApp,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            if (evt.RecurrenceRules?.Count > 0)
                reminder.RecurrenceRule = "RRULE:" + evt.RecurrenceRules[0].ToString();
            _db.Reminders.Add(reminder);
            count++;
        }
        await _db.SaveChangesAsync();
        return count;
    }
}
