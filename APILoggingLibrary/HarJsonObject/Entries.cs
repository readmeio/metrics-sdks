namespace APILoggingLibrary.HarJsonObject
{
    class Entries
    {
        public string pageref { get; set; }
        public string startedDateTime { get; set; }
        public string time { get; set; }
        public string cache { get; set; }
        public Timing timing { get; set; }
        public Request request { get; set; }
        public Response response { get; set; }
    }
}
