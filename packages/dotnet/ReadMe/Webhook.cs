using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Primitives;
using static System.Text.Encoding;

namespace ReadMe
{
  public static class Webhook
  {
    public static void Verify(string body, StringValues signature, string secret)
    {
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
      var unsigned = time + "." + body;
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
  }
}
