using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class ReminderHistoryService : IReminderHistoryService
{
    private readonly AppDbContext _db;

    public ReminderHistoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task RecordAsync(int reminderId, int userId, HistoryAction action, string? previousState, string? newState, string? description)
    {
        var entry = new ReminderHistory
        {
            ReminderId = reminderId,
            UserId = userId,
            Action = action,
            PreviousState = previousState,
            NewState = newState,
            Description = description,
            Timestamp = DateTime.UtcNow
        };

        _db.ReminderHistory.Add(entry);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<HistoryResponse>> GetByReminderAsync(int reminderId, int page = 1, int pageSize = 50)
    {
        var query = _db.ReminderHistory
            .Include(h => h.Reminder)
            .Where(h => h.ReminderId == reminderId)
            .OrderByDescending(h => h.Timestamp);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HistoryResponse(
                h.Id,
                h.ReminderId,
                h.Reminder != null ? h.Reminder.Title : null,
                h.Action,
                h.Description,
                h.PreviousState,
                h.NewState,
                h.Timestamp
            ))
            .ToListAsync();

        return new PagedResult<HistoryResponse>(items, totalCount, page, pageSize);
    }

    public async Task<PagedResult<HistoryResponse>> GetGlobalAsync(int userId, HistoryListQuery query)
    {
        var q = _db.ReminderHistory
            .Include(h => h.Reminder)
            .Where(h => h.UserId == userId);

        if (query.From.HasValue)
            q = q.Where(h => h.Timestamp >= query.From.Value);
        if (query.To.HasValue)
            q = q.Where(h => h.Timestamp <= query.To.Value);
        if (query.Action.HasValue)
            q = q.Where(h => h.Action == query.Action.Value);

        q = q.OrderByDescending(h => h.Timestamp);

        var totalCount = await q.CountAsync();
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(h => new HistoryResponse(
                h.Id,
                h.ReminderId,
                h.Reminder != null ? h.Reminder.Title : null,
                h.Action,
                h.Description,
                h.PreviousState,
                h.NewState,
                h.Timestamp
            ))
            .ToListAsync();

        return new PagedResult<HistoryResponse>(items, totalCount, query.Page, query.PageSize);
    }
}
