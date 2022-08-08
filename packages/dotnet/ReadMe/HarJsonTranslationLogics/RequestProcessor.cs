using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ReadMe.HarJsonObjectModels
{
  class RequestProcessor
  {
    private readonly HttpRequest _request;
    private readonly ConfigValues _configValues;

    public RequestProcessor(HttpRequest request, ConfigValues configValues)
    {
      _request = request;
      _configValues = configValues;
    }

    public async Task<Request> ProcessRequest()
    {
      Request requestObj = new Request();
      requestObj.headers = GetHeaders();
      requestObj.headersSize = GetHeadersSize();
      requestObj.queryString = GetQueryStrings();
      requestObj.cookies = GetCookies();
      requestObj.method = _request.Method;
      requestObj.url = _request.Scheme + "://" + _request.Host.Host + ":" + _request.Host.Port + "" + _request.Path;
      requestObj.httpVersion = _request.Protocol;
      requestObj.postData = await GetPostData();

      return requestObj;
    }

    private async Task<PostData> GetPostData()
    {
      PostData postData = new PostData();
      postData.mimeType = _request.ContentType;
      if (_request.ContentType == "application/x-www-form-urlencoded")
      {
        List<Params> @params = new List<Params>();
        if (_request.Form.Keys.Count > 0)
        {
          foreach (string key in _request.Form.Keys)
          {
            if (!_configValues.options.isAllowListEmpty)
            {
              if (CheckAllowList(key))
              {
                @params.Add(new Params { name = key, value = _request.Form[key] });
              }
            }
            else if (!_configValues.options.isDenyListEmpty)
            {
              if (!CheckDenyList(key))
              {
                @params.Add(new Params { name = key, value = _request.Form[key] });
              }
            }
            else
            {
              @params.Add(new Params { name = key, value = _request.Form[key] });
            }
          }
        }
        postData.@params = @params;
      }
      else if (_request.HasFormContentType)
      {
        List<Params> @params = new List<Params>();
        if (_request.Form.Keys.Count > 0)
        {
          foreach (string key in _request.Form.Keys)
          {
            if (!_configValues.options.isAllowListEmpty)
            {
              if (CheckAllowList(key))
              {
                @params.Add(new Params { name = key, value = _request.Form[key] });
              }
            }
            else if (!_configValues.options.isDenyListEmpty)
            {
              if (!CheckDenyList(key))
              {
                @params.Add(new Params { name = key, value = _request.Form[key] });
              }
            }
            else
            {
              @params.Add(new Params { name = key, value = _request.Form[key] });
            }
          }
        }
        postData.@params = @params;
      }
      else if (_request.ContentType != null)
      {
        postData.text = await GetRequestBodyData();
      }
      return postData;
    }

    private bool CheckAllowList(string key) => (_configValues.options.allowList.Any(v => v.Trim().ToLower() == key.Trim().ToLower())) ? true : false;
    private bool CheckDenyList(string key) => (_configValues.options.denyList.Any(v => v.Trim().ToLower() == key.Trim().ToLower())) ? true : false;


    private async Task<string> GetRequestBodyData()
    {
      try
      {
        StreamReader requestBodyReader = new StreamReader(_request.Body);
        string requestBodyData = await requestBodyReader.ReadToEndAsync();
        _request.Body.Position = 0;
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
      if (_request.Headers.Count > 0)
      {
        foreach (var reqHeader in _request.Headers)
        {

          if (!_configValues.options.isAllowListEmpty)
          {
            if (CheckAllowList(reqHeader.Key))
            {
              Headers header = new Headers();
              header.name = reqHeader.Key;
              header.value = reqHeader.Value;
              headers.Add(header);
            }
          }
          else if (!_configValues.options.isDenyListEmpty)
          {
            if (!CheckDenyList(reqHeader.Key))
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
      if (_request.Headers.Count > 0)
      {
        foreach (var reqHeader in _request.Headers)
        {
          headersSize += reqHeader.Value.ToString().Length;
        }
      }
      return headersSize;
    }
    private List<QueryStrings> GetQueryStrings()
    {
      List<QueryStrings> queryStrings = new List<QueryStrings>();
      if (_request.Query.Count > 0)
      {
        var queryStings = _request.Query;
        foreach (var qs in queryStings)
        {
          if (!_configValues.options.isAllowListEmpty)
          {
            if (CheckAllowList(qs.Key))
            {
              QueryStrings qString = new QueryStrings();
              qString.name = qs.Key;
              qString.value = qs.Value;
              queryStrings.Add(qString);
            }
          }
          else if (!_configValues.options.isDenyListEmpty)
          {
            if (!CheckDenyList(qs.Key))
            {
              QueryStrings qString = new QueryStrings();
              qString.name = qs.Key;
              qString.value = qs.Value;
              queryStrings.Add(qString);
            }
          }
          else
          {
            QueryStrings qString = new QueryStrings();
            qString.name = qs.Key;
            qString.value = qs.Value;
            queryStrings.Add(qString);
          }
        }
      }
      return queryStrings;
    }
    private List<Cookies> GetCookies()
    {
      List<Cookies> cookies = new List<Cookies>();
      if (_request.Cookies.Count > 0)
      {
        foreach (var reqCookie in _request.Cookies)
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
