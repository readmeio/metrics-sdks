// For use with AWS Lambda Runtime: ruby2.7

import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForDoubleQuotes } from '../../../../helpers/escape';

export const aws: Client = {
  info: {
    key: 'aws',
    title: 'AWS API Gateway',
    link: 'https://aws.amazon.com/api-gateway/',
    description: 'ReadMe Metrics Webhooks SDK usage on AWS API Gateway',
    metadata: {
      lambdaRuntime: 'ruby2.7',
    },
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '    ',
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

    push("require 'aws-sdk-apigateway'");
    push("require 'json'");
    push("require 'readme/webhook'");
    blank();

    push('# Your ReadMe secret; you may want to store this in AWS Secrets Manager');
    push(`README_SECRET = "${secret}"`);
    blank();

    if (opts.createKeys) {
      push('# Your default API Gateway usage plan; this will be attached to new API keys being created');
      push(`DEFAULT_USAGE_PLAN_ID = "${opts.defaultUsagePlanId}"`);
      blank();
    }

    push('def handler(event:, context:)');
    push('status_code = nil', 1);
    push('api_key = nil', 1);
    push('error = nil', 1);
    blank();

    push('begin', 1);
    startSection('verification');
    push('# Verify the request is legitimate and came from ReadMe.', 2);
    push("signature = event['headers']['ReadMe-Signature'];", 2);
    push("Readme::Webhook.verify(event['body'], signature, README_SECRET)", 2);
    endSection('verification');
    blank();

    startSection('payload');
    push("# Look up the API key associated with the user's email address.", 2);
    push("body = JSON.parse(event['body']);", 2);
    push("email = body['email']", 2);
    push('client = Aws::APIGateway::Client.new()', 2);
    push('keys = client.get_api_keys({', 2);
    push('name_query: email,', 3);
    push('include_values: true', 3);
    push('})', 2);
    push('if keys.items.length > 0', 2);
    push('# If multiple API keys are returned for the given email, use the first one.', 3);
    push('api_key = keys.items[0].value', 3);
    push('status_code = 200', 3);
    push('else', 2);
    if (opts.createKeys) {
      push('# If no API keys were found, create a new key and apply a usage plan.', 3);
      push('key = client.create_api_key(', 3);
      push('name: email,', 4);
      push('description: "API key for ReadMe user #{email}",', 4);
      push('tags: {"user": email, "vendor": "ReadMe"},', 4);
      push('enabled: true', 4);
      push(')', 3);
      blank();
      push('client.create_usage_plan_key(', 3);
      push('usage_plan_id: DEFAULT_USAGE_PLAN_ID,', 4);
      push('key_id: key.id,', 4);
      push('key_type: "API_KEY"', 4);
      push(')', 3);
      blank();
      push('api_key = key.value', 3);
      push('status_code = 200', 3);
    } else {
      push('error = "Email not found"', 3);
      push('status_code = 404', 3);
    }
    push('end', 2);
    endSection('payload');

    push('rescue Readme::MissingSignatureError, Readme::ExpiredSignatureError, Readme::InvalidSignatureError => e', 1);
    push('error = e.message', 2);
    push('status_code = 401', 2);
    push('rescue => e', 1);
    push('error = e.message', 2);
    push('status_code = 500', 2);
    push('end', 1);
    blank();

    push('if status_code == 200', 1);
    push('body = {', 2);

    if (server.length) {
      push('# OAS Server variables', 3);
      server.forEach(data => {
        pushVariable(
          `${escapeForObjectKey(data.name)}: "${escapeForDoubleQuotes(
            data.default || data.default === '' ? data.default : data.name,
          )}",`,
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
      push('# OAS Security variables', 3);
      security.forEach(data => {
        if (data.type === 'http') {
          // Only HTTP Basic auth has any special handling for supplying auth.
          if (data.scheme === 'basic') {
            pushVariable(`${escapeForObjectKey(data.name)}: { user: email, pass: api_key },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 3,
            });
            return;
          }
        }

        pushVariable(`${escapeForObjectKey(data.name)}: api_key,`, {
          type: 'security',
          name: data.name,
          indentationLevel: 3,
        });
      });
    } else {
      push("# The user's API key", 3);
      pushVariable('apiKey: api_key', {
        type: 'security',
        name: 'apiKey',
        indentationLevel: 3,
      });
    }

    push('}', 2);
    push('else', 1);
    push('body = {message: error}', 2);
    push('end', 1);
    blank();

    push('return {', 1);
    push('statusCode: status_code,', 2);
    push("headers: {'Content-Type': 'application/json'},", 2);
    push('body: body.to_json', 2);
    push('}', 1);
    push('end');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
