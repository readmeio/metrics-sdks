import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForDoubleQuotes } from '../../../../helpers/escape';

export const flask: Client = {
  info: {
    key: 'flask',
    title: 'Flask',
    link: 'https://flask.palletsprojects.com',
    description: 'ReadMe Metrics Webhooks SDK usage on Flask',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '    ',
      ...options,
    };

    const { blank, join, push, ranges, variable } = new CodeBuilder({ indent: opts.indent });

    push('import os');
    push('import sys');
    push('from flask import Flask, request');
    push('from readme_metrics.VerifyWebhook import VerifyWebhook');
    blank();

    push('if os.getenv("README_API_KEY") is None:');
    push('sys.stderr.write("Missing `README_API_KEY` environment variable")', 1);
    push('sys.stderr.flush()', 1);
    push('sys.exit(1)', 1);
    blank();

    push('app = Flask(__name__)');
    blank();

    push('# Your ReadMe secret');
    push(`secret = "${secret}"`);
    blank();
    blank();

    push('@app.post("/webhook")');
    push('def webhook():');
    push('# Verify the request is legitimate and came from ReadMe.', 1);
    push('signature = request.headers.get("readme-signature", None)', 1);
    blank();

    push('try:', 1);
    push('VerifyWebhook(request.get_json(), signature, secret)', 2);
    push('except Exception as error:', 1);
    push('return (', 2);
    push('{"error": str(error)},', 3);
    push('401,', 3);
    push('{"Content-Type": "application/json; charset=utf-8"},', 3);
    push(')', 2);
    blank();

    push('# Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    push('# user = User.objects.get(email__exact=request.values.get("email"))', 1);
    push('return (', 1);
    push('{', 2);

    if (server.length) {
      push('# OAS Server variables', 3);
      server.forEach(data => {
        push(
          `"${escapeForDoubleQuotes(data.name)}": "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}",`,
          3
        );
        variable('server', data.name);
      });
    }

    if (server.length && security.length) {
      blank();
    }

    if (security.length) {
      push('# OAS Security variables', 3);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            push(`"${escapeForDoubleQuotes(data.name)}": {"user": "user", "pass": "pass"},`, 3);
            variable('security', data.name);
            return;
          }
        }

        push(
          `"${escapeForDoubleQuotes(data.name)}": "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}",`,
          3
        );
        variable('security', data.name);
      });
    }

    push('},', 2);
    push('200,', 2);
    push('{"Content-Type": "application/json; charset=utf-8"},', 2);
    push(')', 1);
    blank();
    blank();

    push('if __name__ == "__main__":');
    push('app.run(debug=False, host="127.0.0.1", port=os.getenv("PORT", "4000"))', 1);

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
