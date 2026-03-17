using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Quartz;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Infrastructure.Data;
using mbeNote.Infrastructure.Hubs;
using mbeNote.Infrastructure.Jobs;
using mbeNote.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true
        };
        // Allow SignalR to use query string token
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IReminderService, ReminderService>();
builder.Services.AddScoped<IRecurrenceService, RecurrenceService>();
builder.Services.AddScoped<IReminderHistoryService, ReminderHistoryService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddSingleton<INaturalLanguageParserService, NaturalLanguageParserService>();
builder.Services.AddScoped<WebPushService>();

// SignalR
builder.Services.AddSignalR();

// Quartz
builder.Services.AddQuartz(q =>
{
    var notifJobKey = new JobKey("ReminderNotificationJob");
    q.AddJob<ReminderNotificationJob>(opts => opts.WithIdentity(notifJobKey));
    q.AddTrigger(opts => opts.ForJob(notifJobKey)
        .WithIdentity("ReminderNotificationTrigger")
        .WithSimpleSchedule(x => x.WithIntervalInSeconds(30).RepeatForever()));

    var recurrenceJobKey = new JobKey("ReminderRecurrenceJob");
    q.AddJob<ReminderRecurrenceJob>(opts => opts.WithIdentity(recurrenceJobKey));
    q.AddTrigger(opts => opts.ForJob(recurrenceJobKey)
        .WithIdentity("ReminderRecurrenceTrigger")
        .WithSimpleSchedule(x => x.WithIntervalInHours(1).RepeatForever()));
});
builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Apply migrations
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Error applying migrations");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Serve frontend static files
app.UseDefaultFiles();
app.UseStaticFiles();


// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Helper to get userId from claims
static int GetUserId(ClaimsPrincipal user) =>
    int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);

// ==================== AUTH ====================
app.MapPost("/api/auth/register", async (RegisterRequest req, IAuthService auth) =>
{
    try { return Results.Ok(await auth.RegisterAsync(req)); }
    catch (InvalidOperationException ex) { return Results.Conflict(new { error = ex.Message }); }
});

app.MapPost("/api/auth/login", async (LoginRequest req, IAuthService auth) =>
{
    try { return Results.Ok(await auth.LoginAsync(req)); }
    catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
});

app.MapPost("/api/auth/refresh", async (RefreshTokenRequest req, IAuthService auth) =>
{
    try { return Results.Ok(await auth.RefreshTokenAsync(req.RefreshToken)); }
    catch (UnauthorizedAccessException) { return Results.Unauthorized(); }
});

// ==================== REMINDERS ====================
var reminders = app.MapGroup("/api/reminders").RequireAuthorization();

reminders.MapGet("/", async (HttpContext ctx, IReminderService svc,
    DateTime? from, DateTime? to, int? categoryId, ReminderStatus? status,
    ReminderPriority? priority, string? search, int page = 1, int pageSize = 50) =>
{
    var query = new ReminderListQuery(from, to, categoryId, status, priority, search, page, pageSize);
    return Results.Ok(await svc.GetListAsync(GetUserId(ctx.User), query));
});

reminders.MapGet("/{id:int}", async (int id, HttpContext ctx, IReminderService svc) =>
{
    var result = await svc.GetByIdAsync(GetUserId(ctx.User), id);
    return result != null ? Results.Ok(result) : Results.NotFound();
});

reminders.MapPost("/", async (CreateReminderRequest req, HttpContext ctx, IReminderService svc) =>
    Results.Created($"/api/reminders", await svc.CreateAsync(GetUserId(ctx.User), req)));

