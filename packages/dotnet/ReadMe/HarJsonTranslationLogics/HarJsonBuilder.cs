using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using ReadMe.HarJsonObjectModels;

namespace ReadMe.HarJsonTranslationLogics
{
  public class HarJsonBuilder
  {
    private readonly RequestDelegate next;
    private readonly HttpContext context;
    private readonly DateTime startDateTime;
    private readonly IConfiguration configuration;
    ConfigValues configValues;
    string guid = null;

    public HarJsonBuilder(RequestDelegate next, HttpContext context, IConfiguration configuration, ConfigValues configValues)
    {
      this.next = next;
      this.context = context;
      this.startDateTime = DateTime.UtcNow;
      this.configuration = configuration;
      this.configValues = configValues;
    }

    internal async Task<Root> BuildHar()
    {
      Root harObj = new Root();
      harObj._id = Guid.NewGuid().ToString();
      this.guid = harObj._id;
      harObj.development = this.configValues.options.development;
      harObj.clientIPAddress = this.context.Connection.RemoteIpAddress.ToString();
      harObj.group = this.BuildGroup();
      harObj.request = new RequestMain(await this.BuildLog());
      return harObj;
    }

    private Group BuildGroup()
    {
      Group group = new Group();
      group.id = MaskHelper.Mask(this.configValues.group.id);
      group.label = this.configValues.group.label;
      group.email = this.configValues.group.email;
      return group;
    }

    private async Task<Log> BuildLog()
    {
      Log log = new Log();
      log.creator = this.BuildCreator();
      log.entries = await this.BuildEntries();
      return log;
    }

    private async Task<List<Entries>> BuildEntries()
    {
      List<Entries> entries = new List<Entries>();

      Entries entry = new Entries();
      entry.pageref = this.context.Request.Scheme + "://" + this.context.Request.Host.Host + ":" + this.context.Request.Host.Port + this.context.Request.Path;
      entry.startedDateTime = this.startDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
      entry.cache = null;
      entry.timing = new Timing { wait = ConstValues.Wait, receive = ConstValues.Receive };

      RequestProcessor requestProcessor = new RequestProcessor(this.context.Request, this.configValues);
      entry.request = await requestProcessor.ProcessRequest();
      entry.response = await this.BuildResponse();
      entry.time = (int)DateTime.UtcNow.Subtract(this.startDateTime).TotalMilliseconds;

      entries.Add(entry);
      return entries;
    }

    private async Task<Response> BuildResponse()
    {
      Response response = null;

      var originalBodyStream = this.context.Response.Body;
      using (var responseBody = new MemoryStream())
      {
        this.context.Response.Body = responseBody;

        await this.next.Invoke(this.context);

        string responseBodyData = await this.ProcessResponseBody(this.context);
        this.context.Response.Headers.Add("x-documentation-url", this.configValues.options.baseLogUrl + "/logs/" + this.guid);
        ResponseProcessor responseProcessor = new ResponseProcessor(this.context.Response, responseBodyData, this.configValues);
        response = responseProcessor.ProcessResponse();

        await responseBody.CopyToAsync(originalBodyStream);
      }

      return response;
    }

    private Creator BuildCreator()
    {
      Creator creator = new Creator();
      creator.name = "readme-metrics (dotnet)";
      creator.version = ConstValues.Version;
      creator.comment = this.GetCreatorVersion();
      return creator;
    }

    /**
     * @example x86-win32nt/6.2.9200.0
     */
    private string GetCreatorVersion()
    {
      return RuntimeInformation.OSArchitecture + "-" + Environment.OSVersion.Platform + "/" + Environment.OSVersion.Version;
    }

    private async Task<string> ProcessResponseBody(HttpContext context)
    {
      try
      {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        StreamReader responseBodyReader = new StreamReader(context.Response.Body);
        string responseBodyData = await responseBodyReader.ReadToEndAsync();
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        return responseBodyData;
      }
      catch (Exception)
      {
        return null;
      }
    }
  }
}
