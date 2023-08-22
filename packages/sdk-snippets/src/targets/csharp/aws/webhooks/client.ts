// For use with AWS Lambda Runtime: dotnet6

import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForDoubleQuotes } from '../../../../helpers/escape';

export const aws: Client = {
  info: {
    key: 'aws',
    title: 'AWS API Gateway',
    link: 'https://aws.amazon.com/api-gateway/',
    description: 'ReadMe Metrics Webhooks SDK usage on AWS API Gateway',
    metadata: {
      lambdaRuntime: 'dotnet6',
    },
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '    ',
      createKeys: false,
      // We don't currently provide a value for defaultUsagePlanId in the
      // ReadMe app, since we don't have any knowledge of our customers' usage
      // plans -- but we might choose to later, and it's helpful for testing.
      defaultUsagePlanId: '123abc',
      ...options,
    };

    const { blank, endSection, join, push, pushVariable, ranges, startSection } = new CodeBuilder({
      indent: opts.indent,
    });

    push('#nullable enable');
    push('using System;');
    push('using System.Collections.Generic;');
    push('using System.Linq;');
    push('using System.Threading.Tasks;');
    push('using System.Net.Http;');
    push('using System.Text.Json;');
    push('using System.Text.Json.Serialization;');
    blank();
    push('using Amazon.Lambda.Core;');
    push('using Amazon.Lambda.APIGatewayEvents;');
    push('using Amazon.APIGateway;');
    push('using Amazon.APIGateway.Model;');
    blank();
    push("// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.");
    push(
      '[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]',
    );
    blank();
    push('namespace WebhookHandler');
    push('{');
    blank();
    push('public class Handler', 1);
    push('{', 1);
    blank();
    push('// Your ReadMe secret; you may want to store this in AWS Secrets Manager', 2);
    push(`private const string README_SECRET = "${secret}";`, 2);
    blank();
    if (opts.createKeys) {
      push('// Your default API Gateway usage plan; this will be attached to new API keys being created', 2);
      push(`private const string DEFAULT_USAGE_PLAN_ID = "${opts.defaultUsagePlanId}";`, 2);
      blank();
    }
    push(
      'public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest apigProxyEvent, ILambdaContext context)',
      2,
    );
    push('{', 2);
    blank();
    push('int statusCode = 0;', 3);
    push('string email = null;', 3);
    push('string apiKey = null;', 3);
    push('string error = null;', 3);
    blank();
    push('try', 3);
    push('{', 3);
    startSection('verification');
    push('// Verify the request is legitimate and came from ReadMe.', 4);
    push('string signature = apigProxyEvent.Headers["ReadMe-Signature"];', 4);
    push('string body = apigProxyEvent.Body;', 4);
    push('ReadMe.Webhook.Verify(body, signature, Handler.README_SECRET);', 4);
    endSection('verification');
    blank();
    startSection('payload');
    push("// Look up the API key associated with the user's email address.", 4);
    push('email = JsonSerializer.Deserialize<Dictionary<string, string>>(body)["email"];', 4);
    push('var client = new AmazonAPIGatewayClient();', 4);
    const requestName = opts.createKeys ? 'keysRequest' : 'request';
    push(`var ${requestName} = new GetApiKeysRequest`, 4);
    push('{', 4);
    push('NameQuery = email,', 5);
    push('IncludeValues = true', 5);
    push('};', 4);
    push(`var keys = await client.GetApiKeysAsync(${requestName});`, 4);
    blank();
    push('if (keys.Items.Count > 0)', 4);
    push('{', 4);
    push('// If multiple API keys are returned for the given email, use the first one.', 5);
    push('apiKey = keys.Items[0].Value;', 5);
    push('statusCode = 200;', 5);
    push('}', 4);
    push('else', 4);
    push('{', 4);
    if (opts.createKeys) {
      push('// If no API keys were found, create a new key and apply a usage plan.', 5);
      push('var createKeyRequest = new CreateApiKeyRequest', 5);
      push('{', 5);
      push('Name = email,', 6);
      push('Description = $"API key for ReadMe user {email}",', 6);
      push('Tags = new Dictionary<string, string> { { "Email", email }, { "Vendor", "ReadMe" } },', 6);
      push('Enabled = true', 6);
      push('};', 5);
      push('var key = await client.CreateApiKeyAsync(createKeyRequest);', 5);
      blank();
      push('var usagePlanKeyRequest = new CreateUsagePlanKeyRequest', 5);
      push('{', 5);
      push('UsagePlanId = Handler.DEFAULT_USAGE_PLAN_ID,', 6);
      push('KeyId = key.Id,', 6);
      push('KeyType = "API_KEY"', 6);
      push('};', 5);
      push('await client.CreateUsagePlanKeyAsync(usagePlanKeyRequest);', 5);
      blank();
      push('apiKey = key.Value;', 5);
      push('statusCode = 200;', 5);
    } else {
      push('error = "Email not found";', 5);
      push('statusCode = 404;', 5);
    }
    push('}', 4);
    endSection('payload');
    push('}', 3);
    push('catch (Exception ex)', 3);
    push('{', 3);
    push('if (ex.Message.Contains("Signature"))', 4);
    push('{', 4);
    push('error = ex.Message;', 5);
    push('statusCode = 404;', 5);
    push('}', 4);
    push('else', 4);
    push('{', 4);
    push('error = ex.Message;', 5);
    push('statusCode = 500;', 5);
    push('}', 4);
    push('}', 3);
    blank();
    push('var output = new Dictionary<string, string> {};', 3);
    push('if (statusCode == 200)', 3);
    push('{', 3);

    if (server.length) {
      push('// OAS Server variables', 4);
      server.forEach(data => {
        pushVariable(
          `output.Add("${escapeForDoubleQuotes(data.name)}", "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name,
          )}");`,
          {
            type: 'server',
            name: data.name,
            indentationLevel: 4,
          },
        );
      });
      blank();
    }

    if (security.length) {
      push('// OAS Security variables', 4);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            pushVariable(
              `output.Add("${escapeForDoubleQuotes(
                data.name,
              )}", new Dictionary<string, string> { { "user", email }, { "pass", apiKey } });`,
              {
                type: 'security',
                name: data.name,
                indentationLevel: 4,
              },
            );
            return;
          }
        }

        pushVariable(`output.Add("${escapeForDoubleQuotes(data.name)}", apiKey);`, {
          type: 'security',
          name: data.name,
          indentationLevel: 4,
        });
      });
    } else {
      push("// The user's API key", 4);
      pushVariable('output.Add("apiKey", apiKey);', {
        type: 'security',
        name: 'apiKey',
        indentationLevel: 4,
      });
    }

    push('}', 3);
    push('else', 3);
    push('{', 3);
    push('output.Add("error", error);', 4);
    push('}', 3);
    blank();
    push('return new APIGatewayProxyResponse', 3);
    push('{', 3);
    push('StatusCode = statusCode,', 4);
    push('Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } },', 4);
    push('Body = JsonSerializer.Serialize(output)', 4);
    push('};', 3);

    push('}', 2);
    push('}', 1);
    push('}');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
