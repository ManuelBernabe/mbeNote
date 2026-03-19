using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class ShareService
{
    private readonly AppDbContext _db;
    public ShareService(AppDbContext db) => _db = db;

    public async Task<ShareResponse> ShareAsync(int ownerId, int reminderId, ShareReminderRequest req)
    {
        var reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == ownerId && !r.IsDeleted)
            ?? throw new KeyNotFoundException("Aviso no encontrado.");
        var target = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.TargetEmail)
            ?? throw new KeyNotFoundException("Usuario no encontrado con ese correo.");
        if (target.Id == ownerId) throw new InvalidOperationException("No puedes compartirlo contigo mismo.");

        var existing = await _db.ReminderShares.FirstOrDefaultAsync(s => s.ReminderId == reminderId && s.SharedWithUserId == target.Id);
        if (existing != null)
        {
            existing.Permission = (SharePermission)req.Permission;
            await _db.SaveChangesAsync();
            return Map(existing, target);
        }

        var share = new ReminderShare
        {
            ReminderId = reminderId,
            SharedWithUserId = target.Id,
            Permission = (SharePermission)req.Permission,
            SharedAt = DateTime.UtcNow
        };
        _db.ReminderShares.Add(share);
        await _db.SaveChangesAsync();
        return Map(share, target);
    }

    public async Task<IReadOnlyList<ShareResponse>> GetSharesAsync(int ownerId, int reminderId)
    {
        var reminder = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == reminderId && r.UserId == ownerId)
            ?? throw new KeyNotFoundException();
        var shares = await _db.ReminderShares
            .Include(s => s.SharedWithUser)
            .Where(s => s.ReminderId == reminderId)
            .ToListAsync();
        return shares.Select(s => Map(s, s.SharedWithUser!)).ToList();
    }

    public async Task UnshareAsync(int ownerId, int reminderId, int shareId)
    {
        var share = await _db.ReminderShares.FirstOrDefaultAsync(s => s.Id == shareId && s.ReminderId == reminderId)
            ?? throw new KeyNotFoundException();
        _db.ReminderShares.Remove(share);
        await _db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<ReminderResponse>> GetSharedWithMeAsync(int userId)
    {
        var shares = await _db.ReminderShares
            .Include(s => s.Reminder).ThenInclude(r => r!.Category)
            .Where(s => s.SharedWithUserId == userId && s.Reminder != null && !s.Reminder.IsDeleted)
            .ToListAsync();
        return shares.Select(s => new ReminderResponse(
            s.Reminder!.Id,
            s.Reminder.Title,
            s.Reminder.Description,
            s.Reminder.StartDateTime,
            s.Reminder.EndDateTime,
            s.Reminder.IsAllDay,
            s.Reminder.TimeZone,
            s.Reminder.Priority,
            s.Reminder.Status,
            s.Reminder.CategoryId,
            s.Reminder.Category?.Name,
            s.Reminder.Category?.Color,
            s.Reminder.Location,
            s.Reminder.Color,
            s.Reminder.RecurrenceRule,
            null,
            s.Reminder.RecurrenceEndDate,
            s.Reminder.NotificationOffsets,
            s.Reminder.NotificationChannels,
            s.Reminder.SnoozedUntil,
            s.Reminder.SnoozeCount,
            s.Reminder.CreatedAt,
            s.Reminder.UpdatedAt,
            s.Reminder.CompletedAt,
            s.Reminder.Links
        )).ToList();
    }

    private static ShareResponse Map(ReminderShare s, User u) =>
        new(s.Id, s.ReminderId, u.Email, u.DisplayName, (int)s.Permission, s.SharedAt);
}
