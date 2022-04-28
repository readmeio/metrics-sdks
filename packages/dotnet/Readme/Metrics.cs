using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Readme.HarJsonObjectModels;
using Readme.HarJsonTranslationLogics;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Readme
{
  public class Metrics
  {
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private Group _group;

    public Metrics(RequestDelegate next, IConfiguration configuration)
    {
      _next = next;
      _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
      if (!context.Request.Path.Value.Contains("favicon.ico"))
      {
        _group = new Group()
        {
          id = (context.Items.Keys.Contains("apiKey") == true) ? context.Items["apiKey"].ToString() : null,
          label = (context.Items.Keys.Contains("label") == true) ? context.Items["label"].ToString() : null,
          email = (context.Items.Keys.Contains("email") == true) ? context.Items["email"].ToString() : null
        };

        ConfigValues configValues = GetConfigValues();
        if (configValues != null)
        {
          if (configValues.apiKey != null && configValues.apiKey != "")
          {

            context.Request.EnableBuffering();
            HarJsonBuilder harJsonBuilder = new HarJsonBuilder(_next, context, _configuration, configValues);

            string harJsonObj = await harJsonBuilder.BuildHar();
            ReadmeApiCaller readmeApiCaller = new ReadmeApiCaller(harJsonObj, configValues.apiKey);
            readmeApiCaller.SendHarObjToReadmeApi();
          }
          else
          {
            await _next(context);
          }
        }
        else
        {
          await _next(context);
        }
      }
      else
      {
        await _next(context);
      }
    }


    private ConfigValues GetConfigValues()
    {
      ConfigValues configValues = new ConfigValues();

      var readme = _configuration.GetSection("readme");

      configValues.apiKey = readme.GetSection("apiKey").Value;
      if (configValues.apiKey == null)
      {
        return null;
      }
      configValues.group = _group;

      var options = readme.GetSection("options");
      var denyList = options.GetSection("denyList").GetChildren();
      var allowList = options.GetSection("allowList").GetChildren();


      List<string> denyListList = new List<string>();
      foreach (IConfigurationSection section in denyList)
      {
        denyListList.Add(section.Value);
      }
      List<string> allowListList = new List<string>();
      foreach (IConfigurationSection section in allowList)
      {
        allowListList.Add(section.Value);
      }
      Options optionsObj = new Options();
      optionsObj.denyList = denyListList;
      optionsObj.isDenyListEmpty = (denyListList.Count == 0) ? true : false;
      optionsObj.allowList = allowListList;
      optionsObj.isAllowListEmpty = (allowListList.Count == 0) ? true : false;
      if (options.GetSection("development").Value != null)
      {
        optionsObj.development = bool.Parse(options.GetSection("development").Value);
      }
      if (options.GetSection("bufferLength").Value != null)
      {
        optionsObj.bufferLength = int.Parse(options.GetSection("bufferLength").Value);
      }
      if (options.GetSection("baseLogUrl").Value != null)
      {
        optionsObj.baseLogUrl = options.GetSection("baseLogUrl").Value;
      }

      configValues.options = optionsObj;
      return configValues;
    }


  }

}
