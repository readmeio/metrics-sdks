using System;
using Newtonsoft.Json;

namespace ReadMe.HarJsonObjectModels
{
  [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
  class Creator
  {
    public string name { get; set; }

    public string version { get; set; }

    public string comment { get; set; }
  }
}
