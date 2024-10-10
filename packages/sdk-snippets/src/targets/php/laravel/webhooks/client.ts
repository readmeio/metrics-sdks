import type { VariableOptions } from '../../../../helpers/code-builder';
import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForSingleQuotes } from '../../../../helpers/escape';

export const laravel: Client = {
  info: {
    key: 'laravel',
    title: 'Laravel',
    link: 'https://laravel.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Laravel',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '    ',
      ...options,
    };

    const { blank, endSection, join, push, pushVariable, ranges, startSection } = new CodeBuilder({
      indent: opts.indent,
    });

    push('<?php');
    blank();

    push('// Your ReadMe secret');
    push(`$secret = '${secret}';`);
    blank();

    push('// Add this code into your `routes/web.php` file.');
    push("Route::post('/webhook', function (\\Illuminate\\Http\\Request $request) use ($secret) {");
    startSection('verification');
    push('// Verify the request is legitimate and came from ReadMe.', 1);
    push("$signature = $request->headers->get('readme-signature', '');", 1);
    blank();

    push('try {', 1);
    push('\\ReadMe\\Webhooks::verify($request->input(), $signature, $secret);', 2);
    push('} catch (\\Exception $e) {', 1);
    push('// Handle invalid requests', 2);
    push('return response()->json([', 2);
    push("'error' => $e->getMessage()", 3);
    push('], 401);', 2);
    push('}', 1);
    endSection('verification');
    blank();

    startSection('payload');
    push('// Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    push("// $user = DB::table('users')->where('email', $request->input('email'))->limit(1)->get();", 1);
    push('return response()->json([', 1);

    if (!server.length && !security.length) {
      push('// Add custom data to return in your webhook call here.', 2);
    }

    if (server.length) {
      push('// OAS Server variables', 2);
      server.forEach(data => {
        pushVariable(
          `'${escapeForSingleQuotes(data.name)}' => '${escapeForSingleQuotes(
            data.default || data.default === '' ? data.default : data.name,
          )}',`,
          {
            type: 'server',
            name: data.name,
            indentationLevel: 2,
          },
        );
      });
    }

    if (server.length && security.length) {
      blank();
    }

    if (security.length) {
      push('// OAS Security variables', 2);
      push("'keys' => [", 2);
      security.forEach(data => {
        const variableOptions: VariableOptions = {
          type: 'security',
          name: data.name,
          indentationLevel: 4,
        };

        push('[', 3);
        if (data.type === 'http' || data.type === 'apiKey') {
          pushVariable(`'name' => '${escapeForSingleQuotes(data.name)}',`, variableOptions);

          if (data.type === 'http') {
            if (data.scheme === 'basic') {
              push("'user' => 'user',", 4);
              push("'pass' => 'pass',", 4);
            } else if (data.scheme === 'bearer') {
              pushVariable(
                `'bearer' => '${escapeForSingleQuotes(
                  data.default || data.default === '' ? data.default : data.name,
                )}',`,
                variableOptions,
              );
            }
          } else {
            pushVariable(
              `'apiKey' => '${escapeForSingleQuotes(data.default || data.default === '' ? data.default : data.name)}',`,
              variableOptions,
            );
          }
        } else {
          pushVariable(
            `'${escapeForSingleQuotes(data.name)}' => '${escapeForSingleQuotes(
              data.default || data.default === '' ? data.default : data.name,
            )}',`,
            variableOptions,
          );
        }

        push('],', 3);
      });
      push(']', 2);
    }

    push(']);', 1);
    endSection('payload');
    push('});');
    blank();

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
