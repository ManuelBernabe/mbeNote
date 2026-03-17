using System.Text.RegularExpressions;
using mbeNote.Core.DTOs;
using mbeNote.Core.Interfaces;

namespace mbeNote.Infrastructure.Services;

public class NaturalLanguageParserService : INaturalLanguageParserService
{
    private static readonly Dictionary<string, string> DayPatterns = new(StringComparer.OrdinalIgnoreCase)
    {
        ["lunes"] = "MO", ["martes"] = "TU", ["miércoles"] = "WE", ["miercoles"] = "WE",
        ["jueves"] = "TH", ["viernes"] = "FR", ["sábado"] = "SA", ["sabado"] = "SA", ["domingo"] = "SU"
    };

    public NaturalLanguageResponse Parse(string text)
    {
        text = text.Trim();
        string? title = null;
        DateTime? startDateTime = null;
        string? recurrenceRule = null;
        string? recurrenceDescription = null;

        // Extract time pattern: "a las HH:mm" or "a las H"
        var timeMatch = Regex.Match(text, @"a las?\s+(\d{1,2})(?::(\d{2}))?", RegexOptions.IgnoreCase);
        var hour = 9;
        var minute = 0;
        if (timeMatch.Success)
        {
            hour = int.Parse(timeMatch.Groups[1].Value);
            minute = timeMatch.Groups[2].Success ? int.Parse(timeMatch.Groups[2].Value) : 0;
        }

        // "cada hora" / "cada X horas"
        var hourlyMatch = Regex.Match(text, @"cada\s+(\d+)?\s*horas?", RegexOptions.IgnoreCase);
        if (hourlyMatch.Success)
        {
            var interval = hourlyMatch.Groups[1].Success ? int.Parse(hourlyMatch.Groups[1].Value) : 1;
            recurrenceRule = $"FREQ=HOURLY;INTERVAL={interval}";
            recurrenceDescription = interval == 1 ? "Cada hora" : $"Cada {interval} horas";
            startDateTime = DateTime.Today.AddHours(DateTime.Now.Hour + 1);
        }

        // "cada día" / "todos los días"
        if (Regex.IsMatch(text, @"(cada d[ií]a|todos los d[ií]as|diariamente)", RegexOptions.IgnoreCase))
        {
            recurrenceRule = "FREQ=DAILY;INTERVAL=1";
            recurrenceDescription = "Cada día";
            startDateTime = DateTime.Today.AddHours(hour).AddMinutes(minute);
        }

        // "cada semana"
        if (Regex.IsMatch(text, @"cada semana|semanalmente", RegexOptions.IgnoreCase))
        {
            recurrenceRule = "FREQ=WEEKLY;INTERVAL=1";
            recurrenceDescription = "Cada semana";
            startDateTime = DateTime.Today.AddHours(hour).AddMinutes(minute);
        }

        // "cada mes"
        if (Regex.IsMatch(text, @"cada mes|mensualmente", RegexOptions.IgnoreCase))
        {
            recurrenceRule = "FREQ=MONTHLY;INTERVAL=1";
            recurrenceDescription = "Cada mes";
            startDateTime = DateTime.Today.AddHours(hour).AddMinutes(minute);
        }

        // "cada año" / "anualmente"
        if (Regex.IsMatch(text, @"cada a[ñn]o|anualmente", RegexOptions.IgnoreCase))
        {
            recurrenceRule = "FREQ=YEARLY;INTERVAL=1";
            recurrenceDescription = "Cada año";
            startDateTime = DateTime.Today.AddHours(hour).AddMinutes(minute);
        }

        // "cada lunes", "cada lunes y miércoles", "los lunes"
        var dayMatches = DayPatterns.Keys
            .Where(day => Regex.IsMatch(text, $@"(cada|los|todos los)\s+.*{Regex.Escape(day)}", RegexOptions.IgnoreCase))
            .Select(day => DayPatterns[day])
            .Distinct()
            .ToList();

        if (dayMatches.Count > 0)
        {
            recurrenceRule = $"FREQ=WEEKLY;BYDAY={string.Join(",", dayMatches)}";
            var dayNames = dayMatches.Select(d => DayPatterns.First(p => p.Value == d).Key);
            recurrenceDescription = $"Cada {string.Join(", ", dayNames)}";
            startDateTime = DateTime.Today.AddHours(hour).AddMinutes(minute);
        }

        // "mañana"
        if (Regex.IsMatch(text, @"\bma[ñn]ana\b", RegexOptions.IgnoreCase) && recurrenceRule == null)
        {
            startDateTime = DateTime.Today.AddDays(1).AddHours(hour).AddMinutes(minute);
        }

        // "en X horas/minutos"
        var inTimeMatch = Regex.Match(text, @"en\s+(\d+)\s+(minutos?|horas?)", RegexOptions.IgnoreCase);
        if (inTimeMatch.Success && recurrenceRule == null)
        {
            var amount = int.Parse(inTimeMatch.Groups[1].Value);
            var unit = inTimeMatch.Groups[2].Value.ToLower();
            startDateTime = unit.StartsWith("hora") ? DateTime.Now.AddHours(amount) : DateTime.Now.AddMinutes(amount);
        }

        // Extract title: remove time/recurrence patterns
        title = text;
        title = Regex.Replace(title, @"(recuérdame|recordar|aviso|avisar)\s*(que|de|para)?\s*", "", RegexOptions.IgnoreCase);
        title = Regex.Replace(title, @"a las?\s+\d{1,2}(:\d{2})?", "", RegexOptions.IgnoreCase);
        title = Regex.Replace(title, @"(cada|todos los|los)\s+[\w\s,y]+", "", RegexOptions.IgnoreCase);
        title = Regex.Replace(title, @"(mañana|hoy|en \d+ (minutos?|horas?))", "", RegexOptions.IgnoreCase);
        title = Regex.Replace(title, @"\s+", " ").Trim();

        if (string.IsNullOrWhiteSpace(title))
            title = null;

        return new NaturalLanguageResponse(title, startDateTime, recurrenceRule, recurrenceDescription);
    }
}
