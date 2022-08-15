using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ReadMe.HarJsonObjectModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace ReadMe.HarJsonTranslationLogics
{
  public class HarJsonBuilder
  {
    private readonly RequestDelegate _next;
    private readonly HttpContext _context;
    private readonly DateTime _startDateTime;
    private readonly IConfiguration _configuration;
    ConfigValues _configValues;
    string guid = null;

    public HarJsonBuilder(RequestDelegate next, HttpContext context, IConfiguration configuration, ConfigValues configValues)
    {
      _next = next;
      _context = context;
      _startDateTime = DateTime.UtcNow;
      _configuration = configuration;
      _configValues = configValues;
    }

    public async Task<string> BuildHar()
    {
      Root harObj = new Root();
      harObj._id = Guid.NewGuid().ToString();
      guid = harObj._id;
      harObj.development = _configValues.options.development;
      harObj.clientIPAddress = _context.Connection.RemoteIpAddress.ToString();
      harObj.group = BuildGroup();
      harObj.request = new RequestMain(await BuildLog());
      string harJsonObj = JsonConvert.SerializeObject(new List<Root>() { harObj });
      return harJsonObj;
    }

    private Group BuildGroup()
    {
      Group group = new Group();
      group.id = _configValues.group.id;
      group.label = _configValues.group.label;
      group.email = _configValues.group.email;
      return group;
    }

    private async Task<Log> BuildLog()
    {
      Log log = new Log();
      log.creator = BuildCreator();
      log.entries = await BuildEntries();
      return log;
    }

    private async Task<List<Entries>> BuildEntries()
    {
      List<Entries> entries = new List<Entries>();

      Entries entry = new Entries();
      //entry.pageref = _configValues.options.baseLogUrl + "/users/" + guid;
      entry.pageref = _context.Request.Scheme + "://" + _context.Request.Host.Host + ":" + _context.Request.Host.Port + "" + _context.Request.Path;
      entry.startedDateTime = _startDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
      entry.cache = null;
      entry.timing = new Timing { wait = ConstValues.wait, receive = ConstValues.receive };
      RequestProcessor requestProcessor = new RequestProcessor(_context.Request, _configValues);
      entry.request = await requestProcessor.ProcessRequest();
      entry.response = await BuildResponse();
      entry.time = (int)DateTime.UtcNow.Subtract(_startDateTime).TotalMilliseconds;

      entries.Add(entry);
      return entries;
    }

    private async Task<Response> BuildResponse()
    {
      Response response = null;

      var originalBodyStream = _context.Response.Body;
      using (var responseBody = new MemoryStream())
      {
        _context.Response.Body = responseBody;

        await _next.Invoke(_context);

        string responseBodyData = await ProcessResponseBody(_context);
        _context.Response.Headers.Add("x-documentation-url", _configValues.options.baseLogUrl + "/logs/" + guid);
        ResponseProcessor responseProcessor = new ResponseProcessor(_context.Response, responseBodyData, _configValues);
        response = responseProcessor.ProcessResponse();

        await responseBody.CopyToAsync(originalBodyStream);
      }
      return response;
    }

    private Creator BuildCreator()
    {
      Creator creator = new Creator();
      creator.name = "readme-metrics (dotnet)";
      creator.version = ConstValues.version;
      creator.comment = GetCreatorVersion();
      return creator;
    }

    /**
     * @example x86-win32nt/6.2.9200.0
     */
    private string GetCreatorVersion()
    {
      return RuntimeInformation.OSArchitecture + "/" + Environment.OSVersion.Platform + "/" + Environment.OSVersion.Version;
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
