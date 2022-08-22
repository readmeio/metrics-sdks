using Newtonsoft.Json;

namespace ReadMe.HarJsonObjectModels
{
  [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
  class Cookies
  {
    public string name { get; set; }

    public string value { get; set; }
  }
}
