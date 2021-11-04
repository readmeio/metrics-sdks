namespace APILoggingLibrary.HarJsonObject
{
    class Root
    {
        public string _id { get; set; }
        public string development { get; set; }
        public string clientIPAddress { get; set; }
        public Group group { get; set; }
        public RequestMain request { get; set; }
    }
}
