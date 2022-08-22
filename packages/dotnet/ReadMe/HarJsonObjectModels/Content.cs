using Newtonsoft.Json;

namespace ReadMe.HarJsonObjectModels
{
  [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
  class Content
  {
    public string text { get; set; }

    public long size { get; set; }

    public string mimeType { get; set; }
  }
}
