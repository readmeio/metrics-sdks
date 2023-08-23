// For use with AWS Lambda Runtime: nodejs16.x

import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForSingleQuotes } from '../../../../helpers/escape';

export const aws: Client = {
  info: {
    key: 'aws',
    title: 'AWS API Gateway',
    link: 'https://aws.amazon.com/api-gateway/',
    description: 'ReadMe Metrics Webhooks SDK usage on AWS API Gateway',
    metadata: {
      lambdaRuntime: 'nodejs16.x',
    },
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '  ',
      createKeys: false,
      // We don't currently provide a value for defaultUsagePlanId in the
      // ReadMe app, since we don't have any knowledge of our customers' usage
      // plans -- but we might choose to later, and it's helpful for testing.
      defaultUsagePlanId: '123abc',
      ...options,
    };

    const { blank, endSection, join, push, pushVariable, ranges, startSection } = new CodeBuilder({
      indent: opts.indent,
    });

    if (opts.createKeys) {
      push('const {');
      push('APIGatewayClient,', 1);
      push('CreateApiKeyCommand,', 1);
      push('CreateUsagePlanKeyCommand,', 1);
      push('GetApiKeysCommand,', 1);
      push("} = require('@aws-sdk/client-api-gateway');");
    } else {
      push("const { APIGatewayClient, GetApiKeysCommand } = require('@aws-sdk/client-api-gateway');");
    }
    push("const readme = require('readmeio');");
    blank();

    push('// Your ReadMe secret; you may want to store this in AWS Secrets Manager');
    push(`const README_SECRET = '${secret}';`);
    blank();

    if (opts.createKeys) {
      push('// Your default API Gateway usage plan; this will be attached to new API keys being created');
      push(`const DEFAULT_USAGE_PLAN_ID = '${opts.defaultUsagePlanId}';`);
      blank();
    }

    push('exports.handler = async event => {');
    push('let statusCode, email, apiKey, error;', 1);
    blank();

    push('try {', 1);
    startSection('verification');
    push('// Verify the request is legitimate and came from ReadMe.', 2);
    push("const signature = event.headers['ReadMe-Signature'];", 2);
    push('const body = JSON.parse(event.body);', 2);
    push('readme.verifyWebhook(body, signature, README_SECRET);', 2);
    endSection('verification');
    blank();

    startSection('payload');
    const getCommandName = opts.createKeys ? 'getCommand' : 'command';
    push("// Look up the API key associated with the user's email address.", 2);
    push('const email = body.email;', 2);
    push('const client = new APIGatewayClient();', 2);
    push(`const ${getCommandName} = new GetApiKeysCommand({ nameQuery: email, includeValues: true });`, 2);
    push(`const keys = await client.send(${getCommandName});`, 2);
    push('if (keys.items.length > 0) {', 2);
    push('// If multiple API keys are returned for the given email, use the first one.', 3);
    push('apiKey = keys.items[0].value;', 3);
    push('statusCode = 200;', 3);
    push('} else {', 2);
    if (opts.createKeys) {
      push('// If no API keys were found, create a new key and apply a usage plan.', 3);
      push('const createKeyCommand = new CreateApiKeyCommand({', 3);
      push('name: email,', 4);
      // eslint-disable-next-line no-template-curly-in-string
      push('description: `API key for ReadMe user ${email}`,', 4);
      push('tags: {', 4);
      push('user: email,', 5);
      push("vendor: 'ReadMe',", 5);
      push('},', 4);
      push('enabled: true,', 4);
      push('});', 3);
      push('const key = await client.send(createKeyCommand);', 3);
      blank();
      push('const usagePlanKeyCommand = new CreateUsagePlanKeyCommand({', 3);
      push('usagePlanId: DEFAULT_USAGE_PLAN_ID,', 4);
      push('keyId: key.id,', 4);
      push("keyType: 'API_KEY',", 4);
      push('});', 3);
      push('await client.send(usagePlanKeyCommand);', 3);
      blank();
      push('apiKey = key.value;', 3);
      push('statusCode = 200;', 3);
    } else {
      push("error = 'Email not found';", 3);
      push('statusCode = 404;', 3);
    }
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
    push('body: JSON.stringify({', 2);

    if (server.length) {
      push('// OAS Server variables', 3);
      server.forEach(data => {
        pushVariable(
          `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
            data.default || data.default === '' ? data.default : data.name,
          )}',`,
          {
            type: 'server',
            name: data.name,
            indentationLevel: 3,
          },
        );
      });
      blank();
    }

    if (security.length) {
      push('// OAS Security variables', 3);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            pushVariable(`${escapeForObjectKey(data.name)}: { user: email, pass: apiKey },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 3,
            });
            return;
          }
        }

        pushVariable(`${escapeForObjectKey(data.name)}: apiKey,`, {
          type: 'security',
          name: data.name,
          indentationLevel: 3,
        });
      });
    } else {
      push("// The user's API key", 3);
      pushVariable('apiKey,', {
        type: 'security',
        name: 'apiKey',
        indentationLevel: 3,
      });
    }
    blank();
    push('// Error message, if any', 3);
    push('message: error,', 3);
    push('}),', 2);
    push('};', 1);
    push('};');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
