using Newtonsoft.Json;
using System;

namespace ReadmeMetricsLib.HarJsonObjectModels
{
    [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
    class Creator
    {
        public string name { get; set; }
        public string version { get; set; }
        //comment is OS and its version
        public string comment { get; set; }

    }
}
