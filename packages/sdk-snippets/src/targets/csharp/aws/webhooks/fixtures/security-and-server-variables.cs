#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;

using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.APIGateway;
using Amazon.APIGateway.Model;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace WebhookHandler
{

    public class Handler
    {

        // Your ReadMe secret; you may want to store this in AWS Secrets Manager
        private const string README_SECRET = "my-readme-secret";

        public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest apigProxyEvent, ILambdaContext context)
        {

            int statusCode = 0;
            string email = null;
            string apiKey = null;
            string error = null;

            try
            {
                // Verify the request is legitimate and came from ReadMe.
                string signature = apigProxyEvent.Headers["ReadMe-Signature"];
                string body = apigProxyEvent.Body;
                ReadMe.Webhook.Verify(body, signature, Handler.README_SECRET);

                // Look up the API key associated with the user's email address.
                email = JsonSerializer.Deserialize<Dictionary<string, string>>(body)["email"];
                var client = new AmazonAPIGatewayClient();
                var request = new GetApiKeysRequest
                {
                    NameQuery = email,
                    IncludeValues = true
                };
                var keys = await client.GetApiKeysAsync(request);

                if (keys.Items.Count > 0)
                {
                    // If multiple API keys are returned for the given email, use the first one.
                    apiKey = keys.Items[0].Value;
                    statusCode = 200;
                }
                else
                {
                    error = "Email not found";
                    statusCode = 404;
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Signature"))
                {
                    error = ex.Message;
                    statusCode = 404;
                }
                else
                {
                    error = ex.Message;
                    statusCode = 500;
                }
            }

            var output = new Dictionary<string, string> {};
            if (statusCode == 200)
            {
                // OAS Server variables
                output.Add("name", "default-name");
                output.Add("port", "");

                // OAS Security variables
                output.Add("petstore_auth", apiKey);
                output.Add("basic_auth", new Dictionary<string, string> { { "user", email }, { "pass", apiKey } });
            }
            else
            {
                output.Add("error", error);
            }

            return new APIGatewayProxyResponse
            {
                StatusCode = statusCode,
                Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } },
                Body = JsonSerializer.Serialize(output)
            };
        }
    }
}