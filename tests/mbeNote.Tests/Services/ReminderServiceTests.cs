using Microsoft.EntityFrameworkCore;
using Moq;
using mbeNote.Core.DTOs;
using mbeNote.Core.Enums;
using mbeNote.Core.Interfaces;
using mbeNote.Core.Models;
using mbeNote.Infrastructure.Data;
using mbeNote.Infrastructure.Services;

namespace mbeNote.Tests.Services;

public class ReminderServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IRecurrenceService> _recurrenceMock;
    private readonly Mock<IReminderHistoryService> _historyMock;
    private readonly Mock<INotificationService> _notificationsMock;
    private readonly ReminderService _sut;
    private readonly int _userId = 1;

    public ReminderServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _recurrenceMock = new Mock<IRecurrenceService>();
        _recurrenceMock.Setup(r => r.DescribeRRule(It.IsAny<string>())).Returns("Descripción recurrencia");

        _historyMock = new Mock<IReminderHistoryService>();
        _historyMock.Setup(h => h.RecordAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<HistoryAction>(),
            It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _notificationsMock = new Mock<INotificationService>();
        _notificationsMock.Setup(n => n.ScheduleForReminderAsync(It.IsAny<Reminder>()))
            .Returns(Task.CompletedTask);
        _notificationsMock.Setup(n => n.CancelForReminderAsync(It.IsAny<int>()))
            .Returns(Task.CompletedTask);

        _sut = new ReminderService(_db, _recurrenceMock.Object, _historyMock.Object, _notificationsMock.Object);
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static CreateReminderRequest BuildCreateRequest(
        string title = "Test Aviso",
        DateTime? start = null) =>
        new(
            title,
            "Descripción de prueba",
            start ?? DateTime.UtcNow.AddHours(1),
            null,
            false,
            "Europe/Madrid",
            ReminderPriority.Medium,
            null, null, null, null, null,
            "[15]",
            NotificationChannel.InApp
        );

    // ── CreateAsync ────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_SetsCorrectFields()
    {
        var req = BuildCreateRequest("Reunión importante");

        var result = await _sut.CreateAsync(_userId, req);

        Assert.Equal("Reunión importante", result.Title);
        Assert.Equal(ReminderStatus.Active, result.Status);
        Assert.Equal("[15]", result.NotificationOffsets);
        Assert.NotEqual(0, result.Id);
    }

    [Fact]
    public async Task CreateAsync_TrimsTitle()
    {
        var req = BuildCreateRequest("  Aviso con espacios  ");

        var result = await _sut.CreateAsync(_userId, req);

        Assert.Equal("Aviso con espacios", result.Title);
    }

    [Fact]
    public async Task CreateAsync_UsesDefaultTimezone_WhenNoneProvided()
    {
        var req = new CreateReminderRequest(
            "Test", null, DateTime.UtcNow.AddHours(1),
            null, false, null,
            ReminderPriority.Low, null, null, null, null, null,
            "[15]", NotificationChannel.InApp);

        var result = await _sut.CreateAsync(_userId, req);

        Assert.Equal("Europe/Madrid", result.TimeZone);
    }

    [Fact]
    public async Task CreateAsync_SchedulesNotifications()
    {
        var req = BuildCreateRequest();

        await _sut.CreateAsync(_userId, req);

        _notificationsMock.Verify(n => n.ScheduleForReminderAsync(
            It.Is<Reminder>(r => r.Title == "Test Aviso")), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_RecordsHistory()
    {
        var req = BuildCreateRequest();

        await _sut.CreateAsync(_userId, req);

        _historyMock.Verify(h => h.RecordAsync(
            It.IsAny<int>(), _userId, HistoryAction.Created,
            null, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    // ── DeleteAsync ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_SoftDeletesReminder()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        await _sut.DeleteAsync(_userId, created.Id);

        // With query filter active, reminder is not visible
        // Note: FindAsync bypasses global query filters; use FirstOrDefaultAsync instead
        var visible = await _db.Reminders.FirstOrDefaultAsync(r => r.Id == created.Id);
        Assert.Null(visible);

        // Without filter, it still exists as deleted
        var raw = await _db.Reminders.IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == created.Id);
        Assert.NotNull(raw);
        Assert.True(raw!.IsDeleted);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsKeyNotFound_WhenNotOwner()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _sut.DeleteAsync(userId: 999, id: created.Id));
    }

    [Fact]
    public async Task DeleteAsync_CancelsNotifications()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        await _sut.DeleteAsync(_userId, created.Id);

        _notificationsMock.Verify(n => n.CancelForReminderAsync(created.Id), Times.Once);
    }

    // ── CompleteAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CompleteAsync_SetsStatusCompleted()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        var result = await _sut.CompleteAsync(_userId, created.Id);

        Assert.Equal(ReminderStatus.Completed, result.Status);
        Assert.NotNull(result.CompletedAt);
    }

    [Fact]
    public async Task CompleteAsync_RecordsHistory()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        await _sut.CompleteAsync(_userId, created.Id);

        _historyMock.Verify(h => h.RecordAsync(
            created.Id, _userId, HistoryAction.Completed,
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    // ── UpdateAsync (reactivation) ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_CanReactivateCompletedReminder()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());
        await _sut.CompleteAsync(_userId, created.Id);

        var newStart = DateTime.UtcNow.AddDays(2);
        var updateReq = new UpdateReminderRequest(
            null, null, newStart, null, null, null, null,
            ReminderStatus.Active,
            null, null, null, null, null, null, null);

        var result = await _sut.UpdateAsync(_userId, created.Id, updateReq);

        Assert.Equal(ReminderStatus.Active, result.Status);
        Assert.Equal(newStart, result.StartDateTime);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsKeyNotFound_WhenNotOwner()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());

        var req = new UpdateReminderRequest("Nuevo título", null, null, null, null,
            null, null, null, null, null, null, null, null, null, null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _sut.UpdateAsync(userId: 999, id: created.Id, request: req));
    }

    // ── GetOverdueAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetOverdueAsync_ReturnsOnlyPastActiveReminders()
    {
        // Past active → overdue
        await _sut.CreateAsync(_userId, BuildCreateRequest("Vencido", DateTime.UtcNow.AddHours(-2)));
        // Future active → not overdue
        await _sut.CreateAsync(_userId, BuildCreateRequest("Futuro", DateTime.UtcNow.AddHours(2)));
        // Past but completed → not overdue
        var completed = await _sut.CreateAsync(_userId, BuildCreateRequest("Completado", DateTime.UtcNow.AddHours(-1)));
        await _sut.CompleteAsync(_userId, completed.Id);

        var overdue = await _sut.GetOverdueAsync(_userId);

        Assert.Single(overdue);
        Assert.Equal("Vencido", overdue[0].Title);
    }

    [Fact]
    public async Task GetOverdueAsync_ReturnsEmpty_WhenNoOverdue()
    {
        await _sut.CreateAsync(_userId, BuildCreateRequest("Futuro", DateTime.UtcNow.AddHours(1)));

        var overdue = await _sut.GetOverdueAsync(_userId);

        Assert.Empty(overdue);
    }

    // ── GetByIdAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        var result = await _sut.GetByIdAsync(_userId, 99999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenDeletedReminder()
    {
        var created = await _sut.CreateAsync(_userId, BuildCreateRequest());
        await _sut.DeleteAsync(_userId, created.Id);

        var result = await _sut.GetByIdAsync(_userId, created.Id);

        Assert.Null(result);
    }
}
