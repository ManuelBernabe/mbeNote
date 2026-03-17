using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace mbeNote.Infrastructure.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendReminderEmailAsync(string toEmail, string subject, string reminderTitle, DateTime reminderTime, string? description)
    {
        var host = _config["Smtp:Host"];
        if (string.IsNullOrEmpty(host))
        {
            _logger.LogWarning("SMTP not configured, skipping email notification");
            return;
        }

        try
        {
            var port = int.Parse(_config["Smtp:Port"] ?? "587");
            var username = _config["Smtp:Username"] ?? "";
            var password = _config["Smtp:Password"] ?? "";
            var fromEmail = _config["Smtp:FromEmail"] ?? "avisos@mbenote.app";
            var fromName = _config["Smtp:FromName"] ?? "mbeNote";

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };

            var body = $@"
<div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;"">
  <div style=""background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 20px;"">
    <h1 style=""margin: 0; font-size: 20px;"">mbeNote</h1>
    <p style=""margin: 8px 0 0; opacity: 0.9; font-size: 14px;"">Recordatorio</p>
  </div>
  <div style=""background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;"">
    <h2 style=""margin: 0 0 8px; color: #1e293b; font-size: 18px;"">{reminderTitle}</h2>
    <p style=""margin: 0 0 12px; color: #64748b; font-size: 14px;"">
      {reminderTime:dddd, d 'de' MMMM 'de' yyyy 'a las' HH:mm}
    </p>
    {(description != null ? $"<p style=\"margin: 0; color: #475569; font-size: 14px;\">{description}</p>" : "")}
  </div>
  <p style=""text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;"">
    Este email fue enviado por mbeNote
  </p>
</div>";

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = $"Recordatorio: {subject}",
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email notification sent to {Email} for reminder: {Title}", toEmail, reminderTitle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email notification to {Email}", toEmail);
        }
    }
}
