namespace mbeNote.Core.DTOs;

public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string RefreshToken, UserResponse User);
public record RefreshTokenRequest(string RefreshToken);

public record UserResponse(
    int Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    string TimeZone
);
