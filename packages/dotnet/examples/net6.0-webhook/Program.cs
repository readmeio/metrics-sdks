using System.Text;
using static System.Text.Encoding;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "4000";
var secret = Environment.GetEnvironmentVariable("README_API_KEY") ?? "";

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

    var time = input["t"].First();
    if (DateTime.Now.Subtract(DateTimeOffset.FromUnixTimeMilliseconds(long.Parse(time)).DateTime).Minutes > 30)
    {
      throw new Exception("Expired Signature");
    }

    var readmeSignature = input["v0"].First();
    var json = await new StreamReader(context.Request.Body).ReadToEndAsync();
    var unsigned = time + "." + json;
    var hmac = HMAC.Create("HMACSHA256");
    hmac.Initialize();
    hmac.Key = UTF8.GetBytes(secret);
    var result = UTF8.GetBytes(unsigned);
    var hash = hmac.ComputeHash(result);

    var verifySignature = new StringBuilder(hash.Length * 2);
    foreach (byte b in hash)
    {
      verifySignature.AppendFormat("{0:x2}", b);
    }

    if (verifySignature.ToString() != readmeSignature)
    {
      throw new Exception("Invalid Signature");
    }
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
    petstore_auth = "default-key",
    basic_auth = new { user = "user", pass = "pass" }
  });
});

app.Run($"http://localhost:{port}");
