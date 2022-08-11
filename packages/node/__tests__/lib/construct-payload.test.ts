import type { LogOptions, PayloadData } from '../../src/lib/construct-payload';

import * as http from 'http';
import * as qs from 'querystring';

import { isValidUUIDV4 } from 'is-valid-uuid-v4';
import request from 'supertest';

import packageJson from '../../package.json';
import { constructPayload } from '../../src/lib/construct-payload';

function fixPlatform(platform: string): 'mac' | 'windows' | 'linux' | 'unknown' {
  switch (platform) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'windows';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

function createApp(options?: LogOptions, payloadData?: PayloadData) {
  const requestListener = function (req: http.IncomingMessage, res: http.ServerResponse) {
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

      res.end(JSON.stringify(constructPayload(req, res, { ...payloadData, requestBody: parsedBody }, options)));
    });
  };

  return http.createServer(requestListener);
}

describe('constructPayload()', () => {
  const group = {
    apiKey: 'user_api_key',
    label: 'label',
    email: 'email',
    startedDateTime: new Date('Mon Sep 27 2021 14:40:20 GMT-0400'),
    responseEndDateTime: new Date('Mon Sep 27 2021 14:40:40 GMT-0400'),
  };

  it('should convert apiKey should take precedence over id field', () => {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.group.id).toBe(group.apiKey);
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should still support id even though it has been deprecated in favor of apiKey', () => {
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
        expect(body.group.id).toBe(group.apiKey);
        expect(body.group.apiKey).toBeUndefined();
      });
  });

  it('should construct a har file from the request/response', () => {
    return request(createApp({ denylist: ['password'] }, group))
      .post('/')
      .send({ password: '123456' })
      .expect(({ body }) => {
        expect(isValidUUIDV4(body._id)).toBe(true);
        expect(typeof body.request.log.entries[0].request).toBe('object');
        expect(typeof body.request.log.entries[0].response).toBe('object');
        expect(body.request.log.entries[0].request.postData).toStrictEqual({
          mimeType: 'application/json',
          text: '{"password":"[REDACTED 6]"}',
        });
      });
  });

  it('#creator', () =>
    request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.creator).toStrictEqual({
          name: packageJson.name,
          version: packageJson.version,
          comment: `${fixPlatform(process.platform)}/${process.version}`,
        });
      }));

  it('#clientIPAddress', () =>
    request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.clientIPAddress).toBe('::ffff:127.0.0.1');
      }));

  it('#pageref should be `req.route.path`', () =>
    request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\//);
      }));

  it('#pageref baseurl should be included as well', () =>
    request(createApp(undefined, group))
      .post('/test-base-path/a')
      .expect(({ body }) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a/);
      }));

  it('#startedDateTime', () => {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(new Date(body.request.log.entries[0].startedDateTime).toISOString()).toBe(
          group.startedDateTime.toISOString()
        );
      });
  });

  it('#time', () => {
    return request(createApp(undefined, group))
      .post('/')
      .expect(({ body }) => {
        expect(typeof body.request.log.entries[0].time).toBe('number');
        expect(body.request.log.entries[0].time).toBe(20000);
      });
  });
});
