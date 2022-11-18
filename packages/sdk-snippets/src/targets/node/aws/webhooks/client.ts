import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForSingleQuotes } from '../../../../helpers/escape';

export const aws: Client = {
  info: {
    key: 'aws',
    title: 'AWS API Gateway',
    link: 'https://aws.amazon.com/api-gateway/',
    description: 'ReadMe Metrics Webhooks SDK usage on AWS API Gateway',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '  ',
      readOnly: true,
      ...options,
    };

    const { blank, endSection, join, push, pushVariable, ranges, startSection } = new CodeBuilder({
      indent: opts.indent,
    });

    // push("const express = require('express');");
    // push("const readme = require('readmeio');");

    // blank();

    // push('const app = express();');
    // blank();

    // push('// Your ReadMe secret');
    // push(`const secret = '${secret}';`);
    // blank();

    // push("app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {");
    // startSection('verification');
    // push('// Verify the request is legitimate and came from ReadMe.', 1);
    // push("const signature = req.headers['readme-signature'];", 1);
    // blank();

    // push('try {', 1);
    // push('readme.verifyWebhook(req.body, signature, secret);', 2);
    // push('} catch (e) {', 1);
    // push('// Handle invalid requests', 2);
    // push('return res.status(401).json({ error: e.message });', 2);
    // push('}', 1);
    // endSection('verification');
    // blank();

    // startSection('payload');
    // push('// Fetch the user from the database and return their data for use with OpenAPI variables.', 1);
    // push('// const user = await db.find({ email: req.body.email })', 1);
    // push('return res.json({', 1);

    // if (!server.length && !security.length) {
    //   push('// Add custom data to return in your webhook call here.', 2);
    // }

    // if (server.length) {
    //   push('// OAS Server variables', 2);
    //   server.forEach(data => {
    //     pushVariable(
    //       `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
    //         data.default || data.default === '' ? data.default : data.name
    //       )}',`,
    //       {
    //         type: 'server',
    //         name: data.name,
    //         indentationLevel: 2,
    //       }
    //     );
    //   });
    // }

    // if (server.length && security.length) {
    //   blank();
    // }

    // if (security.length) {
    //   push('// OAS Security variables', 2);
    //   security.forEach(data => {
    //     if (data.type === 'http') {
    //       // Only HTTP Basic auth has any special handling for supplying auth.
    //       if (data.scheme === 'basic') {
    //         pushVariable(`${escapeForObjectKey(data.name)}: { user: 'user', pass: 'pass' },`, {
    //           type: 'security',
    //           name: data.name,
    //           indentationLevel: 2,
    //         });
    //         return;
    //       }
    //     }

    //     pushVariable(
    //       `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
    //         data.default || data.default === '' ? data.default : data.name
    //       )}',`,
    //       {
    //         type: 'security',
    //         name: data.name,
    //         indentationLevel: 2,
    //       }
    //     );
    //   });
    // }

    // push('});', 1);
    // endSection('payload');
    // push('});');

    // blank();

    // push("const server = app.listen(8000, '0.0.0.0', () => {");
    // push("console.log('Example app listening at http://%s:%s', server.address().address, server.address().port);", 1);
    // push('});');
    // blank();

    // (Internal ReadMe note) This is an example Personalized Docs webhook handler
    // for customers using AWS API Gateway. In this example we attempt to lookup the
    // API key for the user with the given email address by using the AWS SDK method
    // GetApiKeys. It returns a JSON response with { "apiKey": "whatever" }, or a
    // 404 if the user doesn't exist.

    // For use with this AWS Lambda Runtime: nodejs16.x
    // Create API keys: no

    push("const { APIGatewayClient, GetApiKeysCommand } = require('@aws-sdk/client-api-gateway');");
    push("const readme = require('readmeio');");
    blank();

    push('// Your ReadMe secret; you may want to store this in AWS Secrets Manager');
    // @todo: This should be populated with the project's JWT secret
    push(`const README_SECRET = '${secret}';`);
    blank();

    push('exports.handler = async event => {');
    push('let statusCode, apiKey, error;', 1);
    blank();

    push('try {', 1);
    startSection('verification');
    push("const signature = event.headers['ReadMe-Signature'];", 2);
    push('const body = JSON.parse(event.body);', 2);
    push('readme.verifyWebhook(body, signature, README_SECRET);', 2);
    endSection('verification');
    blank();

    startSection('payload');
    push('const email = body.email;', 2);
    push('const client = new APIGatewayClient();', 2);
    push('const command = new GetApiKeysCommand({ nameQuery: email, includeValues: true });', 2);
    push('const keys = await client.send(command);', 2);
    push('if (keys.items.length > 0) {', 2);
    // if multiple API keys are returned for the given email, use the first one
    // @todo Talk to Gabe about when/whether to return "keys" as an array of { apiKey, id } or { user, id } objects
    push('apiKey = keys.items[0].value;', 3);
    push('statusCode = 200;', 3);
    push('} else {', 2);
    push("error = 'Email not found';", 3);
    push('statusCode = 404;', 3);
    push('}', 2);
    endSection('payload');
    push('} catch (e) {', 1);
    push('error = e.message;', 2);
    push('statusCode = error.match(/Signature/) ? 401 : 500;', 2);
    push('}', 1);
    blank();

    push('return {', 1);
    push('statusCode,', 2);
    push("headers: { 'Content-Type': 'application/json' },", 2);
    push('body: JSON.stringify({ apiKey, message: error }),', 2);
    push('};', 1);
    push('};');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
