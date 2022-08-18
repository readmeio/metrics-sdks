import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';

export const net6: Client = {
  info: {
    key: 'net6.0',
    title: '.NET 6.0',
    link: 'https://docs.microsoft.com/en-us/dotnet/core/introduction',
    description: 'ReadMe Metrics Webhooks SDK usage on .NET 6.0',
  },
  convert: ({ security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, join, push, ranges, variable } = new CodeBuilder({ indent: opts.indent });

    push('var builder = WebApplication.CreateBuilder(args);');
    push('var app = builder.Build();');

    blank();

    push('var secret = Environment.GetEnvironmentVariable("README_API_KEY");');

    blank();

    push('app.MapPost("/webhook", async context =>');
    push('{');
    push('var signature = context.Request.Headers["readme-signature"];', 1);
    push('var body = await new StreamReader(context.Request.Body).ReadToEndAsync();', 1);

    blank();

    push('try', 1);
    push('{', 1);
    push('ReadMe.Webhook.Verify(body, signature, secret);', 2);
    push('}', 1);
    push('catch (Exception e)', 1);
    push('{', 1);
    push('context.Response.StatusCode = StatusCodes.Status401Unauthorized;', 2);
    push('await context.Response.WriteAsJsonAsync(new', 2);
    push('{', 2);
    push('error = e.Message,', 3);
    push('});', 2);
    push('return;', 2);
    push('}', 1);

    blank();

    push('await context.Response.WriteAsJsonAsync(new', 1);
    push('{', 1);
    push('petstore_auth = "default-key",', 2);
    push('basic_auth = new { user = "user", pass = "pass" }', 2);
    push('});', 1);
    push('});');

    blank();

    push('app.Run($"http://localhost:4000");');

    blank();

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
