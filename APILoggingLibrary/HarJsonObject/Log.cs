using System.Collections.Generic;

namespace APILoggingLibrary.HarJsonObject
{
    class Log
    {
        public Creator creator { get; set; }
        public List<Entries> entries { get; set; }
        public string version { get; set; }
    }
}
