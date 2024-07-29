import type { LogOptions, PayloadData } from '../../src/lib/construct-payload';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { createServer } from 'http';
import os from 'os';
import * as qs from 'querystring';

import { isValidUUIDV4 } from 'is-valid-uuid-v4';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import pkg from '../../package.json';
import { constructPayload, mask } from '../../src/lib/construct-payload';

function createApp(options?: LogOptions, payloadData?: PayloadData) {
  const requestListener = function (req: IncomingMessage, res: ServerResponse) {
    let body = '';
    let parsedBody: Record<string, unknown> | undefined;

    req.on('readable', function () {
      const chunk = req.read();
      if (chunk) {
        body += chunk;
      }
    });

    req.on('end', function () {
      res.setHeader('Content-Type', 'application/json');

      if (req.headers['content-type'] === 'application/json') {
        parsedBody = JSON.parse(body);
      } else if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        parsedBody = qs.parse(body);
      }

      // @ts-expect-error deliberately passing in potentially bad data
      res.end(JSON.stringify(constructPayload(req, res, { ...payloadData, requestBody: parsedBody }, options)));
    });
  };

  return createServer(requestListener);
}

describe('constructPayload()', function () {
  const group = {
    apiKey: 'user_api_key',
    label: 'label',
    email: 'email',
    startedDateTime: new Date('Mon Sep 27 2021 14:40:20 GMT-0400'),
    responseEndDateTime: new Date('Mon Sep 27 2021 14:40:40 GMT-0400'),
  };

  it('should convert apiKey should take precedence over id field', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.group.id).toBe(mask(group.apiKey));
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should still support id even though it has been deprecated in favor of apiKey', function () {
    const groupAlt = {
      apiKey: 'user_api_key',
      label: 'label',
      email: 'email',
      startedDateTime: new Date(),
      responseEndDateTime: new Date(),
    };

    return request(createApp(undefined, groupAlt))
      .post('/')
      .expect(({ body }) => {
        expect(body.group.id).toBe(mask(group.apiKey));
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should construct a har file from the request/response', function () {
    return request(createApp({ denylist: ['password'] }, group))
      .post('/')
      .send({ password: '123456' })
      .expect(({ body }) => {
        expect(isValidUUIDV4(body._id)).toBe(true);
        expect(body.request.log.entries[0].request.postData).toStrictEqual({
          mimeType: 'application/json',
          text: '{"password":"[REDACTED 6]"}',
        });
      });
  });

  it('#creator', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.creator).toStrictEqual({
          name: 'readme-metrics (node)',
          version: pkg.version,
          comment: `${os.arch()}-${os.platform()}${os.release()}/${process.versions.node}`,
        });
      });
  });

  it('#clientIPAddress', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.clientIPAddress).toBe('::ffff:127.0.0.1');
      });
  });

  it('#pageref should be `req.route.path`', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\//);
      });
  });

  it('#pageref baseurl should be included as well', function () {
    return request(createApp(undefined, group))
      .post('/test-base-path/a')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a/);
      });
  });

  it('#startedDateTime', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(new Date(body.request.log.entries[0].startedDateTime).toISOString()).toBe(
          group.startedDateTime.toISOString(),
        );
      });
  });

  it('#time', function () {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].time).toBe(20000);
      });
  });
});
