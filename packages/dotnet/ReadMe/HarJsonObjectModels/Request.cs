using System.Collections.Generic;
using Newtonsoft.Json;

namespace ReadMe.HarJsonObjectModels
{
  // Because `PostData` can be nullified and ignored by JSON serialization we need to also ignore
  // nullish data here as well otherwise if `PostData` is `null` then it'll be serialized here as
  // null.
  [JsonObject(ItemNullValueHandling = NullValueHandling.Ignore)]
  class Request
  {
    public List<Headers> headers { get; set; }

    public long headersSize { get; set; }

    public long bodySize { get; set; }

    public List<QueryStrings> queryString { get; set; }

    public PostData postData { get; set; }

    public List<Cookies> cookies { get; set; }

    public string method { get; set; }

    public string url { get; set; }

    public string httpVersion { get; set; }
  }
}
