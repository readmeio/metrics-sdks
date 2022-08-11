
using RestSharp;
using System;
using System.Text;
using System.Threading.Tasks;

namespace ReadMe.HarJsonTranslationLogics
{
  class ReadMeApiCaller
  {
    private readonly string _harJsonObject;
    private readonly string _apiKey;

    public ReadMeApiCaller(string harJsonObject, string apiKey)
    {
      _harJsonObject = harJsonObject;
      _apiKey = apiKey;
    }

    public void SendHarObjToReadMeApi()
    {
      try
      {
        var client = new RestClient(ConstValues.readmeApiEndpoints);
        var request = new RestRequest(Method.POST);
        request.AddHeader("Content-Type", "application/json");
        string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(_apiKey + ":"));
        request.AddHeader("Authorization", apiKey);
        request.AddParameter("application/json", _harJsonObject, ParameterType.RequestBody);
        client.ExecuteAsync(request);
      }
      catch (Exception)
      {
      }
    }
  }
}
