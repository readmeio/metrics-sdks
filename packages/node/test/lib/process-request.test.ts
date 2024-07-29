import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LogOptions } from 'src/lib/construct-payload';

import { createServer } from 'http';

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import processRequest from '../../src/lib/process-request';

function createApp(reqOptions?: LogOptions, shouldPreParse = false, bodyOverride?: Record<string, unknown>) {
  const requestListener = function (req: IncomingMessage, res: ServerResponse) {
    let body = '';

    req.on('readable', function () {
      const chunk = req.read();
      if (chunk) {
        body += chunk;
      }
    });

    req.on('end', function () {
      res.setHeader('Content-Type', 'application/json');
      if (shouldPreParse) {
        body = JSON.parse(body);
      }

      res.end(
        // This typeof check allows us to override the body with `null`
        JSON.stringify(processRequest(req, typeof bodyOverride !== 'undefined' ? bodyOverride : body, reqOptions)),
      );
    });
  };

  return createServer(requestListener);
}

describe('process-request', function () {
  it('should create expected json response when preparsed', function () {
    const app = createApp({}, true);

    return request(app)
      .post('/')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"Hello world"}');
      });
  });

  it('should work with application/x-json', function () {
    const app = createApp({ denylist: ['password'] }, true);

    return request(app)
      .post('/')
      .set('Content-Type', 'application/x-json')
      .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
      });
  });

  it('should work with text/json', function () {
    const app = createApp({ denylist: ['password'] }, true);

    return request(app)
      .post('/')
      .set('Content-Type', 'text/json')
      .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
      });
  });

  it('should work with text/x-json', function () {
    const app = createApp({ denylist: ['password'] }, true);

    return request(app)
      .post('/')
      .set('Content-Type', 'text/x-json')
      .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
      });
  });

  it('should work with *+json', function () {
    const app = createApp({ denylist: ['password'] }, true);

    return request(app)
      .post('/')
      .set('Content-Type', 'application/vnd.api+json')
      .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
      });
  });

  it('should work with multipart/form-data', function () {
    const app = createApp({ denylist: ['password'] });

    return request(app)
      .post('/')
      .field('password', '123456')
      .field('apiKey', 'abc')
      .field('another', 'Hello world')
      .expect(({ body }) => {
        expect(body.postData.mimeType).toBe('multipart/form-data');

        // If the request body for multipart form comes in as a string, we record it as is.
        const payload = body.postData.text.split('\r\n').map((str: string) => {
          return str.startsWith('---') ? '---BOUNDARY' : str;
        });

        expect(payload).toStrictEqual([
          '---BOUNDARY',
          'Content-Disposition: form-data; name="password"',
          '',
          '123456',
          '---BOUNDARY',
          'Content-Disposition: form-data; name="apiKey"',
          '',
          'abc',
          '---BOUNDARY',
          'Content-Disposition: form-data; name="another"',
          '',
          'Hello world',
          '---BOUNDARY',
          '',
        ]);
      });
  });

  it('should fail gracefully with circular json objects', function () {
    const obj: Record<string, unknown> = { foo: null };
    obj.foo = obj;

    const app = createApp({ denylist: ['password'] }, false, obj);

    return request(app)
      .post('/')
      .set('content-type', 'text/plain')
      .send("this isn't used")
      .expect(({ body }) => {
        // If the request body for multipart form comes in as a string, we record it as is.
        expect(body.postData.text).toBe(
          '[ReadMe is unable to handle circular JSON. Please contact support if you have any questions.]',
        );
      });
  });

  it('should hash Authorization header', function () {
    const app = createApp();

    return request(app)
      .post('/')
      .set('authorization', 'Bearer 123456')
      .expect(({ body }) => {
        expect(body.headers).toHaveHeader(
          'authorization',
          'sha512-31rXi6lhQcMvMwee0P6yu9xyHuAWDUEuDzcSBQCCUUvlQ6BZXcu67qy1hrD2nbrjeDLKrYrBbQoMOrLnJVmbCw==?3456',
        );
      });
  });

  describe('options', function () {
    describe('denylist/allowlist', function () {
      it('should strip denylisted json properties', function () {
        const app = createApp({ denylist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
            );
          });
      });

      it('should strip denylisted form-encoded properties', function () {
        const app = createApp({ denylist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send('password=123456&apiKey=abc&another=Hello world')
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBeUndefined();
            expect(body.postData.params).toStrictEqual([
              {
                name: 'password',
                value: '[REDACTED 6]',
              },
              {
                name: 'apiKey',
                value: '[REDACTED 3]',
              },
              {
                name: 'another',
                value: 'Hello world',
              },
            ]);
          });
      });

      it('should strip denylisted nested properties', function () {
        const app = createApp({ denylist: ['a.b.c'] });

        return request(app)
          .post('/')
          .send({ a: { b: { c: {} } } })
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBe('{"a":{"b":{"c":"[REDACTED]"}}}');
          });
      });

      it('should only send allowlisted json properties', function () {
        const app = createApp({ allowlist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
          });
      });

      it('should only send allowlisted form properties', function () {
        const app = createApp({ allowlist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send('password=123456&apiKey=abc&another=Hello world')
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBeUndefined();
            expect(body.postData.params).toStrictEqual([
              {
                name: 'password',
                value: '123456',
              },
              {
                name: 'apiKey',
                value: 'abc',
              },
              {
                name: 'another',
                value: '[REDACTED 11]',
              },
            ]);
          });
      });

      it('should only send allowlisted nested properties', function () {
        const app = createApp({ allowlist: ['a.b.c'] });

        return request(app)
          .post('/')
          .send({ a: { b: { c: 1 } }, d: 2 })
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBe('{"a":{"b":{"c":1}},"d":"[REDACTED]"}');
          });
      });

      it('should ignore allowlist if denylist is present', function () {
        const app = createApp({ denylist: ['password', 'apiKey'], allowlist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
            );
          });
      });

      it('should strip denylisted headers', function () {
        const app = createApp({ denylist: ['host', 'accept-encoding', 'user-agent', 'connection'] });

        return request(app)
          .post('/')
          .set('x-ratelimit-limit', '10')
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.headers).toHaveHeader('host', '[REDACTED 15]');
            expect(body.headers).toHaveHeader('accept-encoding', '[REDACTED 13]');
            expect(body.headers).toHaveHeader('x-ratelimit-limit', '10');
            expect(body.headers).toHaveHeader('connection', '[REDACTED 5]');
            expect(body.headers).toHaveHeader('content-length', '0');
          });
      });

      it('should only send allowlisted headers', function () {
        const app = createApp({ allowlist: ['x-ratelimit-limit'] });

        return request(app)
          .post('/')
          .set('x-ratelimit-limit', '10')
          .expect(({ body }) => {
            expect(body.url).toBeAURL();
            expect(body.headers).toHaveHeader('host', '[REDACTED 15]');
            expect(body.headers).toHaveHeader('accept-encoding', '[REDACTED 13]');
            expect(body.headers).toHaveHeader('x-ratelimit-limit', '10');
            expect(body.headers).toHaveHeader('connection', '[REDACTED 5]');
            expect(body.headers).toHaveHeader('content-length', '[REDACTED 1]');
          });
      });
    });

    it('should strip denylisted properties in body and headers', function () {
      const app = createApp({
        denylist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
      });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .set('x-ratelimit-limit', '10')
        .expect(({ body }) => {
          expect(body.url).toBeAURL();
          expect(body.headers).toHaveHeader('host', '[REDACTED 15]');
          expect(body.headers).toHaveHeader('accept-encoding', '[REDACTED 13]');
          expect(body.headers).toHaveHeader('content-type', 'application/json');
          expect(body.headers).toHaveHeader('x-ratelimit-limit', '10');
          expect(body.headers).toHaveHeader('content-length', '[REDACTED 2]');
          expect(body.headers).toHaveHeader('connection', '[REDACTED 5]');

          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
          );
        });
    });

    it('should only send allowlisted nested properties in body and headers', function () {
      const app = createApp({
        allowlist: ['x-ratelimit-limit', 'another', 'content-type'],
      });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .set('x-ratelimit-limit', '10')
        .expect(({ body }) => {
          expect(body.url).toBeAURL();
          expect(body.headers).toHaveHeader('host', '[REDACTED 15]');
          expect(body.headers).toHaveHeader('accept-encoding', '[REDACTED 13]');
          expect(body.headers).toHaveHeader('content-type', 'application/json');
          expect(body.headers).toHaveHeader('x-ratelimit-limit', '10');
          expect(body.headers).toHaveHeader('content-length', '[REDACTED 2]');
          expect(body.headers).toHaveHeader('connection', '[REDACTED 5]');

          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
          );
        });
    });

    it('should ignore allowlist if there are denylisted properties in headers and body', function () {
      const app = createApp({
        denylist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
        allowlist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
      });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .set('x-ratelimit-limit', '10')
        .expect(({ body }) => {
          expect(body.url).toBeAURL();
          expect(body.headers).toHaveHeader('host', '[REDACTED 15]');
          expect(body.headers).toHaveHeader('accept-encoding', '[REDACTED 13]');
          expect(body.headers).toHaveHeader('content-type', 'application/json');
          expect(body.headers).toHaveHeader('x-ratelimit-limit', '10');
          expect(body.headers).toHaveHeader('content-length', '[REDACTED 2]');
          expect(body.headers).toHaveHeader('connection', '[REDACTED 5]');

          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
          );
        });
    });
  });

  /**
   * These tests are for the legacy blacklist/whitelist properties that mirrors allowlist/denylist behavior.
   * Rather than reimplementing each test again here, it should be appropriate to just test the base case as
   * The behavior here is assumed to use the same code paths as those used by the new properties.
   */
  describe('deprecated blacklist/whitelist', function () {
    it('should strip blacklisted properties', function () {
      const app = createApp({ blacklist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.url).toBeAURL();
          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}',
          );
        });
    });

    it('should only send whitelisted properties', function () {
      const app = createApp({ whitelist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .set('content-type', 'application/json')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.url).toBeAURL();
          expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
        });
    });
  });

  it('#method', function () {
    return request(createApp())
      .post('/')
      .expect(({ body }) => expect(body.method).toBe('POST'));
  });

  it('#url', function () {
    return (
      request(createApp())
        .post('/path')
        .query({ a: 'b' })
        // This regex is for supertest's random port numbers
        .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/path\?a=b/))
    );
  });

  it('#url protocol x-forwarded-proto', function () {
    return (
      request(createApp())
        .post('/')
        .set('x-forwarded-proto', 'https')
        // This regex is for supertest's random port numbers
        .expect(({ body }) => expect(body.url).toMatch(/^https/))
    );
  });

  it('#url protocol x-forwarded-proto multiple', function () {
    return (
      request(createApp())
        .post('/')
        .set('x-forwarded-proto', 'https,http')
        // This regex is for supertest's random port numbers
        .expect(({ body }) => expect(body.url).toMatch(/^https:\/\/127.0.0.1/))
    );
  });

  it('#url-basepath', function () {
    return (
      request(createApp())
        .post('/test-base-path/a')
        .query({ a: 'b' })
        // This regex is for supertest's random port numbers
        .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a\?a=b/))
    );
  });

  it('#url with x-forwarded-host', function () {
    return (
      request(createApp())
        .post('/path')
        .set({ 'x-forwarded-host': 'dash.readme.com' })
        // This regex is for supertest's random port numbers
        .expect(({ body }) => expect(body.url).toBe('http://dash.readme.com/path'))
    );
  });

  it('#httpVersion', function () {
    return request(createApp())
      .post('/')
      .expect(({ body }) => expect(body.httpVersion).toBe('HTTP/1.1'));
  });

  it('#headers', function () {
    return request(createApp())
      .post('/')
      .set('a', '1')
      .expect(({ body }) => {
        expect(body.headers.find((header: { name: string }) => header.name === 'host').value).toMatch(/127.0.0.1:\d+/);
        expect(body.headers.filter((header: { name: string }) => header.name !== 'host')).toStrictEqual([
          { name: 'accept-encoding', value: 'gzip, deflate' },
          { name: 'a', value: '1' },
          { name: 'connection', value: 'close' },
          { name: 'content-length', value: '0' },
        ]);
      });
  });

  it('#queryString', function () {
    return request(createApp())
      .post('/')
      .query({ a: 'b', c: 'd' })
      .expect(({ body }) =>
        expect(body.queryString).toStrictEqual([
          { name: 'a', value: 'b' },
          { name: 'c', value: 'd' },
        ]),
      );
  });

  describe('#postData', function () {
    it('#params should contain parsed body', function () {
      return request(createApp())
        .post('/')
        .set({ name: 'content-type', value: 'application/x-www-form-urlencoded' })
        .send('a=1&b=2')
        .expect(res =>
          expect(res.body.postData.params).toStrictEqual([
            { name: 'a', value: '1' },
            { name: 'b', value: '2' },
          ]),
        );
    });

    it('should not error with no body', function () {
      // @ts-expect-error deliberately passing in bad data
      return request(createApp({}, false, null))
        .post('/')
        .set('content-type', 'application/x-www-form-urlencoded')
        .expect(res => expect(res.body.postData.params).toStrictEqual([]));
    });

    it('#mimeType should properly parse content-type header', function () {
      return request(createApp())
        .post('/')
        .set({ name: 'content-type', value: 'application/x-www-form-urlencoded; charset=UTF-8' })
        .send('a=1&b=2')
        .expect(res => expect(res.body.postData.mimeType).toBe('application/x-www-form-urlencoded'));
    });
  });

  it('should be undefined if request has no postData', function () {
    return request(createApp())
      .get('/')
      .expect(({ body }) => expect(body.postData).toBeUndefined());
  });

  it('should be missing if req.body is empty', function () {
    return request(createApp())
      .post('/')
      .expect(({ body }) => expect(body.postData).toBeUndefined());
  });

  it('#text should contain stringified body', function () {
    const body = { a: 1, b: 2 };
    return request(createApp())
      .post('/')
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(res => {
        expect(res.body.postData.text).toBe('{"a":1,"b":2}');
      });
  });

  it('#text should contain stringified body if corrupted json', function () {
    const body = '{"a":1,"b":2';

    return request(createApp())
      .post('/')
      .set('Content-Type', 'application/json')
      .send(body)
      .expect(res => {
        expect(res.body.postData.text).toBe(body);
      });
  });

  it('#text should contain stringified body with an unknown format', function () {
    const body = 'hellloooo';
    return request(createApp())
      .post('/')
      .set('Content-Type', 'text/html')
      .send(body)
      .expect(res => {
        expect(res.body.postData.mimeType).toBe('text/html');
        expect(res.body.postData.text).toBe('hellloooo');
      });
  });
});
