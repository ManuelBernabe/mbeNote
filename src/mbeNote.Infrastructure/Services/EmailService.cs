using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace mbeNote.Infrastructure.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private static readonly HttpClient _http = new();

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendReminderEmailAsync(string toEmail, string subject, string reminderTitle, DateTime reminderTime, string? description)
    {
        var apiKey = _config["Resend:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogDebug("Resend API key not configured, skipping email");
            return;
        }

        var fromEmail = _config["Resend:FromEmail"] ?? "mbeNote <onboarding@resend.dev>";

        try
        {
            var htmlBody = $@"
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

            var payload = JsonSerializer.Serialize(new
            {
                from = fromEmail,
                to = new[] { toEmail },
                subject = $"Recordatorio: {subject}",
                html = htmlBody
            });

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _http.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent to {Email} for: {Title}", toEmail, reminderTitle);
            }
            else
            {
                _logger.LogError("Resend API error {Status}: {Body}", response.StatusCode, responseBody);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
