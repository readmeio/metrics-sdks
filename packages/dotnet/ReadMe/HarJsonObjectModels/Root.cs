namespace ReadMe.HarJsonObjectModels
{
  class Root
  {
    public string _id { get; set; }

    public bool development { get; set; }

    public string clientIPAddress { get; set; }

    public Group group { get; set; }

    public RequestMain request { get; set; }
  }
}
