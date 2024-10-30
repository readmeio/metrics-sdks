using System;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

namespace ReadMe.HarJsonTranslationLogics
{
  public class ReadMeApiCaller
  {
    private readonly string harJsonObject;
    private readonly string apiKey;
    private readonly IRestClient client;

    public ReadMeApiCaller(string harJsonObject, string apiKey, IRestClient client)
    {
      this.harJsonObject = harJsonObject;
      this.apiKey = apiKey;
      this.client = client;
    }

    public void SendHarObjToReadMeApi()
    {
      try
      {
        var request = new RestRequest(Method.POST);
        request.AddHeader("Content-Type", "application/json");
        string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(this.apiKey + ":"));
        request.AddHeader("Authorization", apiKey);
        request.AddParameter("application/json", this.harJsonObject, ParameterType.RequestBody);
        client.ExecuteAsync(request);
      }
      catch (Exception)
      {
      }
    }
  }
}
