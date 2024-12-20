using System;

namespace ReadMe
{
  public static class ConstValues
  {
    public static readonly string Name = "readmeio.net";

    public static readonly string Version = "2.2.0";

    public static readonly int Wait = 0;

    public static readonly string Receive = null;

    public static string ReadmeAPIEndpoints
    {
      get
      {
        var metricsHost = System.Environment.GetEnvironmentVariable("README_METRICS_SERVER");
        if (metricsHost == null)
        {
          metricsHost = "https://metrics.readme.io/";
        }

        UriBuilder uri = new UriBuilder(metricsHost);
        uri.Path = "/v1/request";

        return uri.ToString();
      }
    }
  }
}
