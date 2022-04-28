using System;

namespace Readme
{
  public static class ConstValues
  {
    public static readonly string name = "readmeio.net";
    public static readonly string version = "1.0.2";
    public static readonly int wait = 0;
    public static readonly string receive = null;
    public static string readmeApiEndpoints
    {
      get
      {
        var metricsHost = System.Environment.GetEnvironmentVariable("METRICS_SERVER");
        if (metricsHost == null) metricsHost = "https://metrics.readme.io/";

        UriBuilder uri = new UriBuilder(metricsHost);
        uri.Path = "/v1/request";

        return uri.ToString();
      }
    }
  }
}
