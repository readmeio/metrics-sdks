using APILoggingLibrary.HarJsonObject;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace APILoggingLibrary.HarJsonObject
{
    class RequestProcessor
    {
        HttpRequest _request = null;
        string _requestBodyData = null;
        public RequestProcessor(HttpRequest request, string requestBodyData)
        {
            _request = request;
            _requestBodyData = requestBodyData;
        }

        public Request ProcessRequest()
        {
            Request requestObj = new Request();
            requestObj.headers = GetHeaders();
            requestObj.headersSize = GetHeadersSize();
            requestObj.bodySize = _requestBodyData.Length.ToString();
            return requestObj;
        }

        private List<Headers> GetHeaders()
        {
            List<Headers> headers = new List<Headers>();
            foreach (var reqHeader in _request.Headers)
            {
                Headers header = new Headers();
                header.name = reqHeader.Key;
                header.value = reqHeader.Value;
                headers.Add(header); 
            }
            return headers;
        }
        private string GetHeadersSize()
        {
            Int64 headersSize = 0;
            foreach (var reqHeader in _request.Headers)
            {
                headersSize += (Int64) reqHeader.Value.ToString().Length;
            }
            return headersSize.ToString();
        }

        private List<QueryString> GetQueryStrings()
        {
            List<QueryString> queryStrings = new List<QueryString>();
            //foreach (var queryString in _request.QueryString.)
            //{
            //    Headers header = new Headers();
            //    header.name = reqHeader.Key;
            //    header.value = reqHeader.Value;
            //    headers.Add(header);
            //}
            return queryStrings;
        }



    }
}
