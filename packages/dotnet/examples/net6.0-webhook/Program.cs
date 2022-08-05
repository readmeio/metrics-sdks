using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "4000";

app.MapPost("/webhook", async context =>
{
  try
  {
    var signature = context.Request.Headers["readme-signature"];
    if (signature.Count == 0)
    {
      throw new Exception("Missing Signature");
    }

    var input = signature.ToString().Split(",").Select(item =>
    {
      var split = item.Trim().Split("=", 2);
      return new { Key = split[0], Value = split[1] };
    })
    .ToLookup(item => item.Key, item => item.Value);

    var time = DateTimeOffset.FromUnixTimeMilliseconds(long.Parse(input["t"].First())).DateTime;
    if (DateTime.Now.Subtract(time).Minutes > 30)
    {
      throw new Exception("Expired Signature");
    }

    var readmeSignature = input["v0"].First();

    // TODO check for validity of signature
  }
  catch (Exception)
  {
    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    await context.Response.WriteAsync("");
    return;
  }

  await context.Response.WriteAsJsonAsync(new
  {
    petstore_auth = "default-key",
    basic_auth = new { user = "user", pass = "pass" }
  });
});

app.Run($"http://localhost:{port}");
