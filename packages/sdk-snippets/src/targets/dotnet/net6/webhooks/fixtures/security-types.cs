var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Your ReadMe secret
var secret = "my-readme-secret";

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
    // OAS Security variables
    api_key = "default-api_key-key",
    http_basic = new { user = "user", pass = "pass" },
    http_bearer = "default-http_bearer-key",
    oauth2 = "default-oauth2-key",
  });
});

app.Run($"http://localhost:8000");