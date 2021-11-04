using System.Collections.Generic;

namespace APILoggingLibrary.HarJsonObject
{
    class Response
    {
        public List<Headers> headers { get; set; }
        public Content content { get; set; }
        public string status { get; set; }
        public string statusText { get; set; }
        public string httpVersion { get; set; }
        public List<Cookies> cookies { get; set; }
        public string redirectURL { get; set; }
        public string headersSize { get; set; }
        public string bodySize { get; set; }
    }
}
