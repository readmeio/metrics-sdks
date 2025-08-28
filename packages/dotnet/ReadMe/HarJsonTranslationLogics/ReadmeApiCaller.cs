using System;
using System.Net.Http;
using System.Text;

namespace ReadMe.HarJsonTranslationLogics
{
  class ReadMeApiCaller
  {
    private readonly string harJsonObjects;
    private readonly string apiKey;

    public ReadMeApiCaller(string harJsonObjects, string apiKey)
    {
      this.harJsonObjects = harJsonObjects;
      this.apiKey = apiKey;
    }

    public void SendHarObjToReadMeApi(bool fireAndForget)
    {
      try
      {
        var client = new HttpClient();

        var request = new HttpRequestMessage(HttpMethod.Post, ConstValues.ReadmeAPIEndpoints);
        string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(this.apiKey + ":"));
        request.Headers.Add("Authorization", apiKey);
        request.Content = new StringContent(this.harJsonObjects, Encoding.UTF8, "application/json");
        if (fireAndForget)
        {
          client.SendAsync(request);
        }
        else
        {
          client.SendAsync(request).GetAwaiter().GetResult();
        }
      }
      catch (Exception)
      {
      }
    }
  }
}
