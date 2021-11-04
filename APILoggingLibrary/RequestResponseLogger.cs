using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using APILoggingLibrary.HarJsonObject;

namespace APILoggingLibrary
{
    public class Emp
    {
        public string _id { get; set; }
        public string name { get; set; }
        public Address address { get; set; }

        public void show()
        {
            string a = name;
        }
    }
    public class Address
    {
        public string street { get; set; }
        public string moh { get; set; }

        public Address()
        {
            Console.WriteLine(moh);
        }
    }
    public class RequestResponseLogger
    {
        private readonly RequestDelegate _next;
        private readonly string _apiKey;
        private readonly string _userName;
        private readonly string _email;

        public RequestResponseLogger(RequestDelegate next, string apiKey, string userName, string email)
        {
            _next = next;
            _apiKey = apiKey;
            _userName = userName;
            _email = email;
        }

        public async Task InvokeAsync(HttpContext context)
        {
         

            var jsonObj = "[{\"development\":false,\"group\":{\"email\":\"johnsmithid012@gmail.com\",\"label\":\"John Smith\",\"id\":\"kiy5tLMfG2vTegvTzObjyuVqURHptTNG\"},\"request\":{\"log\":{\"creator\":{\"name\":\"readmeio\",\"version\":\"1.2.1\",\"comment\":\"mac/v10-16.0\"},\"entries\":[{\"request\":{\"headers\":[{\"name\":\"host\",\"value\":\"127.0.0.1:50799\"}],\"queryString\":[{\"name\":\"country\",\"value\":\"usa\"}],\"postData\":{},\"method\":\"GET\",\"url\":\"http://127.0.0.1:50799/test\",\"httpVersion\":\"HTTP/1.1\"},\"response\":{\"headers\":[{\"name\":\"x-powered-by\",\"value\":\"Express\"}],\"content\":{\"text\":\"\\\"\\\\\\\"OK\\\\\\\"\\\"\",\"size\":2,\"encoding\":\"utf-8\"},\"status\":200,\"statusText\":\"OK\"},\"pageref\":\"http://127.0.0.1/test\",\"startedDateTime\":\"2021-10-22T20:54:04.150Z\",\"time\":4}]}},\"_id\":\"guid_id\",\"clientIPAddress\":\"127.0.0.1\"}]";

            var client1 = new RestSharp.RestClient("https://metrics.readme.io/request");
            var request1 = new RestSharp.RestRequest(RestSharp.Method.POST);
            request1.AddHeader("Content-Type", "application/json");
            string apiKeyBase64 = "Basic "+ Convert.ToBase64String(Encoding.UTF8.GetBytes(_apiKey)) +"6";
            request1.AddHeader("Authorization", apiKeyBase64);
            //request1.AddHeader("Authorization", "Basic a2l5NXRMTWZHMnZUZWd2VHpPYmp5dVZxVVJIcHRUTkc6");
            request1.AddParameter("application/json", jsonObj, RestSharp.ParameterType.RequestBody);
            RestSharp.IRestResponse response1 = client1.Execute(request1);


            string requestBodyData = await GetBodyDataAndSize(context.Request);
            RequestProcessor requestProcessor = new RequestProcessor(context.Request, requestBodyData);
            Request request = requestProcessor.ProcessRequest();
            Microsoft.AspNetCore.Http.QueryString qs = context.Request.QueryString;
            string[] a = qs.Value.Split("&");
            string[] one = a[0].Split("=");

            //Copy a pointer to the original response body stream
            var originalBodyStream = context.Response.Body;

            //Create a new memory stream...
            using var responseBody = new MemoryStream();
            //...and use that for the temporary response body
            context.Response.Body = responseBody;

            //Continue down the Middleware pipeline, eventually returning to this class
            await _next(context);

            //Format the response from the server
            var response = await FormatResponse(context.Response);

            //TODO: Save log to chosen datastore

            //Copy the contents of the new memory stream (which contains the response) to the original stream, which is then returned to the client.
            await responseBody.CopyToAsync(originalBodyStream);

            //await CallReadmeApi(context);

        }

        
        private async Task<string> GetBodyDataAndSize(HttpRequest request)
        {         
            var body = request.Body;
            var buffer = new byte[Convert.ToInt32(request.ContentLength)];
            await request.Body.ReadAsync(buffer, 0, buffer.Length);
            var bodyAsText = Encoding.UTF8.GetString(buffer);
            request.Body = body;
            return bodyAsText;
        }

        private static async Task<string> FormatResponse(HttpResponse response)
        {
            //We need to read the response stream from the beginning...
            response.Body.Seek(0, SeekOrigin.Begin);

            //...and copy it into a string
            string text = await new StreamReader(response.Body).ReadToEndAsync();

            //We need to reset the reader for the response so that the client can read it.
            response.Body.Seek(0, SeekOrigin.Begin);

            //Return the string for the response, including the status code (e.g. 200, 404, 401, etc.)
            return $"{response.StatusCode}: {text}";
        }


        

        protected void GetIPAddress(HttpRequest request)
        {
            
            //System.Web.HttpContext context = System.Web.HttpContext.Current;
            //string ipAddress = request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            //if (!string.IsNullOrEmpty(ipAddress))
            //{
            //    string[] addresses = ipAddress.Split(',');
            //    if (addresses.Length != 0)
            //    {
            //        return addresses[0];
            //    }
            //}

            //return context.Request.ServerVariables["REMOTE_ADDR"];
        }

        private string GetGuid()
        {
            var assembly = typeof(Program).Assembly;
            var attribute = (GuidAttribute)assembly.GetCustomAttributes(typeof(GuidAttribute), true)[0];
            var id = attribute.Value;
            var applicationId = ((GuidAttribute)typeof(Program).Assembly.GetCustomAttributes(typeof(GuidAttribute), true)[0]).Value;
            return applicationId;
        }
    }


    

    public class Employee
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string City { get; set; }
    }


}
