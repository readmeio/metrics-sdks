import type { Client } from '../../../targets';

import { CodeWriter } from '../../../../helpers/code-writer';

export const dotnet6: Client = {
  info: {
    key: 'dotnet6',
    title: '.NET 6.0',
    link: 'https://docs.microsoft.com/en-us/dotnet/core/introduction',
    description: 'ReadMe Metrics Webhooks SDK usage on .NET 6.0',
  },
  convert: ({ secret, security, server }) => {
    const writer = new CodeWriter({
      indentNumberOfSpaces: 2,
      useSingleQuote: false,
    });

    writer.writeLine('var builder = WebApplication.CreateBuilder(args);');
    writer.writeLine('var app = builder.Build();');
    writer.blankLine();

    writer.writeLine('// Your ReadMe secret');
    writer.write('var secret = ').quote(secret).write(';').newLine();
    writer.blankLine();

    writer.writeLine('app.MapPost("/webhook", async context =>');
    writer.writeLine('{').indent(() => {
      writer.writeLine('// Verify the request is legitimate and came from ReadMe.');
      writer.writeLine('var signature = context.Request.Headers["readme-signature"];');
      writer.writeLine('var body = await new StreamReader(context.Request.Body).ReadToEndAsync();');
      writer.blankLine();

      writer
        .writeLine('try')
        .writeLine('{')
        .indent(() => {
          writer.writeLine('ReadMe.Webhook.Verify(body, signature, secret);');
        })
        .writeLine('}')
        .writeLine('catch (Exception e)')
        .writeLine('{')
        .indent(() => {
          writer.writeLine('context.Response.StatusCode = StatusCodes.Status401Unauthorized;');
          writer.writeLine('await context.Response.WriteAsJsonAsync(new');
          writer.writeLine('{').indent(() => {
            writer.writeLine('error = e.Message,');
          });
          writer.writeLine('});');
          writer.writeLine('return;');
        })
        .writeLine('}')
        .blankLine();

      writer.writeLine('// Fetch the user from the database and return their data for use with OpenAPI variables.');
      writer.writeLine('// @todo Write your own query logic to fetch a user by `body["email"]`.');
      writer.blankLine();

      writer.writeLine('await context.Response.WriteAsJsonAsync(new');
      writer
        .writeLine('{')
        .indent(() => {
          if (!server.length && !security.length) {
            writer.writeLine('// Add custom data to return in your webhook call here.');
            return;
          }

          if (server.length) {
            writer.writeLine('// OAS Server variables');
            server.forEach(data => {
              writer
                .writeObjectKey(data.name)
                .write(' = ')
                .writeEscapedString(data.default || data.default === '' ? data.default : data.name)
                .write(',')
                .newLine()
                .recordRange('server', data.name);
            });
          }

          if (server.length && security.length) {
            writer.blankLine();
          }

          if (security.length) {
            writer.writeLine('// OAS Security variables');
            security.forEach(data => {
              if (data.type === 'http') {
                // Only HTTP Basic auth has any special handling for supplying auth.
                if (data.scheme === 'basic') {
                  writer
                    .writeObjectKey(data.name)
                    .write(' = new { user = "user", pass = "pass" },')
                    .newLine()
                    .recordRange('security', data.name);

                  return;
                }
              }

              writer
                .writeObjectKey(data.name)
                .write(' = ')
                .writeEscapedString(data.default || data.default === '' ? data.default : data.name)
                .write(',')
                .newLine()
                .recordRange('security', data.name);
            });
          }
        })
        .write('});')
        .newLine();
    });

    writer.writeLine('});');
    writer.blankLine();

    writer.write('app.Run($"http://localhost:8000");');

    return {
      ranges: writer.getRanges(),
      snippet: writer.toString(),
    };
  },
};
