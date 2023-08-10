using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ReadMe.HarJsonObjectModels
{
  class RequestProcessor
  {
    private readonly HttpRequest request;
    private readonly ConfigValues configValues;

    public RequestProcessor(HttpRequest request, ConfigValues configValues)
    {
      this.request = request;
      this.configValues = configValues;
    }

    public async Task<Request> ProcessRequest()
    {
      Request requestObj = new Request();
      requestObj.headers = this.GetHeaders();
      requestObj.headersSize = this.GetHeadersSize();
      requestObj.bodySize = -1;
      requestObj.queryString = this.GetQueryStrings();
      requestObj.cookies = this.GetCookies();
      requestObj.method = this.request.Method;
      requestObj.url = this.request.Scheme + "://" + this.request.Host.Host + ":" + this.request.Host.Port + this.request.Path;
      requestObj.url += this.request.QueryString.ToString();

      requestObj.httpVersion = this.request.Protocol;

      // We should ony add POST data into the HAR if we have it.
      PostData postData = await this.GetPostData();
      if (postData.mimeType != null)
      {
        requestObj.postData = postData;
      }

      return requestObj;
    }

    private async Task<PostData> GetPostData()
    {
      PostData postData = new PostData();
      postData.mimeType = this.request.ContentType;
      if (this.request.ContentType == "application/x-www-form-urlencoded")
      {
        postData.@params = this.RedactPayload(this.request.Form);
      }
      else if (this.request.HasFormContentType)
      {
        postData.@params = this.RedactPayload(this.request.Form);
      }
      else if (this.request.ContentType == "application/json")
      {
        string requestBody = await this.GetRequestBodyData();
        JObject parsedBody = JsonConvert.DeserializeObject<JObject>(requestBody);
        IFormCollection formCollection = new FormCollection(parsedBody.Properties().ToDictionary(p => p.Name, p => new StringValues(p.Value.ToString())));

        // List<Params> @params = this.RedactPayload(formCollection);
        // postData.text = JsonConvert.SerializeObject(@params);
        postData.text = await this.GetRequestBodyData();
      }
      else if (this.request.ContentType != null)
      {
        postData.text = await this.GetRequestBodyData();
      }

      return postData;
    }

    private bool CheckAllowList(string key)
    {
      return this.configValues.options.allowList.Any(v => v.Trim().ToLower() == key.Trim().ToLower()) ? true : false;
    }

    private bool CheckDenyList(string key)
    {
      return this.configValues.options.denyList.Any(v => v.Trim().ToLower() == key.Trim().ToLower()) ? true : false;
    }

    private string RedactValue(string value)
    {
      string redactedVal = value.GetType() == typeof(string) ? $" {value.Length}" : string.Empty;
      return $"[REDACTED{redactedVal}]";
    }

    private List<Params> RedactPayload(Microsoft.AspNetCore.Http.IFormCollection payload)
    {
      List<Params> @params = new List<Params>();
        if (payload.Keys.Count > 0)
        {
          foreach (string key in this.request.Form.Keys)
          {
            if (!this.configValues.options.isAllowListEmpty)
            {
              if (this.CheckAllowList(key))
              {
                @params.Add(new Params { name = key, value = payload[key] });
              }
              else
              {
                @params.Add(new Params { name = key, value = this.RedactValue(payload[key]) });
              }
            }
            else if (!this.configValues.options.isDenyListEmpty)
            {
              if (!this.CheckDenyList(key))
              {
                @params.Add(new Params { name = key, value = payload[key] });
              }
              else
              {
                 @params.Add(new Params { name = key, value = this.RedactValue(payload[key]) });
              }
            }
            else
            {
              @params.Add(new Params { name = key, value = payload[key] });
            }
          }
        }

      return @params;
    }

    private async Task<string> GetRequestBodyData()
    {
      try
      {
        StreamReader requestBodyReader = new StreamReader(this.request.Body);
        string requestBodyData = await requestBodyReader.ReadToEndAsync();
        this.request.Body.Position = 0;
        return requestBodyData;
      }
      catch (System.Exception)
      {
        return null;
      }
    }

    private List<Headers> GetHeaders()
    {
      List<Headers> headers = new List<Headers>();
      if (this.request.Headers.Count > 0)
      {
        foreach (var reqHeader in this.request.Headers)
        {
          if (!this.configValues.options.isAllowListEmpty)
          {
            if (this.CheckAllowList(reqHeader.Key))
            {
              Headers header = new Headers();
              header.name = reqHeader.Key;
              header.value = reqHeader.Value;
              headers.Add(header);
            }
          }
          else if (!this.configValues.options.isDenyListEmpty)
          {
            if (!this.CheckDenyList(reqHeader.Key))
            {
              Headers header = new Headers();
              header.name = reqHeader.Key;
              header.value = reqHeader.Value;
              headers.Add(header);
            }
          }
          else
          {
            Headers header = new Headers();
            header.name = reqHeader.Key;
            header.value = reqHeader.Value;
            headers.Add(header);
          }
        }
      }

      return headers;
    }

    private long GetHeadersSize()
    {
      long headersSize = 0;
      if (this.request.Headers.Count > 0)
      {
        foreach (var reqHeader in this.request.Headers)
        {
          headersSize += reqHeader.Value.ToString().Length;
        }
      }

      return headersSize;
    }

    private List<QueryStrings> GetQueryStrings()
    {
      List<QueryStrings> queryStrings = new List<QueryStrings>();
      if (this.request.Query.Count > 0)
      {
        var queryStings = this.request.Query;
        foreach (var qs in queryStings)
        {
          QueryStrings qString = new QueryStrings();
          qString.name = qs.Key;
          qString.value = qs.Value;
          queryStrings.Add(qString);
        }
      }

      return queryStrings;
    }

    private List<Cookies> GetCookies()
    {
      List<Cookies> cookies = new List<Cookies>();
      if (this.request.Cookies.Count > 0)
      {
        foreach (var reqCookie in this.request.Cookies)
        {
          Cookies cookie = new Cookies();
          cookie.name = reqCookie.Key;
          cookie.value = reqCookie.Value;
          cookies.Add(cookie);
        }
      }

      return cookies;
    }
  }
}
