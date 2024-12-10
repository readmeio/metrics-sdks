using System;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

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
        var client = new RestClient(ConstValues.ReadmeAPIEndpoints);
        var request = new RestRequest(Method.POST);
        request.AddHeader("Content-Type", "application/json");
        string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(this.apiKey + ":"));
        request.AddHeader("Authorization", apiKey);
        request.AddParameter("application/json", this.harJsonObjects, ParameterType.RequestBody);
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
