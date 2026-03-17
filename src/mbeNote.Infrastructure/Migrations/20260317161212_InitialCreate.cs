using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace mbeNote.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    AvatarUrl = table.Column<string>(type: "TEXT", nullable: true),
                    TimeZone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CalendarConnections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Provider = table.Column<int>(type: "INTEGER", nullable: false),
                    EncryptedAccessToken = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    EncryptedRefreshToken = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CalendarId = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    SyncEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarConnections_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReminderCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Icon = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    Color = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderCategories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Reminders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    StartDateTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDateTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsAllDay = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimeZone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: true),
                    Location = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Color = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    RecurrenceRule = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RecurrenceEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NotificationOffsets = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NotificationChannels = table.Column<int>(type: "INTEGER", nullable: false),
                    SnoozedUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SnoozeCount = table.Column<int>(type: "INTEGER", nullable: false),
                    GoogleCalendarEventId = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    OutlookEventId = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reminders_ReminderCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ReminderCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Reminders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReminderTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RecurrenceRule = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: true),
                    NotificationOffsets = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NotificationChannels = table.Column<int>(type: "INTEGER", nullable: false),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderTemplates_ReminderCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ReminderCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ReminderTemplates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ReminderHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReminderId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Action = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousState = table.Column<string>(type: "TEXT", nullable: true),
                    NewState = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderHistory_Reminders_ReminderId",
                        column: x => x.ReminderId,
                        principalTable: "Reminders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReminderHistory_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReminderNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReminderId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DismissedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Channel = table.Column<int>(type: "INTEGER", nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderNotifications_Reminders_ReminderId",
                        column: x => x.ReminderId,
                        principalTable: "Reminders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReminderNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReminderShares",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ReminderId = table.Column<int>(type: "INTEGER", nullable: false),
                    SharedWithUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Permission = table.Column<int>(type: "INTEGER", nullable: false),
                    SharedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReminderShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReminderShares_Reminders_ReminderId",
                        column: x => x.ReminderId,
                        principalTable: "Reminders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReminderShares_Users_SharedWithUserId",
                        column: x => x.SharedWithUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "ReminderCategories",
                columns: new[] { "Id", "Color", "Icon", "IsSystem", "Name", "UserId" },
                values: new object[,]
                {
                    { 1, "#3b82f6", "briefcase", true, "Trabajo", null },
                    { 2, "#8b5cf6", "user", true, "Personal", null },
                    { 3, "#ef4444", "heart", true, "Salud", null },
                    { 4, "#22c55e", "wallet", true, "Finanzas", null },
                    { 5, "#f59e0b", "users", true, "Reunión", null },
                    { 6, "#ec4899", "clock", true, "Deadline", null },
                    { 7, "#06b6d4", "repeat", true, "Hábito", null }
                });

            migrationBuilder.InsertData(
                table: "ReminderTemplates",
                columns: new[] { "Id", "CategoryId", "Description", "IsSystem", "Name", "NotificationChannels", "NotificationOffsets", "Priority", "RecurrenceRule", "UserId" },
                values: new object[,]
                {
                    { 1, 5, "Reunión diaria de equipo", true, "Daily Standup", 1, "[15]", 1, "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", null },
                    { 2, 1, "Revisar objetivos y planificar semana", true, "Revisión Semanal", 1, "[15]", 2, "FREQ=WEEKLY;BYDAY=FR", null },
                    { 3, 4, "Recordatorio de pago mensual", true, "Pago Mensual", 1, "[15]", 2, "FREQ=MONTHLY;BYMONTHDAY=1", null },
                    { 4, 3, "Recordatorio para hidratarse", true, "Beber Agua", 1, "[15]", 0, "FREQ=HOURLY;INTERVAL=2", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarConnections_UserId_Provider",
                table: "CalendarConnections",
                columns: new[] { "UserId", "Provider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReminderCategories_UserId",
                table: "ReminderCategories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderHistory_ReminderId",
                table: "ReminderHistory",
                column: "ReminderId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderHistory_UserId_Timestamp",
                table: "ReminderHistory",
                columns: new[] { "UserId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_ReminderNotifications_ReminderId",
                table: "ReminderNotifications",
                column: "ReminderId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderNotifications_UserId_ReadAt",
                table: "ReminderNotifications",
                columns: new[] { "UserId", "ReadAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReminderNotifications_UserId_ScheduledAt",
                table: "ReminderNotifications",
                columns: new[] { "UserId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_CategoryId",
                table: "Reminders",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_UserId_StartDateTime",
                table: "Reminders",
                columns: new[] { "UserId", "StartDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_UserId_Status",
                table: "Reminders",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ReminderShares_ReminderId_SharedWithUserId",
                table: "ReminderShares",
                columns: new[] { "ReminderId", "SharedWithUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReminderShares_SharedWithUserId",
                table: "ReminderShares",
                column: "SharedWithUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderTemplates_CategoryId",
                table: "ReminderTemplates",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ReminderTemplates_UserId",
                table: "ReminderTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarConnections");

            migrationBuilder.DropTable(
                name: "ReminderHistory");

            migrationBuilder.DropTable(
                name: "ReminderNotifications");

            migrationBuilder.DropTable(
                name: "ReminderShares");

            migrationBuilder.DropTable(
                name: "ReminderTemplates");

            migrationBuilder.DropTable(
                name: "Reminders");

            migrationBuilder.DropTable(
                name: "ReminderCategories");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
