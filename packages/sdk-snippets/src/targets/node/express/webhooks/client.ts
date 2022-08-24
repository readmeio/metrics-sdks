import type { Client } from '../../../targets';

import { CodeWriter } from '../../../../helpers/code-writer';

export const express: Client = {
  info: {
    key: 'express',
    title: 'Express',
    link: 'https://expressjs.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Express',
  },
  convert: ({ secret, security, server }) => {
    const writer = new CodeWriter({
      indentNumberOfSpaces: 2,
      useSingleQuote: true,
    });

    writer.writeLine("import express from 'express';");
    writer.writeLine("import readme from 'readmeio';");
    writer.blankLine();

    writer.writeLine('const app = express();');
    writer.blankLine();

    writer.writeLine('// Your ReadMe secret');
    writer.write('const secret = ').quote(secret).write(';').newLine();
    writer.blankLine();

    writer
      .writeLine("app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {")
      .indent(() => {
        writer.writeLine('// Verify the request is legitimate and came from ReadMe.');
        writer.writeLine("const signature = req.headers['readme-signature'];");
        writer.blankLine();

        writer
          .writeLine('try {')
          .indent(() => {
            writer.writeLine('readme.verifyWebhook(req.body, signature, secret);');
          })
          .writeLine('} catch (e) {')
          .indent(() => {
            writer.writeLine('// Handle invalid requests');
            writer.writeLine('return res.status(401).json({ error: e.message });');
          })
          .writeLine('}')
          .blankLine();

        writer.writeLine('// Fetch the user from the database and return their data for use with OpenAPI variables.');
        writer.writeLine('// const user = await db.find({ email: req.body.email })');
        writer
          .writeLine('return res.json({')
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
              writer.writeLine('// OAS Security variables');
              security.forEach(data => {
                if (data.type === 'http') {
                  // Only HTTP Basic auth has any special handling for supplying auth.
                  if (data.scheme === 'basic') {
                    writer
                      .writeObjectKey(data.name)
                      .write(": { user: 'user', pass: 'pass' },")
                      .newLine()
                      .recordRange('security', data.name);

                    return;
                  }
                }

                writer
                  .writeObjectKey(data.name)
                  .write(': ')
                  .writeEscapedString(data.default || data.default === '' ? data.default : data.name)
                  .write(',')
                  .newLine()
                  .recordRange('security', data.name);
              });
            }
          })
          .writeLine('});');
      })
      .writeLine('});');

    writer.blankLine();

    writer.write('app.listen(8000);');

    return {
      ranges: writer.getRanges(),
      snippet: writer.toString(),
    };
  },
};
