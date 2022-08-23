import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForDoubleQuotes } from '../../../../helpers/escape';

export const dotnet6: Client = {
  info: {
    key: 'dotnet6',
    title: '.NET 6.0',
    link: 'https://docs.microsoft.com/en-us/dotnet/core/introduction',
    description: 'ReadMe Metrics Webhooks SDK usage on .NET 6.0',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, join, push, pushVariable, ranges } = new CodeBuilder({ indent: opts.indent });

    push('var builder = WebApplication.CreateBuilder(args);');
    push('var app = builder.Build();');

    blank();

    push('// Your ReadMe secret');
    push(`var secret = "${secret}";`);

    blank();

    push('app.MapPost("/webhook", async context =>');
    push('{');
    push('// Verify the request is legitimate and came from ReadMe.', 1);
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

    push('// Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    push('// @todo Write your own query logic to fetch a user by `body["email"]`.', 1);
    blank();

    push('await context.Response.WriteAsJsonAsync(new', 1);
    push('{', 1);

    if (!server.length && !security.length) {
      push('// Add custom data to return in your webhook call here.', 2);
    }

    if (server.length) {
      push('// OAS Server variables', 2);
      server.forEach(data => {
        pushVariable(
          `${escapeForObjectKey(data.name, true)} = "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}",`,
          {
            type: 'server',
            name: data.name,
            indentationLevel: 2,
          }
        );
      });
    }

    if (server.length && security.length) {
      blank();
    }

    if (security.length) {
      push('// OAS Security variables', 2);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            pushVariable(`${escapeForObjectKey(data.name, true)} = new { user = "user", pass = "pass" },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 2,
            });
            return;
          }
        }

        pushVariable(
          `${escapeForObjectKey(data.name, true)} = "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}",`,
          {
            type: 'security',
            name: data.name,
            indentationLevel: 2,
          }
        );
      });
    }

    push('});', 1);
    push('});');

    blank();

    push('app.Run($"http://localhost:8000");');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
