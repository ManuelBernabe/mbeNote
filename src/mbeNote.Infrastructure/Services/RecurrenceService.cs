using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using mbeNote.Core.Interfaces;

namespace mbeNote.Infrastructure.Services;

public class RecurrenceService : IRecurrenceService
{
    private static readonly Dictionary<string, string> FrequencyMap = new()
    {
        ["HOURLY"] = "hora",
        ["DAILY"] = "día",
        ["WEEKLY"] = "semana",
        ["MONTHLY"] = "mes",
        ["YEARLY"] = "año"
    };

    private static readonly Dictionary<string, string> DayMap = new()
    {
        ["MO"] = "lunes",
        ["TU"] = "martes",
        ["WE"] = "miércoles",
        ["TH"] = "jueves",
        ["FR"] = "viernes",
        ["SA"] = "sábado",
        ["SU"] = "domingo"
    };

    public IReadOnlyList<DateTime> ExpandOccurrences(string rrule, DateTime start, DateTime rangeStart, DateTime rangeEnd)
    {
        var calendar = new Calendar();
        var calEvent = new CalendarEvent
        {
            DtStart = new CalDateTime(start),
            DtEnd = new CalDateTime(start.AddHours(1))
        };

        calEvent.RecurrenceRules.Add(new RecurrencePattern(rrule));
        calendar.Events.Add(calEvent);

        var occurrences = calendar.GetOccurrences(new CalDateTime(rangeStart));
        return occurrences
            .Where(o => o.Period.StartTime.Value <= rangeEnd)
            .Select(o => o.Period.StartTime.Value)
            .OrderBy(d => d)
            .ToList();
    }

    public string BuildRRule(string frequency, int interval, int[]? daysOfWeek, int? dayOfMonth, DateTime? until, int? count)
    {
        var parts = new List<string>
        {
            $"FREQ={frequency.ToUpperInvariant()}"
        };

        if (interval > 1)
            parts.Add($"INTERVAL={interval}");

        if (daysOfWeek?.Length > 0)
        {
            var dayNames = new[] { "SU", "MO", "TU", "WE", "TH", "FR", "SA" };
            var days = daysOfWeek.Select(d => dayNames[d]);
            parts.Add($"BYDAY={string.Join(",", days)}");
        }

        if (dayOfMonth.HasValue)
            parts.Add($"BYMONTHDAY={dayOfMonth.Value}");

        if (until.HasValue)
            parts.Add($"UNTIL={until.Value:yyyyMMdd'T'HHmmss'Z'}");
        else if (count.HasValue)
            parts.Add($"COUNT={count.Value}");

        return string.Join(";", parts);
    }

    public string DescribeRRule(string rrule)
    {
        if (string.IsNullOrWhiteSpace(rrule))
            return "Una vez";

        var parts = rrule.Split(';').ToDictionary(
            p => p.Split('=')[0],
            p => p.Contains('=') ? p.Split('=')[1] : ""
        );

        var freq = parts.GetValueOrDefault("FREQ", "DAILY");
        var interval = int.TryParse(parts.GetValueOrDefault("INTERVAL", "1"), out var i) ? i : 1;

        var freqName = FrequencyMap.GetValueOrDefault(freq, freq);
        var prefix = interval > 1 ? $"Cada {interval} {freqName}s" : $"Cada {freqName}";

        if (parts.TryGetValue("BYDAY", out var byDay))
        {
            var days = byDay.Split(',').Select(d => DayMap.GetValueOrDefault(d.Trim(), d));
            prefix = $"Cada {string.Join(", ", days)}";
        }

        if (parts.TryGetValue("BYMONTHDAY", out var byMonthDay))
            prefix += $" (día {byMonthDay})";

        if (parts.TryGetValue("COUNT", out var count))
            prefix += $", {count} veces";

        if (parts.TryGetValue("UNTIL", out var until))
        {
            if (DateTime.TryParseExact(until.Replace("Z", ""), "yyyyMMdd'T'HHmmss", null, System.Globalization.DateTimeStyles.None, out var untilDate))
                prefix += $" hasta {untilDate:dd/MM/yyyy}";
        }

        return prefix;
    }
}
