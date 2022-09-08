import type { Client } from '../../../targets';

import { CodeBuilder } from '../../../../helpers/code-builder';
import { escapeForObjectKey, escapeForSingleQuotes } from '../../../../helpers/escape';

export const rails: Client = {
  info: {
    key: 'rails',
    title: 'Rails',
    link: 'https://rubyonrails.org/',
    description: 'ReadMe Metrics Webhooks SDK usage on Rails',
  },
  convert: ({ secret, security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, endSection, join, push, pushVariable, ranges, startSection } = new CodeBuilder({
      indent: opts.indent,
    });

    push("require 'readme/webhook'");

    blank();

    push('class MetricsController < ApplicationController');

    push('def index', 1);
    push("render json: { message: 'hello world' }", 2);
    push('end', 1);

    blank();

    push('def post', 1);
    push('head :ok', 2);
    push('end', 1);

    blank();

    push('def webhook', 1);
    startSection('verification');
    push('# Your ReadMe secret', 2);
    push(`secret = '${secret}'`, 2);
    push('# Verify the request is legitimate and came from ReadMe', 2);
    push("signature = request.headers['readme-signature']", 2);

    blank();

    push('begin', 2);
    push('Readme::Webhook.verify(request.raw_post, signature, secret)', 3);
    push('rescue Readme::MissingSignatureError, Readme::ExpiredSignatureError, Readme::InvalidSignatureError => e', 2);
    push('# Handle invalid requests', 3);
    push('render json: { error: e.message }, status: 401', 3);
    push('return', 3);
    push('end', 2);
    endSection('verification');

    blank();

    startSection('payload');
    push('# Fetch the user from the database and return their data for use with OpenAPI variables.', 2);
    push('# current_user ||= User.find(session[:user_id]) if session[:user_id]', 2);
    push('render json: {', 2);

    if (!server.length && !security.length) {
      push('# Add custom data to return in your webhook call here.', 3);
    }
    if (server.length) {
      push('# OAS Server variables', 3);
      server.forEach(data => {
        pushVariable(
          `${escapeForObjectKey(data.name)}: '${escapeForSingleQuotes(
            data.default || data.default === '' ? data.default : data.name
          )}',`,
          {
            type: 'server',
            name: data.name,
            indentationLevel: 3,
          }
        );
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
            pushVariable(`${escapeForObjectKey(data.name)}: { user: 'user', pass: 'pass' },`, {
              type: 'security',
              name: data.name,
              indentationLevel: 3,
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
            indentationLevel: 3,
          }
        );
      });
    }

    push('}', 2);
    endSection('payload');
    push('end', 1);
    push('end');

    blank();

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
