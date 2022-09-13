using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;

namespace ReadMe.HarJsonObjectModels
{
  class ResponseProcessor
  {
    private readonly HttpResponse response;
    private readonly string responseBodyData;
    private readonly ConfigValues configValues;

    public ResponseProcessor(HttpResponse response, string responseBodyData, ConfigValues configValues)
    {
      this.response = response;
      this.responseBodyData = responseBodyData;
      this.configValues = configValues;
    }

    public Response ProcessResponse()
    {
      Response responseObj = new Response();
      responseObj.headers = this.GetHeaders();
      responseObj.headersSize = this.GetHeadersSize();
      responseObj.status = this.response.StatusCode;
      responseObj.statusText = this.GetStatusTextByStatusCode(this.response.StatusCode);
      responseObj.content = this.GetContent();
      responseObj.bodySize = this.responseBodyData.Length;
      return responseObj;
    }

    private List<Headers> GetHeaders()
    {
      List<Headers> headers = new List<Headers>();
      if (this.response.Headers.Count > 0)
      {
        foreach (var resHeader in this.response.Headers)
        {
          if (!this.configValues.options.isAllowListEmpty)
          {
            if (this.CheckAllowList(resHeader.Key))
            {
              Headers header = new Headers();
              header.name = resHeader.Key;
              header.value = resHeader.Value;
              headers.Add(header);
            }
          }
          else if (!this.configValues.options.isDenyListEmpty)
          {
            if (!this.CheckDenyList(resHeader.Key))
            {
              Headers header = new Headers();
              header.name = resHeader.Key;
              header.value = resHeader.Value;
              headers.Add(header);
            }
          }
          else
          {
            Headers header = new Headers();
            header.name = resHeader.Key;
            header.value = resHeader.Value;
            headers.Add(header);
          }
        }
      }

      return headers;
    }

    private long GetHeadersSize()
    {
      long headersSize = 0;
      if (this.response.Headers.Count > 0)
      {
        foreach (var reqHeader in this.response.Headers)
        {
          headersSize += reqHeader.Value.ToString().Length;
        }
      }

      return headersSize;
    }

    private Content GetContent()
    {
      Content content = new Content();
      content.text = this.responseBodyData;
      content.size = this.responseBodyData.Length;
      content.mimeType = this.response.ContentType ??= "text/plain";
      return content;
    }

    /**
     * This list has been pulled from our `@readme/http-status-codes` NPM package.
     *
     * @see {@link https://github.com/readmeio/http-status-codes}
     */
    private string GetStatusTextByStatusCode(int statusCode)
    {
      switch (statusCode)
      {
        case 100: return "Continue";
        case 101: return "Switching Protocols";
        case 102: return "Processing";
        case 103: return "Early Hints"; // Also informally used as "Checkpoint".

        case 200: return "OK";
        case 201: return "Created";
        case 202: return "Accepted";
        case 203: return "Non-Authoritative Information";
        case 204: return "No Content";
        case 205: return "Reset Content";
        case 206: return "Partial Content";
        case 207: return "Multi-Status";
        case 208: return "Already Reported";
        case 218: return "This is fine"; // Unofficial
        case 226: return "IM Used";

        case 300: return "Multiple Choices";
        case 301: return "Moved Permanently";
        case 302: return "Found";
        case 303: return "See Other";
        case 304: return "Not Modified";
        case 305: return "Use Proxy";
        case 306: return "Switch Proxy";
        case 307: return "Temporary Redirect";
        case 308: return "Permanent Redirect";

        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 402: return "Payment Required";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 405: return "Method Not Allowed";
        case 406: return "Not Acceptable";
        case 407: return "Proxy Authentication Required";
        case 408: return "Request Timeout";
        case 409: return "Conflict";
        case 410: return "Gone";
        case 411: return "Length Required";
        case 412: return "Precondition Failed";
        case 413: return "Payload Too Large";
        case 414: return "URI Too Long";
        case 415: return "Unsupported Media Type";
        case 416: return "Range Not Satisfiable";
        case 417: return "Expectation Failed";
        case 418: return "I'm a teapot";
        case 419: return "Page Expired"; // Unofficial
        case 420: return "Enhance Your Calm"; // Unofficial
        case 421: return "Misdirected Request";
        case 422: return "Unprocessable Entity";
        case 423: return "Locked";
        case 424: return "Failed Dependency";
        case 425: return "Too Early";
        case 426: return "Upgrade Required";
        case 428: return "Precondition Required";
        case 429: return "Too Many Requests";
        case 430: return "Request Header Fields Too Large"; // Unofficial
        case 431: return "Request Header Fields Too Large";
        case 440: return "Login Time-out"; // Unofficial
        case 444: return "No Response"; // Unofficial
        case 449: return "Retry With"; // Unofficial
        case 450: return "Blocked by Windows Parental Controls"; // Unofficial
        case 451: return "Unavailable For Legal Reasons";
        case 494: return "Request Header Too Large"; // Unofficial
        case 495: return "SSL Certificate Error"; // Unofficial
        case 496: return "SSL Certificate Required"; // Unofficial
        case 497: return "HTTP Request Sent to HTTPS Port"; // Unofficial
        case 498: return "Invalid Token"; // Unofficial
        case 499: return "Client Error"; // "Token Request" on ArcGIS, "Client Closed Request" on nginx

        case 500: return "Internal Server Error";
        case 501: return "Not Implemented";
        case 502: return "Bad Gateway";
        case 503: return "Service Unavailable";
        case 504: return "Gateway Timeout";
        case 505: return "HTTP Version Not Supported";
        case 506: return "Variant Also Negotiates";
        case 507: return "Insufficient Storage";
        case 508: return "Loop Detected";
        case 509: return "Bandwidth Limit Exceeded";
        case 510: return "Not Extended";
        case 511: return "Network Authentication Required";
        case 520: return "Web Server Returned an Unknown Error"; // Unofficial
        case 521: return "Web Server Is Down"; // Unofficial
        case 522: return "Connection Timed Out"; // Unofficial
        case 523: return "Origin Is Unreachable"; // Unofficial
        case 524: return "A Timeout Occurred"; // Unofficial
        case 525: return "SSL Handshake Failed"; // Unofficial
        case 526: return "Invalid SSL Certificate"; // Unofficial
        case 527: return "Railgun Error"; // Unofficial
        case 529: return "Site is Overloaded"; // Unofficial
        case 530: return "Site is Frozen"; // Unofficial
        case 598: return "Network Read Timeout Error"; // Unofficial
      }

      return string.Empty;
    }

    private bool CheckAllowList(string key)
    {
      return this.configValues.options.allowList.Any(v => v.Trim().ToLower() == key.Trim().ToLower()) ? true : false;
    }

    private bool CheckDenyList(string key)
    {
      return this.configValues.options.denyList.Any(v => v.Trim().ToLower() == key.Trim().ToLower()) ? true : false;
    }
  }
}
