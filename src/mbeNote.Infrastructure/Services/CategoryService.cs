using Microsoft.EntityFrameworkCore;
using mbeNote.Core.DTOs;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync(int userId)
    {
        return await _db.ReminderCategories
            .Where(c => c.IsSystem || c.UserId == userId)
            .Select(c => new CategoryResponse(
                c.Id,
                c.Name,
                c.Icon,
                c.Color,
                c.IsSystem,
                c.Reminders.Count(r => !r.IsDeleted)
            ))
            .OrderBy(c => c.IsSystem ? 0 : 1)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<CategoryResponse> CreateAsync(int userId, CreateCategoryRequest request)
    {
        var category = new ReminderCategory
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Icon = request.Icon ?? "tag",
            Color = request.Color ?? "#3b82f6",
            IsSystem = false
        };

        _db.ReminderCategories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryResponse(category.Id, category.Name, category.Icon, category.Color, false, 0);
    }

    public async Task<CategoryResponse> UpdateAsync(int userId, int id, UpdateCategoryRequest request)
    {
        var category = await _db.ReminderCategories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsSystem)
            ?? throw new KeyNotFoundException("Categoría no encontrada o no editable.");

        if (request.Name != null) category.Name = request.Name.Trim();
        if (request.Icon != null) category.Icon = request.Icon;
        if (request.Color != null) category.Color = request.Color;

        await _db.SaveChangesAsync();

        var count = await _db.Reminders.CountAsync(r => r.CategoryId == id);
        return new CategoryResponse(category.Id, category.Name, category.Icon, category.Color, false, count);
    }

    public async Task DeleteAsync(int userId, int id)
    {
        var category = await _db.ReminderCategories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId && !c.IsSystem)
            ?? throw new KeyNotFoundException("Categoría no encontrada o no eliminable.");

        // Unlink reminders
        var reminders = await _db.Reminders.Where(r => r.CategoryId == id).ToListAsync();
        foreach (var r in reminders) r.CategoryId = null;

        _db.ReminderCategories.Remove(category);
        await _db.SaveChangesAsync();
    }
}
