using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class ReminderService : IReminderService
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles
    };

    private readonly AppDbContext _db;
    private readonly IRecurrenceService _recurrence;
    private readonly IReminderHistoryService _history;
    private readonly INotificationService _notifications;

    public ReminderService(AppDbContext db, IRecurrenceService recurrence, IReminderHistoryService history, INotificationService notifications)
    {
        _db = db;
        _recurrence = recurrence;
        _notifications = notifications;
        _history = history;
    }

    public async Task<ReminderResponse> CreateAsync(int userId, CreateReminderRequest request)
    {
        var reminder = new Reminder
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDateTime = request.StartDateTime,
            EndDateTime = request.EndDateTime,
            IsAllDay = request.IsAllDay,
            TimeZone = request.TimeZone ?? "Europe/Madrid",
            Priority = request.Priority,
            CategoryId = request.CategoryId > 0 ? request.CategoryId : null,
            Location = request.Location?.Trim(),
            Color = request.Color ?? "#3b82f6",
            RecurrenceRule = request.RecurrenceRule,
            RecurrenceEndDate = request.RecurrenceEndDate,
            NotificationOffsets = request.NotificationOffsets ?? "[15]",
            NotificationChannels = request.NotificationChannels ?? NotificationChannel.InApp,
            Links = request.Links,
            CreatedAt = DateTime.UtcNow
        };

        _db.Reminders.Add(reminder);
        await _db.SaveChangesAsync();

        var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Created, null, newState, $"Aviso creado: {reminder.Title}");

        // Schedule notifications
        await _notifications.ScheduleForReminderAsync(reminder);

        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> UpdateAsync(int userId, int id, UpdateReminderRequest request)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);

        if (request.Title != null) reminder.Title = request.Title.Trim();
        if (request.Description != null) reminder.Description = request.Description.Trim();
        if (request.StartDateTime.HasValue) reminder.StartDateTime = request.StartDateTime.Value;
        if (request.EndDateTime.HasValue) reminder.EndDateTime = request.EndDateTime.Value;
        if (request.IsAllDay.HasValue) reminder.IsAllDay = request.IsAllDay.Value;
        if (request.TimeZone != null) reminder.TimeZone = request.TimeZone;
        if (request.Priority.HasValue) reminder.Priority = request.Priority.Value;
        if (request.Status.HasValue) reminder.Status = request.Status.Value;
        if (request.CategoryId.HasValue) reminder.CategoryId = request.CategoryId.Value > 0 ? request.CategoryId.Value : null;
        if (request.Location != null) reminder.Location = request.Location.Trim();
        if (request.Color != null) reminder.Color = request.Color;
        if (request.RecurrenceRule != null) reminder.RecurrenceRule = request.RecurrenceRule;
        if (request.RecurrenceEndDate.HasValue) reminder.RecurrenceEndDate = request.RecurrenceEndDate.Value;
        if (request.NotificationOffsets != null) reminder.NotificationOffsets = request.NotificationOffsets;
        if (request.NotificationChannels.HasValue) reminder.NotificationChannels = request.NotificationChannels.Value;
        if (request.Links != null) reminder.Links = request.Links;

        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Updated, previousState, newState, $"Aviso actualizado: {reminder.Title}");

        // Reschedule notifications
        await _notifications.ScheduleForReminderAsync(reminder);

        return await MapToResponseAsync(reminder);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);

        reminder.IsDeleted = true;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Deleted, previousState, null, $"Aviso eliminado: {reminder.Title}");
        await _notifications.CancelForReminderAsync(reminder.Id);
    }

    public async Task<ReminderResponse?> GetByIdAsync(int userId, int id)
    {
        var reminder = await _db.Reminders
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        return reminder == null ? null : await MapToResponseAsync(reminder);
    }

    public async Task<PagedResult<ReminderResponse>> GetListAsync(int userId, ReminderListQuery query)
    {
        var q = _db.Reminders
            .Include(r => r.Category)
            .Where(r => r.UserId == userId);

        if (query.From.HasValue) q = q.Where(r => r.StartDateTime >= query.From.Value);
        if (query.To.HasValue) q = q.Where(r => r.StartDateTime <= query.To.Value);
        if (query.CategoryId.HasValue) q = q.Where(r => r.CategoryId == query.CategoryId.Value);
        if (query.Status.HasValue) q = q.Where(r => r.Status == query.Status.Value);
        if (query.Priority.HasValue) q = q.Where(r => r.Priority == query.Priority.Value);
        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(r => r.Title.Contains(query.Search) || (r.Description != null && r.Description.Contains(query.Search)));

        q = q.OrderBy(r => r.StartDateTime);

        var totalCount = await q.CountAsync();
        var reminders = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var items = new List<ReminderResponse>();
        foreach (var r in reminders)
            items.Add(await MapToResponseAsync(r));

        return new PagedResult<ReminderResponse>(items, totalCount, query.Page, query.PageSize);
    }

    public async Task<ReminderResponse> CompleteAsync(int userId, int id)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);

        reminder.Status = ReminderStatus.Completed;
        reminder.CompletedAt = DateTime.UtcNow;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Completed, previousState, newState, $"Aviso completado: {reminder.Title}");
        await _notifications.CancelForReminderAsync(reminder.Id);

        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> SnoozeAsync(int userId, int id, int minutes)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);

        var snoozeUntil = DateTime.Now.AddMinutes(minutes);
        reminder.SnoozedUntil = snoozeUntil;
        reminder.SnoozeCount++;
        reminder.Status = ReminderStatus.Snoozed;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Cancel any pending notifications and schedule a new one at snooze time
        await _notifications.CancelForReminderAsync(reminder.Id);
        _db.ReminderNotifications.Add(new Core.Models.ReminderNotification
        {
            ReminderId = reminder.Id,
            UserId = reminder.UserId,
            ScheduledAt = snoozeUntil,
            Channel = reminder.NotificationChannels,
            Message = $"🔔 {reminder.Title}"
        });
        await _db.SaveChangesAsync();

        var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Snoozed, previousState, newState, $"Aviso pospuesto {minutes} minutos: {reminder.Title}");

        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> MuteAsync(int userId, int id)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        reminder.Status = ReminderStatus.Muted;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _notifications.CancelForReminderAsync(reminder.Id);
        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> UnmuteAsync(int userId, int id)
    {
        var reminder = await GetOwnedReminderAsync(userId, id);
        reminder.Status = ReminderStatus.Active;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _notifications.ScheduleForReminderAsync(reminder);
        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> RestoreAsync(int userId, int id)
    {
        var reminder = await _db.Reminders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId)
            ?? throw new KeyNotFoundException("Aviso no encontrado.");

        reminder.IsDeleted = false;
        reminder.Status = ReminderStatus.Active;
        reminder.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
        await _history.RecordAsync(reminder.Id, userId, HistoryAction.Restored, null, newState, $"Aviso restaurado: {reminder.Title}");

        return await MapToResponseAsync(reminder);
    }

    public async Task<ReminderResponse> DuplicateAsync(int userId, int id)
    {
        var original = await GetOwnedReminderAsync(userId, id);

        var request = new CreateReminderRequest(
            $"{original.Title} (copia)",
            original.Description,
            original.StartDateTime,
            original.EndDateTime,
            original.IsAllDay,
            original.TimeZone,
            original.Priority,
            original.CategoryId,
            original.Location,
            original.Color,
            original.RecurrenceRule,
            original.RecurrenceEndDate,
            original.NotificationOffsets,
            original.NotificationChannels,
            original.Links
        );

        return await CreateAsync(userId, request);
    }

    public async Task<IReadOnlyList<ReminderResponse>> GetUpcomingAsync(int userId, int count = 5)
    {
        var reminders = await _db.Reminders
            .Include(r => r.Category)
            .Where(r => r.UserId == userId && r.Status == ReminderStatus.Active && r.StartDateTime >= DateTime.UtcNow)
            .OrderBy(r => r.StartDateTime)
            .Take(count)
            .ToListAsync();

        var items = new List<ReminderResponse>();
        foreach (var r in reminders)
            items.Add(await MapToResponseAsync(r));
        return items;
    }

    public async Task<IReadOnlyList<ReminderResponse>> GetOverdueAsync(int userId)
    {
        var reminders = await _db.Reminders
            .Include(r => r.Category)
            .Where(r => r.UserId == userId && r.Status == ReminderStatus.Active && r.StartDateTime < DateTime.UtcNow)
            .OrderBy(r => r.StartDateTime)
            .Take(20)
            .ToListAsync();

        var items = new List<ReminderResponse>();
        foreach (var r in reminders)
            items.Add(await MapToResponseAsync(r));
        return items;
    }

    public async Task<IReadOnlyList<ReminderResponse>> CheckConflictsAsync(int userId, DateTime start, DateTime end)
    {
        var reminders = await _db.Reminders
            .Include(r => r.Category)
            .Where(r => r.UserId == userId && r.Status == ReminderStatus.Active
                && r.StartDateTime < end
                && (r.EndDateTime == null || r.EndDateTime > start))
            .OrderBy(r => r.StartDateTime)
            .ToListAsync();

        var items = new List<ReminderResponse>();
        foreach (var r in reminders)
            items.Add(await MapToResponseAsync(r));
        return items;
    }

    private async Task<Reminder> GetOwnedReminderAsync(int userId, int id)
    {
        return await _db.Reminders
            .Include(r => r.Category)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId)
            ?? throw new KeyNotFoundException("Aviso no encontrado.");
    }

    public async Task<BatchOperationResult> BatchDeleteAsync(int userId, IReadOnlyList<int> ids)
    {
        var reminders = await _db.Reminders
            .Where(r => ids.Contains(r.Id) && r.UserId == userId && !r.IsDeleted)
            .ToListAsync();

        var failedIds = new List<int>();
        var succeeded = 0;

        foreach (var reminder in reminders)
        {
            try
            {
                var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);
                reminder.IsDeleted = true;
                reminder.UpdatedAt = DateTime.UtcNow;
                await _history.RecordAsync(reminder.Id, userId, HistoryAction.Deleted, previousState, null, $"Aviso eliminado en lote: {reminder.Title}");
                await _notifications.CancelForReminderAsync(reminder.Id);
                succeeded++;
            }
            catch
            {
                failedIds.Add(reminder.Id);
            }
        }

        // Add ids not found as failed
        var foundIds = reminders.Select(r => r.Id).ToHashSet();
        foreach (var id in ids)
            if (!foundIds.Contains(id) && !failedIds.Contains(id))
                failedIds.Add(id);

        try { await _db.SaveChangesAsync(); }
        catch { /* best-effort */ }

        return new BatchOperationResult(succeeded, failedIds.Count, failedIds);
    }

    public async Task<BatchOperationResult> BatchCompleteAsync(int userId, IReadOnlyList<int> ids)
    {
        var reminders = await _db.Reminders
            .Where(r => ids.Contains(r.Id) && r.UserId == userId && !r.IsDeleted)
            .ToListAsync();

        var failedIds = new List<int>();
        var succeeded = 0;

        foreach (var reminder in reminders)
        {
            try
            {
                var previousState = JsonSerializer.Serialize(reminder, _jsonOptions);
                reminder.Status = ReminderStatus.Completed;
                reminder.CompletedAt = DateTime.UtcNow;
                reminder.UpdatedAt = DateTime.UtcNow;
                var newState = JsonSerializer.Serialize(reminder, _jsonOptions);
                await _history.RecordAsync(reminder.Id, userId, HistoryAction.Completed, previousState, newState, $"Aviso completado en lote: {reminder.Title}");
                await _notifications.CancelForReminderAsync(reminder.Id);
                succeeded++;
            }
            catch
            {
                failedIds.Add(reminder.Id);
            }
        }

        // Add ids not found as failed
        var foundIds = reminders.Select(r => r.Id).ToHashSet();
        foreach (var id in ids)
            if (!foundIds.Contains(id) && !failedIds.Contains(id))
                failedIds.Add(id);

        try { await _db.SaveChangesAsync(); }
        catch { /* best-effort */ }

        return new BatchOperationResult(succeeded, failedIds.Count, failedIds);
    }

    private Task<ReminderResponse> MapToResponseAsync(Reminder r)
    {
        var recurrenceDesc = !string.IsNullOrEmpty(r.RecurrenceRule)
            ? _recurrence.DescribeRRule(r.RecurrenceRule)
            : null;

        return Task.FromResult(new ReminderResponse(
            r.Id, r.Title, r.Description,
            r.StartDateTime, r.EndDateTime, r.IsAllDay, r.TimeZone,
            r.Priority, r.Status,
            r.CategoryId, r.Category?.Name, r.Category?.Color,
            r.Location, r.Color,
            r.RecurrenceRule, recurrenceDesc, r.RecurrenceEndDate,
            r.NotificationOffsets, r.NotificationChannels,
            r.SnoozedUntil, r.SnoozeCount,
            r.CreatedAt, r.UpdatedAt, r.CompletedAt,
            r.Links
        ));
    }
}
