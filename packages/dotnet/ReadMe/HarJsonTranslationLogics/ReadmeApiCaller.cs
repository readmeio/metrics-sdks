using System;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

namespace ReadMe.HarJsonTranslationLogics
{
  class ReadMeApiCaller
  {
    private readonly string harJsonObject;
    private readonly string apiKey;

    public ReadMeApiCaller(string harJsonObject, string apiKey)
    {
      this.harJsonObject = harJsonObject;
      this.apiKey = apiKey;
    }

    public void SendHarObjToReadMeApi(bool fireAndForget)
    {
      try
      {
        var client = new RestClient(ConstValues.ReadmeAPIEndpoints);
        var request = new RestRequest(Method.POST);
        request.AddHeader("Content-Type", "application/json");
        string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(this.apiKey + ":"));
        request.AddHeader("Authorization", apiKey);
        request.AddParameter("application/json", this.harJsonObject, ParameterType.RequestBody);
        if (fireAndForget)
        {
          client.ExecuteAsync(request);
        }
        else
        {
          client.Execute(request);
        }
      }
      catch (Exception)
      {
      }
    }
  }
}
