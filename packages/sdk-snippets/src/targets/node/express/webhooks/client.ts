import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForSingleQuotes } from '../../../../helpers/escape';

export const express: Client = {
  info: {
    key: 'express',
    title: 'Express',
    link: 'https://expressjs.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Express',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, join, push, pushVariable, ranges } = new CodeBuilder({ indent: opts.indent });

    push("import express from 'express';");
    push("import readme from 'readmeio';");

    blank();

    push('const app = express();');
    blank();

    push('// Your ReadMe secret');
    push(`const secret = '${secret}';`);
    blank();

    push("app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {");
    push('// Verify the request is legitimate and came from ReadMe.', 1);
    push("const signature = req.headers['readme-signature'];", 1);
    blank();

    push('try {', 1);
    push('readme.verifyWebhook(req.body, signature, secret);', 2);
    push('} catch (e) {', 1);
    push('// Handle invalid requests', 2);
    push('return res.status(401).json({ error: e.message });', 2);
    push('}', 1);
    blank();

    push('// Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    push('// const user = await db.find({ email: req.body.email })', 1);
    push('return res.json({', 1);

    if (server.length) {
      push('// OAS Server variables', 2);
      server.forEach(data => {
        pushVariable(
          `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}',`,
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
            pushVariable(`${escapeForObjectKey(data.name)}: { user: 'user', pass: 'pass' },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 2,
            });
            return;
          }
        }

        pushVariable(
          `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}',`,
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

    push('app.listen(4000);');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
