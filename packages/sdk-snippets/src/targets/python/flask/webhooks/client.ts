import type { Client } from '../../../targets';

import { CodeWriter } from '../../../../helpers/code-writer';

export const flask: Client = {
  info: {
    key: 'flask',
    title: 'Flask',
    link: 'https://flask.palletsprojects.com',
    description: 'ReadMe Metrics Webhooks SDK usage on Flask',
  },
  convert: ({ secret, security, server }) => {
    const writer = new CodeWriter({
      indentNumberOfSpaces: 4,
      useSingleQuote: false,
    });

    writer.writeLine('import os');
    writer.writeLine('import sys');
    writer.writeLine('from flask import Flask, request');
    writer.writeLine('from readme_metrics.VerifyWebhook import VerifyWebhook');
    writer.blankLine();

    writer
      .writeLine('if os.getenv("README_API_KEY") is None:')
      .indent(() => {
        writer.writeLine('sys.stderr.write("Missing `README_API_KEY` environment variable")');
        writer.writeLine('sys.stderr.flush()');
        writer.writeLine('sys.exit(1)');
      })
      .blankLine();

    writer.writeLine('app = Flask(__name__)');
    writer.blankLine();

    writer.writeLine('# Your ReadMe secret');
    writer.write('secret = ').quote(secret).newLine();
    writer.blankLine();
    writer.blankLine();

    writer.writeLine('@app.post("/webhook")');
    writer.writeLine('def webhook():').indent(() => {
      writer.writeLine('# Verify the request is legitimate and came from ReadMe.');
      writer.writeLine('signature = request.headers.get("readme-signature", None)');
      writer.blankLine();

      writer
        .writeLine('try:')
        .indent(() => {
          writer.writeLine('VerifyWebhook(request.get_json(), signature, secret)');
        })
        .writeLine('except Exception as error:')
        .indent(() => {
          writer
            .writeLine('return (')
            .indent(() => {
              writer.writeLine('{"error": str(error)},');
              writer.writeLine('401,');
              writer.writeLine('{"Content-Type": "application/json; charset=utf-8"},');
            })
            .writeLine(')');
        })
        .blankLine();

      writer.writeLine('# Fetch the user from the database and return their data for use with OpenAPI variables.');
      writer.writeLine('# user = User.objects.get(email__exact=request.values.get("email"))');
      writer
        .writeLine('return (')
        .indent(() => {
          writer
            .writeLine('{')
            .indent(() => {
              if (!server.length && !security.length) {
                writer.writeLine('# Add custom data to return in your webhook call here.');
                return;
              }

              if (server.length) {
                writer.writeLine('# OAS Server variables');
                server.forEach(data => {
                  writer
                    .writeEscapedString(data.name)
                    .write(': ')
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
                writer.writeLine('# OAS Security variables');
                security.forEach(data => {
                  if (data.type === 'http') {
                    // Only HTTP Basic auth has any special handling for supplying auth.
                    if (data.scheme === 'basic') {
                      writer
                        .writeEscapedString(data.name)
                        .write(': {"user": "user", "pass": "pass"},')
                        .newLine()
                        .recordRange('security', data.name);

                      return;
                    }
                  }

                  writer
                    .writeEscapedString(data.name)
                    .write(': ')
                    .writeEscapedString(data.default || data.default === '' ? data.default : data.name)
                    .write(',')
                    .newLine()
                    .recordRange('security', data.name);
                });
              }
            })
            .writeLine('},')
            .writeLine('200,')
            .writeLine('{"Content-Type": "application/json; charset=utf-8"},');
        })
        .writeLine(')');
    });

    writer.blankLine();
    writer.blankLine();

    writer.writeLine('if __name__ == "__main__":').indent(() => {
      writer.write('app.run(debug=False, host="127.0.0.1", port=os.getenv("PORT", "8000"))');
    });

    return {
      ranges: writer.getRanges(),
      snippet: writer.toString(),
    };
  },
};
