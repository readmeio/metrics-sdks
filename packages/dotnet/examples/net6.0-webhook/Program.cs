var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8000";

// Your ReadMe secret
var secret = Environment.GetEnvironmentVariable("README_API_KEY");
if (secret == null)
{
  Console.Error.WriteLine("Missing `README_API_KEY` environment variable");
  System.Environment.Exit(1);
}

app.MapPost("/webhook", async context =>
{
  // Verify the request is legitimate and came from ReadMe.
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

  // Fetch the user from the database and return their data for use with OpenAPI variables.
  // @todo Write your own query logic to fetch a user by `body["email"]`.

  await context.Response.WriteAsJsonAsync(new
  {
    petstore_auth = "default-key",
    basic_auth = new { user = "user", pass = "pass" },
  });
});

app.Run($"http://0.0.0.0:{port}");
