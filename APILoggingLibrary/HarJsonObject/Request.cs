using System.Collections.Generic;

namespace APILoggingLibrary.HarJsonObject
{
    class Request
    {
        public List<Headers> headers { get; set; }
        public string headersSize { get; set; }
        public string bodySize { get; set; }
        public List<QueryString> queryString { get; set; }
        public string postData { get; set; }
        public List<Cookies> cookies { get; set; }
        public string method { get; set; }
        public string url { get; set; }
        public string httpVersion { get; set; }
    }
}