reminders.MapPut("/{id:int}", async (int id, UpdateReminderRequest req, HttpContext ctx, IReminderService svc) =>
{
    try { return Results.Ok(await svc.UpdateAsync(GetUserId(ctx.User), id, req)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapDelete("/{id:int}", async (int id, HttpContext ctx, IReminderService svc) =>
{
    try { await svc.DeleteAsync(GetUserId(ctx.User), id); return Results.NoContent(); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapPost("/{id:int}/complete", async (int id, HttpContext ctx, IReminderService svc) =>
{
    try { return Results.Ok(await svc.CompleteAsync(GetUserId(ctx.User), id)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapPost("/{id:int}/snooze", async (int id, SnoozeRequest req, HttpContext ctx, IReminderService svc) =>
{
    try { return Results.Ok(await svc.SnoozeAsync(GetUserId(ctx.User), id, req.Minutes)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapPost("/{id:int}/restore", async (int id, HttpContext ctx, IReminderService svc) =>
{
    try { return Results.Ok(await svc.RestoreAsync(GetUserId(ctx.User), id)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapPost("/{id:int}/duplicate", async (int id, HttpContext ctx, IReminderService svc) =>
{
    try { return Results.Ok(await svc.DuplicateAsync(GetUserId(ctx.User), id)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

reminders.MapGet("/upcoming", async (HttpContext ctx, IReminderService svc, int count = 5) =>
    Results.Ok(await svc.GetUpcomingAsync(GetUserId(ctx.User), count)));

reminders.MapGet("/overdue", async (HttpContext ctx, IReminderService svc) =>
    Results.Ok(await svc.GetOverdueAsync(GetUserId(ctx.User))));

reminders.MapPost("/check-conflicts", async (ConflictCheckRequest req, HttpContext ctx, IReminderService svc) =>
    Results.Ok(await svc.CheckConflictsAsync(GetUserId(ctx.User), req.StartDateTime, req.EndDateTime)));

reminders.MapPost("/parse-natural", (NaturalLanguageRequest req, INaturalLanguageParserService parser) =>
    Results.Ok(parser.Parse(req.Text)));

// ==================== HISTORY ====================
reminders.MapGet("/{id:int}/history", async (int id, IReminderHistoryService svc, int page = 1, int pageSize = 50) =>
    Results.Ok(await svc.GetByReminderAsync(id, page, pageSize)));

reminders.MapGet("/history", async (HttpContext ctx, IReminderHistoryService svc,
    DateTime? from, DateTime? to, HistoryAction? action, int page = 1, int pageSize = 50) =>
{
    var query = new HistoryListQuery(from, to, action, page, pageSize);
    return Results.Ok(await svc.GetGlobalAsync(GetUserId(ctx.User), query));
});

// ==================== NOTIFICATIONS ====================
var notifications = app.MapGroup("/api/notifications").RequireAuthorization();

notifications.MapGet("/", async (HttpContext ctx, INotificationService svc,
    bool unreadOnly = false, int page = 1, int pageSize = 20) =>
{
    var query = new NotificationListQuery(unreadOnly, page, pageSize);
    return Results.Ok(await svc.GetListAsync(GetUserId(ctx.User), query));
});

notifications.MapGet("/count", async (HttpContext ctx, INotificationService svc) =>
    Results.Ok(await svc.GetUnreadCountAsync(GetUserId(ctx.User))));

notifications.MapPut("/{id:int}/read", async (int id, HttpContext ctx, INotificationService svc) =>
{
    await svc.MarkAsReadAsync(GetUserId(ctx.User), id);
    return Results.NoContent();
});

notifications.MapPut("/read-all", async (HttpContext ctx, INotificationService svc) =>
{
    await svc.MarkAllAsReadAsync(GetUserId(ctx.User));
    return Results.NoContent();
});

notifications.MapDelete("/{id:int}", async (int id, HttpContext ctx, INotificationService svc) =>
{
    await svc.DismissAsync(GetUserId(ctx.User), id);
    return Results.NoContent();
});

// ==================== CATEGORIES ====================
var categories = app.MapGroup("/api/categories").RequireAuthorization();

categories.MapGet("/", async (HttpContext ctx, ICategoryService svc) =>
    Results.Ok(await svc.GetAllAsync(GetUserId(ctx.User))));

categories.MapPost("/", async (CreateCategoryRequest req, HttpContext ctx, ICategoryService svc) =>
    Results.Created("/api/categories", await svc.CreateAsync(GetUserId(ctx.User), req)));

categories.MapPut("/{id:int}", async (int id, UpdateCategoryRequest req, HttpContext ctx, ICategoryService svc) =>
{
    try { return Results.Ok(await svc.UpdateAsync(GetUserId(ctx.User), id, req)); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

categories.MapDelete("/{id:int}", async (int id, HttpContext ctx, ICategoryService svc) =>
{
    try { await svc.DeleteAsync(GetUserId(ctx.User), id); return Results.NoContent(); }
    catch (KeyNotFoundException) { return Results.NotFound(); }
});

// ==================== ANALYTICS ====================
var analytics = app.MapGroup("/api/analytics").RequireAuthorization();

analytics.MapGet("/completion-rates", async (HttpContext ctx, IAnalyticsService svc, DateTime from, DateTime to) =>
    Results.Ok(await svc.GetCompletionRatesAsync(GetUserId(ctx.User), from, to)));

analytics.MapGet("/active-hours", async (HttpContext ctx, IAnalyticsService svc) =>
    Results.Ok(await svc.GetActiveHoursAsync(GetUserId(ctx.User))));

analytics.MapGet("/streaks", async (HttpContext ctx, IAnalyticsService svc) =>
    Results.Ok(await svc.GetStreaksAsync(GetUserId(ctx.User))));

analytics.MapGet("/category-distribution", async (HttpContext ctx, IAnalyticsService svc) =>
    Results.Ok(await svc.GetCategoryDistributionAsync(GetUserId(ctx.User))));

// ==================== PUSH SUBSCRIPTIONS ====================
app.MapGet("/api/push/vapid-public-key", (IConfiguration config) =>
    Results.Ok(new { key = config["Vapid:PublicKey"] }));

app.MapPost("/api/push/subscribe", async (HttpContext ctx, WebPushService svc) =>
{
    var body = await ctx.Request.ReadFromJsonAsync<PushSubscribeRequest>();
    if (body == null) return Results.BadRequest();
    await svc.SaveSubscriptionAsync(GetUserId(ctx.User), body.Endpoint, body.P256dh, body.Auth);
    return Results.Ok();
}).RequireAuthorization();

app.MapPost("/api/push/unsubscribe", async (HttpContext ctx, WebPushService svc) =>
{
    var body = await ctx.Request.ReadFromJsonAsync<PushUnsubscribeRequest>();
    if (body == null) return Results.BadRequest();
    await svc.RemoveSubscriptionAsync(GetUserId(ctx.User), body.Endpoint);
    return Results.Ok();
}).RequireAuthorization();

// ==================== SIGNALR ====================
app.MapHub<NotificationHub>("/hubs/notifications");

// SPA fallback - serve index.html for non-API routes
app.MapFallbackToFile("index.html");

app.Run();

record PushSubscribeRequest(string Endpoint, string P256dh, string Auth);
record PushUnsubscribeRequest(string Endpoint);
