using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mbeNote.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReminderLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Links",
                table: "Reminders",
                type: "TEXT",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Links",
                table: "Reminders");
        }
    }
}
