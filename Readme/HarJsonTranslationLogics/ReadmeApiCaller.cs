
using RestSharp;
using System;
using System.Text;
using System.Threading.Tasks;

namespace Readme.HarJsonTranslationLogics
{
    class ReadmeApiCaller
    {
        private readonly string _harJsonObject;
        private readonly string _apiKey;

        public ReadmeApiCaller(string harJsonObject, string apiKey)
        {
            _harJsonObject = harJsonObject;
            _apiKey = apiKey;
        }

        public async Task<string> SendHarObjToReadmeApi()
        {
            try
            {
                var client = new RestClient(ConstValues.readmeApiEndpoints);
                var request = new RestRequest(Method.POST);
                request.AddHeader("Content-Type", "application/json");
                string apiKey = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(_apiKey + ":"));
                //Basic V3RCbllRYWg4Vzh0TWdmOEVoV1NsQlVTSFN0V3kzTHc6
                request.AddHeader("Authorization", apiKey);
                request.AddParameter("application/json", _harJsonObject, ParameterType.RequestBody);
                IRestResponse response = await client.ExecuteAsync(request);
                return response.Content;
            }
            catch (Exception)
            {
                return null;
            } 
        }
    }
}
