import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';

export const express: Client = {
  info: {
    key: 'express',
    title: 'Express',
    link: 'https://expressjs.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Express',
  },
  convert: ({ security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, join, push, ranges, variable } = new CodeBuilder({ indent: opts.indent });

    push("import express from 'express';");
    push("import readme from 'readmeio';");

    blank();

    push('const app = express();');

    blank();

    push("app.post('/webhook', express.json({ type: 'application/json' }), (req, res) => {");
    push('// Verify the request is legitimate and came from ReadMe', 1);
    push("const signature = req.headers['readme-signature'];", 1);
    push('// Your ReadMe secret', 1);
    push('const secret = process.env.README_API_KEY;', 1);
    push('try {', 1);
    push('readme.verifyWebhook(req.body, signature, secret);', 2);
    push('} catch (e) {', 1);
    push('// Handle invalid requests', 2);
    push('return res.status(401).json({ error: e.message });', 2);
    push('}', 1);
    push('// Fetch the user from the db', 1);
    push('return db.find({ email: req.body.email }).then(user => {', 1);
    push('return res.json({', 2);

    if (server.length) {
      push('// OAS Server variables', 3);
      server.forEach(data => {
        push(`${data.name}: '${data.default || data.default === '' ? data.default : data.name}',`, 3);
        variable('server', data.name);
      });
    }

    if (server.length && security.length) {
      blank();
    }

    if (security.length) {
      push('// OAS Security variables', 3);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            push(`${data.name}: { user: 'user', pass: 'pass' },`, 3);
            variable('security', data.name);
            return;
          }
        }

        push(`${data.name}: '${data.default || data.default === '' ? data.default : data.name}',`, 3);
        variable('security', data.name);
      });
    }

    push('});', 2);
    push('});', 1);
    push('});');

    blank();

    push('app.listen(4000);');

    blank();

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
