using Newtonsoft.Json;

namespace ReadMe.HarJsonObjectModels
{
  [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
  class Entries
  {
    public string pageref { get; set; }

    public string startedDateTime { get; set; }

    public int time { get; set; }

    public string cache { get; set; }

    public Timing timing { get; set; }

    public Request request { get; set; }

    public Response response { get; set; }
  }
}
