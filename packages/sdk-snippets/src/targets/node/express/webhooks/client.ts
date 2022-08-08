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

    push('// Save this code as `server.js`');
    push('// Run the server with `node server.js`');
    push("const readme = require('readmeio');");
    push("const express = require('express');");

    blank();

    push('const app = express();');
    blank();

    push("app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {");
    push('// Verify the request is legitimate and came from ReadMe', 1);
    push("const signature = req.headers['readme-signature'];", 1);
    blank();

    push('// Your ReadMe secret', 1);
    push("const secret = 'rdme_xxxx';", 1); // TODO should pass in JWT secret here
    blank();

    push('try {', 1);
    push('readme.verify(req.body, signature, secret);', 2);
    push('} catch (e) {', 1);
    push('// Handle invalid requests', 2);
    push('return res.sendStatus(401);', 2);
    push('}', 1);

    blank();
    push('// Fetch the user from the db', 1);
    push('db.find({ email: req.body.email }).then(user => {', 1);
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
          push(`${data.name}: { user: 'user', pass: 'pass' },`, 3);
          variable('security', data.name);
          return;
        }

        push(`${data.name}: '${data.default || data.default === '' ? data.default : data.name}',`, 3);
        variable('security', data.name);
      });
    }

    push('});', 2);
    push('});', 1);
    push('});');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
