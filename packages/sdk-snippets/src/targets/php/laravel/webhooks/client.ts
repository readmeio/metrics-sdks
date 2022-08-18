import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';

export const laravel: Client = {
  info: {
    key: 'laravel',
    title: 'Laravel',
    link: 'https://laravel.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Laravel',
  },
  convert: ({ security, server }, options) => {
    const opts = {
      indent: '    ',
      ...options,
    };

    const { blank, join, push, ranges, variable } = new CodeBuilder({ indent: opts.indent });

    push('<?php');
    blank();

    push('// Add this code into your `routes/web.php` file.');
    push("Route::post('/webhook', function (\\Illuminate\\Http\\Request $request) {");
    push('// Verify the request is legitimate and came from ReadMe.', 1);
    push("$signature = $request->headers->get('readme-signature', '');", 1);
    blank();

    push('// Your ReadMe secret', 1);
    push("$secret = env('README_API_KEY', config('readme.api_key'));", 1);
    blank();

    push('try {', 1);
    push('\\ReadMe\\Webhooks::verify($request->input(), $signature, $secret);', 2);
    push('} catch (\\Exception $e) {', 1);
    push('// Handle invalid requests', 2);
    push('return response()->json([', 2);
    push("'error' => $e->getMessage()", 3);
    push('], 401);', 2);
    push('}', 1);
    blank();

    push('// Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    push("// $user = DB::table('users')->where('email', $request->input('email'))->limit(1)->get();", 1);
    push('return response()->json([', 1);

    if (server.length) {
      push('// OAS Server variables', 2);
      server.forEach(data => {
        push(`'${data.name}' => '${data.default || data.default === '' ? data.default : data.name}',`, 2);
        variable('server', data.name);
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
            push(`'${data.name}' => ['user' => 'user', 'pass' => 'pass'],`, 2);
            variable('security', data.name);
            return;
          }
        }

        push(`'${data.name}' => '${data.default || data.default === '' ? data.default : data.name}',`, 2);
        variable('security', data.name);
      });
    }

    push(']);', 1);
    push('});');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
