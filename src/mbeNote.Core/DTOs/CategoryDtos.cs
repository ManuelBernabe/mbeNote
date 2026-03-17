namespace mbeNote.Core.DTOs;

public record CreateCategoryRequest(string Name, string? Icon, string? Color);
public record UpdateCategoryRequest(string? Name, string? Icon, string? Color);

public record CategoryResponse(
    int Id,
    string Name,
    string Icon,
    string Color,
    bool IsSystem,
    int ReminderCount
);
