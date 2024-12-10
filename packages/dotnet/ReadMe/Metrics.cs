using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using ReadMe.HarJsonObjectModels;
using ReadMe.HarJsonTranslationLogics;

namespace ReadMe
{
  public class Metrics
  {
    private readonly RequestDelegate next;
    private readonly IConfiguration configuration;
    private readonly List<Root> harQueue;
    private Group group;

    public Metrics(RequestDelegate next, IConfiguration configuration)
    {
      this.next = next;
      this.configuration = configuration;
      this.harQueue = new List<Root>();
    }

    public async Task InvokeAsync(HttpContext context)
    {
      if (context.Request.Method == HttpMethods.Options)
      {
        await this.next(context);
        return;
      }

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

            var harObj = await harJsonBuilder.BuildHar();
            lock (this.harQueue)
            {
              this.harQueue.Add(harObj);
              if (this.harQueue.Count >= configValues.options.bufferLength)
              {
                string serializaedHars = JsonConvert.SerializeObject(this.harQueue);
                ReadMeApiCaller readmeApiCaller = new ReadMeApiCaller(serializaedHars, configValues.apiKey);
                readmeApiCaller.SendHarObjToReadMeApi(configValues.options.fireAndForget);
                this.harQueue.Clear();
              }
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

      if (options.GetSection("fireAndForget").Value != null)
      {
        optionsObj.fireAndForget = bool.Parse(options.GetSection("fireAndForget").Value);
      }

      configValues.options = optionsObj;
      return configValues;
    }
  }
}
