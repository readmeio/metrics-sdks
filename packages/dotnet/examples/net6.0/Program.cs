var readmeApiKey = Environment.GetEnvironmentVariable("README_API_KEY");
if (readmeApiKey == null)
{
  Console.Error.WriteLine("Missing `README_API_KEY` environment variable");
  System.Environment.Exit(1);
}

var allowList = Environment.GetEnvironmentVariable("README_ALLOWLIST");
var denyList = Environment.GetEnvironmentVariable("README_DENYLIST");

var builder = WebApplication.CreateBuilder(args);

builder.Host.ConfigureAppConfiguration((hostingContext, config) =>
{
  config.AddInMemoryCollection(new Dictionary<string, string> {
    {"readme:apiKey", readmeApiKey}
  });
  if (allowList ==  "true")
  {
    config.AddInMemoryCollection(new Dictionary<string, string> {
      {"readme:options:allowList:0", "publicKey" },
      {"readme:options:allowList:1", "public-header" },
      {"readme:options:allowList:2", "x-header-2" },
    });
  }
  if (denyList ==  "true")
  {
    config.AddInMemoryCollection(new Dictionary<string, string> {
      {"readme:options:denyList:0", "privateKey" },
      {"readme:options:denyList:1", "private-header" },
      {"readme:options:denyList:2", "x-header-1" },
    });
  }
});

var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8000";

app.Use(async (context, next) =>
{
  context.Items["apiKey"] = "owlbert-api-key";
  context.Items["label"] = "Owlbert";
  context.Items["email"] = "owlbert@example.com";

  await next();
});

app.UseMiddleware<ReadMe.Metrics>();

app.MapGet("/", async context =>
{
  await context.Response.WriteAsJsonAsync(new { message = "hello world" });
});

app.MapPost("/", async context =>
{
  context.Response.Headers.Add("x-header-1", "header-1");
  context.Response.Headers.Add("x-header-2", "header-2");
  await context.Response.WriteAsJsonAsync(new
  {
    privateKey = "myPrivateValue",
    publicKey = "myPublicValue"
  });
  context.Response.StatusCode = 200;
  await context.Response.CompleteAsync();
});

app.Run($"http://0.0.0.0:{port}");
