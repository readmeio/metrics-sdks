using System.Collections.Generic;

namespace ReadMe.HarJsonObjectModels
{
  class Request
  {
    public List<Headers> headers { get; set; }

    public long headersSize { get; set; }

    public List<QueryStrings> queryString { get; set; }

    public PostData postData { get; set; }

    public List<Cookies> cookies { get; set; }

    public string method { get; set; }

    public string url { get; set; }

    public string httpVersion { get; set; }
  }
}
