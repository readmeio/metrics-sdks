using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using ReadMe.HarJsonObjectModels;
using ReadMe.HarJsonTranslationLogics;

namespace ReadMe
{
  public class Metrics
  {
    private readonly RequestDelegate next;
    private readonly IConfiguration configuration;
    private Group group;

    public Metrics(RequestDelegate next, IConfiguration configuration)
    {
      this.next = next;
      this.configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
      if (!context.Request.Path.Value.Contains("favicon.ico"))
      {
        this.group = new Group()
        {
          id = (context.Items.Keys.Contains("apiKey") == true) ? context.Items["apiKey"].ToString() : null,
          label = (context.Items.Keys.Contains("label") == true) ? context.Items["label"].ToString() : null,
          email = (context.Items.Keys.Contains("email") == true) ? context.Items["email"].ToString() : null,
        };

        ConfigValues configValues = this.GetConfigValues();
        if (configValues != null)
        {
          if (configValues.apiKey != null && configValues.apiKey != string.Empty)
          {
            context.Request.EnableBuffering();
            HarJsonBuilder harJsonBuilder = new HarJsonBuilder(this.next, context, this.configuration, configValues);

            string harJsonObj = await harJsonBuilder.BuildHar();
            ReadMeApiCaller readmeApiCaller = new ReadMeApiCaller(harJsonObj, configValues.apiKey);
            readmeApiCaller.SendHarObjToReadMeApi();
          }
          else
          {
            await this.next(context);
          }
        }
        else
        {
          await this.next(context);
        }
      }
      else
      {
        await this.next(context);
      }
    }

    private ConfigValues GetConfigValues()
    {
      ConfigValues configValues = new ConfigValues();

      var readme = this.configuration.GetSection("readme");

      configValues.apiKey = readme.GetSection("apiKey").Value;
      if (configValues.apiKey == null)
      {
        return null;
      }

      configValues.group = this.group;

      var options = readme.GetSection("options");

      Options optionsObj = new Options();
      optionsObj.denyList = options.GetSection("denyList").Get<List<string>>();
      optionsObj.allowList = options.GetSection("allowList").Get<List<string>>();
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
