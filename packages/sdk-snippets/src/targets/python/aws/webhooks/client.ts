// For use with AWS Lambda Runtime: python3.9

import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForDoubleQuotes } from '../../../../helpers/escape';

export const aws: Client = {
  info: {
    key: 'aws',
    title: 'AWS API Gateway',
    link: 'https://aws.amazon.com/api-gateway/',
    description: 'ReadMe Metrics Webhooks SDK usage on AWS API Gateway',
    metadata: {
      lambdaRuntime: 'python3.9',
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

    push('import json');
    blank();
    push('import boto3');
    push('from readme_metrics.VerifyWebhook import VerifyWebhook');
    blank();

    push('# Your ReadMe secret as a bytes object; you may want to store this in AWS Secrets Manager');
    push(`README_SECRET = b"${secret}"`);

    if (opts.createKeys) {
      blank();
      push('# Your default API Gateway usage plan; this will be attached to new API keys being created');
      push(`DEFAULT_USAGE_PLAN_ID = "${opts.defaultUsagePlanId}"`);
    }

    blank();
    blank();
    push('def handler(event, lambda_context):');
    push('status_code = None', 1);
    push('email = None', 1);
    push('api_key = None', 1);
    push('error = None', 1);
    blank();

    push('try:', 1);
    startSection('verification');
    push('# Verify the request is legitimate and came from ReadMe.', 2);
    push('signature = event.get("headers", {}).get("ReadMe-Signature")', 2);
    push('body = json.loads(event.get("body", "{}"))', 2);
    push('VerifyWebhook(body, signature, README_SECRET)', 2);
    endSection('verification');
    blank();

    startSection('payload');
    push("# Look up the API key associated with the user's email address.", 2);
    push('email = body.get("email")', 2);
    push('client = boto3.client("apigateway")', 2);
    push('keys = client.get_api_keys(nameQuery=email, includeValues=True)', 2);
    push('if len(keys.get("items", [])) > 0:', 2);
    push('# If multiple API keys are returned for the given email, use the first one.', 3);
    push('api_key = keys["items"][0]["value"]', 3);
    push('status_code = 200', 3);
    push('else:', 2);
    if (opts.createKeys) {
      push('# If no API keys were found, create a new key and apply a usage plan.', 3);
      push('key = client.create_api_key(', 3);
      push('name=email,', 4);
      push('description=f"API key for ReadMe user {email}",', 4);
      push('tags={"user": email, "vendor": "ReadMe"},', 4);
      push('enabled=True,', 4);
      push(')', 3);
      blank();
      push('client.create_usage_plan_key(', 3);
      push('usagePlanId=DEFAULT_USAGE_PLAN_ID, keyId=key["id"], keyType="API_KEY"', 4);
      push(')', 3);
      blank();
      push('api_key = key["value"]', 3);
      push('status_code = 200', 3);
    } else {
      push('error = "Email not found"', 3);
      push('status_code = 404', 3);
    }
    endSection('payload');
    push('except Exception as e:', 1);
    push('error = str(e)', 2);
    push('if error.find("Signature") > -1:', 2);
    push('status_code = 401', 3);
    push('else:', 2);
    push('status_code = 500', 3);
    blank();

    push('if status_code == 200:', 1);
    push('body = {', 2);

    if (server.length) {
      push('# OAS Server variables', 3);
      server.forEach(data => {
        pushVariable(
          `"${escapeForDoubleQuotes(data.name)}": "${escapeForDoubleQuotes(
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
            pushVariable(`"${escapeForDoubleQuotes(data.name)}": { "user": email, "pass": api_key },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 3,
            });
            return;
          }
        }

        pushVariable(`"${escapeForDoubleQuotes(data.name)}": api_key,`, {
          type: 'security',
          name: data.name,
          indentationLevel: 3,
        });
      });
    } else {
      push("# The user's API key", 3);
      pushVariable('"apiKey": api_key', {
        type: 'security',
        name: 'apiKey',
        indentationLevel: 3,
      });
    }
    push('}', 2);
    push('else:', 1);
    push('body = {"message": error}', 2);
    blank();

    push('return {', 1);
    push('"statusCode": status_code,', 2);
    push('"headers": {"Content-Type": "application/json"},', 2);
    push('"body": json.dumps(body),', 2);
    push('}', 1);

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
