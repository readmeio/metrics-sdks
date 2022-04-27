if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("README_API_KEY"))) {
  Console.Error.WriteLine("Missing `README_API_KEY` environment variable");
  System.Environment.Exit(1);
}

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT");
if (string.IsNullOrEmpty(port)) port = "4000";

app.Use(async (context, next) => {
  context.Items["apiKey"] = "owlbert-api-key";
  context.Items["label"] = "Owlbert";
  context.Items["email"] = "owlbert@example.com";

  await next();
});

app.UseMiddleware<Readme.Metrics>();

app.MapGet("/", async context => {
  await context.Response.WriteAsJsonAsync(new { message = "hello world" });
});

app.Run($"http://localhost:{port}");
