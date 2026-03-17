using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using mbeNote.Core.DTOs;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;

namespace mbeNote.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("El email ya está registrado.");

        var user = new User
        {
            Email = request.Email.ToLowerInvariant().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant().Trim());
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var principal = GetPrincipalFromToken(refreshToken);
        if (principal == null)
            throw new UnauthorizedAccessException("Token inválido.");

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Token inválido.");

        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException("Usuario no encontrado.");

        return GenerateAuthResponse(user);
    }

    private AuthResponse GenerateAuthResponse(User user)
    {
        var token = GenerateJwtToken(user, TimeSpan.FromHours(24));
        var refreshToken = GenerateJwtToken(user, TimeSpan.FromDays(30));

        return new AuthResponse(token, refreshToken, new UserResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.AvatarUrl,
            user.TimeZone
        ));
    }

    private string GenerateJwtToken(User user, TimeSpan expiry)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured")));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.Add(expiry),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateLifetime = false
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
