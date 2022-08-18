var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var secret = Environment.GetEnvironmentVariable("README_API_KEY");

app.MapPost("/webhook", async context =>
{
  var signature = context.Request.Headers["readme-signature"];
  var body = await new StreamReader(context.Request.Body).ReadToEndAsync();

  try
  {
    ReadMe.Webhook.Verify(body, signature, secret);
  }
  catch (Exception e)
  {
    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    await context.Response.WriteAsJsonAsync(new
    {
      error = e.Message,
    });
    return;
  }

  await context.Response.WriteAsJsonAsync(new
  {
    // OAS Security variables
    api_key = "default-api_key-key",
    http_basic = new { user = "user", pass = "pass" },
    http_bearer = "default-http_bearer-key",
    oauth2 = "default-oauth2-key",
  });
});

app.Run($"http://localhost:4000");
