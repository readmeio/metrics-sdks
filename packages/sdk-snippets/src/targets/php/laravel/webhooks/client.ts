import type { Client } from '../../../targets';

import { CodeWriter } from '../../../../helpers/code-writer';

export const laravel: Client = {
  info: {
    key: 'laravel',
    title: 'Laravel',
    link: 'https://laravel.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Laravel',
  },
  convert: ({ secret, security, server }) => {
    const writer = new CodeWriter({
      indentNumberOfSpaces: 4,
      useSingleQuote: true,
    });

    writer.writeLine('<?php');
    writer.blankLine();

    writer.writeLine('// Your ReadMe secret');
    writer.writeLine(`$secret = '${secret}';`);
    writer.blankLine();

    writer.writeLine('// Add this code into your `routes/web.php` file.');
    writer
      .writeLine("Route::post('/webhook', function (\\Illuminate\\Http\\Request $request) use ($secret) {")
      .indent(() => {
        writer.writeLine('// Verify the request is legitimate and came from ReadMe.');
        writer.writeLine("$signature = $request->headers->get('readme-signature', '');");
        writer.blankLine();

        writer
          .writeLine('try {')
          .indent(() => {
            writer.writeLine('\\ReadMe\\Webhooks::verify($request->input(), $signature, $secret);');
          })
          .writeLine('} catch (\\Exception $e) {')
          .indent(() => {
            writer.writeLine('// Handle invalid requests');
            writer
              .writeLine('return response()->json([')
              .indent(() => {
                writer.writeLine("'error' => $e->getMessage()");
              })
              .writeLine('], 401);');
          })
          .writeLine('}')
          .blankLine();

        writer.writeLine('// Fetch the user from the database and return their data for use with OpenAPI variables.');
        writer.writeLine("// $user = DB::table('users')->where('email', $request->input('email'))->limit(1)->get();");
        writer.writeLine('return response()->json([').indent(() => {
          if (!server.length && !security.length) {
            writer.writeLine('// Add custom data to return in your webhook call here.');
            return;
          }

          if (server.length) {
            writer.writeLine('// OAS Server variables');
            server.forEach(data => {
              writer
                .writeEscapedString(data.name)
                .write(' => ')
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
                    .writeEscapedString(data.name)
                    .write(" => ['user' => 'user', 'pass' => 'pass'],")
                    .newLine()
                    .recordRange('security', data.name);
                  return;
                }
              }

              writer
                .writeEscapedString(data.name)
                .write(' => ')
                .writeEscapedString(data.default || data.default === '' ? data.default : data.name)
                .write(',')
                .newLine()
                .recordRange('security', data.name);
            });
          }
        });

        writer.writeLine(']);');
      });

    writer.write('});');

    return {
      ranges: writer.getRanges(),
      snippet: writer.toString(),
    };
  },
};
