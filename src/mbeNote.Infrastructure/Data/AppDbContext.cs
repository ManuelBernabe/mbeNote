using Microsoft.EntityFrameworkCore;
using mbeNote.Core.Enums;
using mbeNote.Core.Models;

namespace mbeNote.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<ReminderCategory> ReminderCategories => Set<ReminderCategory>();
    public DbSet<ReminderNotification> ReminderNotifications => Set<ReminderNotification>();
    public DbSet<ReminderShare> ReminderShares => Set<ReminderShare>();
    public DbSet<ReminderHistory> ReminderHistory => Set<ReminderHistory>();
    public DbSet<ReminderTemplate> ReminderTemplates => Set<ReminderTemplate>();
    public DbSet<CalendarConnection> CalendarConnections => Set<CalendarConnection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.DisplayName).HasMaxLength(100);
            e.Property(u => u.PasswordHash).HasMaxLength(256);
            e.Property(u => u.TimeZone).HasMaxLength(50);
        });

        // Reminder
        modelBuilder.Entity<Reminder>(e =>
        {
            e.HasIndex(r => new { r.UserId, r.StartDateTime });
            e.HasIndex(r => new { r.UserId, r.Status });
            e.Property(r => r.Title).HasMaxLength(200);
            e.Property(r => r.Description).HasMaxLength(2000);
            e.Property(r => r.Location).HasMaxLength(500);
            e.Property(r => r.Color).HasMaxLength(20);
            e.Property(r => r.TimeZone).HasMaxLength(50);
            e.Property(r => r.RecurrenceRule).HasMaxLength(500);
            e.Property(r => r.NotificationOffsets).HasMaxLength(200);
            e.Property(r => r.GoogleCalendarEventId).HasMaxLength(256);
            e.Property(r => r.OutlookEventId).HasMaxLength(256);

            e.HasOne(r => r.User).WithMany(u => u.Reminders).HasForeignKey(r => r.UserId);
            e.HasOne(r => r.Category).WithMany(c => c.Reminders).HasForeignKey(r => r.CategoryId);

            e.HasQueryFilter(r => !r.IsDeleted);
        });

        // ReminderCategory
        modelBuilder.Entity<ReminderCategory>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(50);
            e.Property(c => c.Icon).HasMaxLength(30);
            e.Property(c => c.Color).HasMaxLength(20);
            e.HasOne(c => c.User).WithMany(u => u.Categories).HasForeignKey(c => c.UserId);
        });

        // ReminderNotification
        modelBuilder.Entity<ReminderNotification>(e =>
        {
            e.HasIndex(n => new { n.UserId, n.ScheduledAt });
            e.HasIndex(n => new { n.UserId, n.ReadAt });
            e.Property(n => n.Message).HasMaxLength(500);
            e.HasOne(n => n.Reminder).WithMany(r => r.Notifications).HasForeignKey(n => n.ReminderId);
        });

        // ReminderShare
        modelBuilder.Entity<ReminderShare>(e =>
        {
            e.HasIndex(s => new { s.ReminderId, s.SharedWithUserId }).IsUnique();
            e.HasOne(s => s.Reminder).WithMany(r => r.Shares).HasForeignKey(s => s.ReminderId);
            e.HasOne(s => s.SharedWithUser).WithMany().HasForeignKey(s => s.SharedWithUserId).OnDelete(DeleteBehavior.Restrict);
        });

        // ReminderHistory
        modelBuilder.Entity<ReminderHistory>(e =>
        {
            e.HasIndex(h => h.ReminderId);
            e.HasIndex(h => new { h.UserId, h.Timestamp });
            e.Property(h => h.Description).HasMaxLength(500);
            e.HasOne(h => h.Reminder).WithMany(r => r.History).HasForeignKey(h => h.ReminderId);
        });

        // ReminderTemplate
        modelBuilder.Entity<ReminderTemplate>(e =>
        {
            e.Property(t => t.Name).HasMaxLength(100);
            e.Property(t => t.Description).HasMaxLength(500);
            e.Property(t => t.RecurrenceRule).HasMaxLength(500);
            e.Property(t => t.NotificationOffsets).HasMaxLength(200);
        });

        // CalendarConnection
        modelBuilder.Entity<CalendarConnection>(e =>
        {
            e.HasIndex(c => new { c.UserId, c.Provider }).IsUnique();
            e.Property(c => c.EncryptedAccessToken).HasMaxLength(2000);
            e.Property(c => c.EncryptedRefreshToken).HasMaxLength(2000);
            e.Property(c => c.CalendarId).HasMaxLength(256);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ReminderCategory>().HasData(
            new ReminderCategory { Id = 1, Name = "Trabajo", Icon = "briefcase", Color = "#3b82f6", IsSystem = true },
            new ReminderCategory { Id = 2, Name = "Personal", Icon = "user", Color = "#8b5cf6", IsSystem = true },
            new ReminderCategory { Id = 3, Name = "Salud", Icon = "heart", Color = "#ef4444", IsSystem = true },
            new ReminderCategory { Id = 4, Name = "Finanzas", Icon = "wallet", Color = "#22c55e", IsSystem = true },
            new ReminderCategory { Id = 5, Name = "Reunión", Icon = "users", Color = "#f59e0b", IsSystem = true },
            new ReminderCategory { Id = 6, Name = "Deadline", Icon = "clock", Color = "#ec4899", IsSystem = true },
            new ReminderCategory { Id = 7, Name = "Hábito", Icon = "repeat", Color = "#06b6d4", IsSystem = true }
        );

        modelBuilder.Entity<ReminderTemplate>().HasData(
            new ReminderTemplate { Id = 1, Name = "Daily Standup", Description = "Reunión diaria de equipo", RecurrenceRule = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", Priority = ReminderPriority.Medium, CategoryId = 5, IsSystem = true },
            new ReminderTemplate { Id = 2, Name = "Revisión Semanal", Description = "Revisar objetivos y planificar semana", RecurrenceRule = "FREQ=WEEKLY;BYDAY=FR", Priority = ReminderPriority.High, CategoryId = 1, IsSystem = true },
            new ReminderTemplate { Id = 3, Name = "Pago Mensual", Description = "Recordatorio de pago mensual", RecurrenceRule = "FREQ=MONTHLY;BYMONTHDAY=1", Priority = ReminderPriority.High, CategoryId = 4, IsSystem = true },
            new ReminderTemplate { Id = 4, Name = "Beber Agua", Description = "Recordatorio para hidratarse", RecurrenceRule = "FREQ=HOURLY;INTERVAL=2", Priority = ReminderPriority.Low, CategoryId = 3, IsSystem = true }
        );
    }
}
