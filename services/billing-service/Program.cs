using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Azure.Messaging.ServiceBus;
using Dapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<BillingWorker>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }));
app.MapGet("/invoices", async (IConfiguration config) => 
{
    var connString = config["DB_CONNECTION_STRING"];
    if (string.IsNullOrEmpty(connString)) return Results.Problem("Missing connection string");
    
    using var conn = new SqlConnection(connString);
    var invoices = await conn.QueryAsync("SELECT * FROM fin.Invoices");
    return Results.Ok(invoices);
});

app.Run();

public class BillingWorker : BackgroundService
{
    private readonly ILogger<BillingWorker> _logger;
    private readonly IConfiguration _config;
    private ServiceBusClient? _client;
    private ServiceBusProcessor? _processor;

    public BillingWorker(ILogger<BillingWorker> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var sbConnStr = _config["SERVICEBUS_CONNECTION_STRING"];
        if (string.IsNullOrEmpty(sbConnStr))
        {
            _logger.LogWarning("SERVICEBUS_CONNECTION_STRING not set. Exiting worker.");
            return;
        }

        var topicName = _config["SERVICEBUS_TOPIC_NAME"] ?? "domain-events";
        var subName = _config["SERVICEBUS_SUBSCRIPTION_NAME"] ?? "billing-sub";

        _client = new ServiceBusClient(sbConnStr);
        _processor = _client.CreateProcessor(topicName, subName, new ServiceBusProcessorOptions());

        _processor.ProcessMessageAsync += async args =>
        {
            var body = args.Message.Body.ToString();
            _logger.LogInformation($"Received event: {body}");
            
            // Create Mock Invoice
            try
            {
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;
                int appointmentId = root.GetProperty("Id").GetInt32();
                int patientId = root.GetProperty("PatientId").GetInt32();
                
                var connString = _config["DB_CONNECTION_STRING"];
                if (!string.IsNullOrEmpty(connString))
                {
                    using var conn = new SqlConnection(connString);
                    await conn.ExecuteAsync(
                        "INSERT INTO fin.Invoices (PatientId, AppointmentId, Amount, Status, DueDate) VALUES (@PatientId, @AppointmentId, @Amount, 'Unpaid', @DueDate)",
                        new { PatientId = patientId, AppointmentId = appointmentId, Amount = 150.00m, DueDate = DateTime.UtcNow.AddDays(30).Date });
                    _logger.LogInformation("Invoice created successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create invoice.");
            }

            await args.CompleteMessageAsync(args.Message, stoppingToken);
        };

        _processor.ProcessErrorAsync += args =>
        {
            _logger.LogError(args.Exception, "Error processing message");
            return Task.CompletedTask;
        };

        await _processor.StartProcessingAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken);
        }

        await _processor.StopProcessingAsync(stoppingToken);
    }
}
