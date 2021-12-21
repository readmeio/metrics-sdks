import type { LogOptions } from 'src/lib/construct-payload';
import request from 'supertest';
import * as http from 'http';
import processRequest from '../../src/lib/process-request';
import FormData from 'form-data';

function createApp(reqOptions?: LogOptions, shouldPreParse = false, bodyOverride?) {
  const requestListener = function (req: http.IncomingMessage, res: http.ServerResponse) {
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

      res.end(JSON.stringify(processRequest(req, bodyOverride || body, reqOptions)));
    });
  };

  return http.createServer(requestListener);
}

test('should create expected json response when preparsed', () => {
  const app = createApp({}, true);

  return request(app)
    .post('/')
    .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
    .expect(({ body }) => {
      expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"Hello world"}');
    });
});

test('should work with application/x-json', () => {
  const app = createApp({ denylist: ['password'] }, true);

  return request(app)
    .post('/')
    .set('Content-Type', 'application/x-json')
    .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
    .expect(({ body }) => {
      expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
    });
});

test('should work with text/json', () => {
  const app = createApp({ denylist: ['password'] }, true);

  return request(app)
    .post('/')
    .set('Content-Type', 'text/json')
    .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
    .expect(({ body }) => {
      expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
    });
});

test('should work with text/x-json', () => {
  const app = createApp({ denylist: ['password'] }, true);

  return request(app)
    .post('/')
    .set('Content-Type', 'text/x-json')
    .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
    .expect(({ body }) => {
      expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
    });
});

test('should work with *+json', () => {
  const app = createApp({ denylist: ['password'] }, true);

  return request(app)
    .post('/')
    .set('Content-Type', 'application/custom+json')
    .send(JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }))
    .expect(({ body }) => {
      expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"abc","another":"Hello world"}');
    });
});

test('should work with multipart/form-data', () => {
  const app = createApp({ denylist: ['password'] });

  const form = new FormData();
  form.append('password', '123456');
  form.append('apiKey', 'abc');
  form.append('another', 'Hello world');

  const formHeaders = form.getHeaders();

  return request(app)
    .post('/')
    .set(formHeaders)
    .send(form.getBuffer().toString())
    .expect(({ body }) => {
      // If the request body for multipart form comes in as a string, we record it as is.
      expect(body.postData.text).toBe(form.getBuffer().toString());
    });
});

test('should fail gracefully with circular json objects', () => {
  const obj = { foo: null };
  obj.foo = obj;

  const app = createApp({ denylist: ['password'] }, false, obj);

  return request(app)
    .post('/')
    .set('content-type', 'text/plain')
    .send("this isn't used")
    .expect(({ body }) => {
      // If the request body for multipart form comes in as a string, we record it as is.
      expect(body.postData.text).toBe(
        '[ReadMe is unable to handle circular JSON. Please contact support if you have any questions.]'
      );
    });
});

describe('options', () => {
  describe('denylist/allowlist', () => {
    it('should strip denylisted json properties', () => {
      const app = createApp({ denylist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
          );
        });
    });

    it('should strip denylisted form-encoded properties', () => {
      const app = createApp({ denylist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send('password=123456&apiKey=abc&another=Hello world')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(({ body }) => {
          expect(body.postData.text).toBeNull();
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

    it('should strip denylisted nested properties', () => {
      const app = createApp({ denylist: ['a.b.c'] });

      return request(app)
        .post('/')
        .send({ a: { b: { c: {} } } })
        .expect(({ body }) => {
          expect(body.postData.text).toBe('{"a":{"b":{"c":"[REDACTED]"}}}');
        });
    });

    it('should only send allowlisted json properties', () => {
      const app = createApp({ allowlist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
        });
    });

    it('should only send allowlisted form properties', () => {
      const app = createApp({ allowlist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send('password=123456&apiKey=abc&another=Hello world')
        .expect(({ body }) => {
          expect(body.postData.text).toBeNull();
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

    it('should only send allowlisted nested properties', () => {
      const app = createApp({ allowlist: ['a.b.c'] });

      return request(app)
        .post('/')
        .send({ a: { b: { c: 1 } }, d: 2 })
        .expect(({ body }) => {
          expect(body.postData.text).toBe('{"a":{"b":{"c":1}},"d":"[REDACTED]"}');
        });
    });

    it('should ignore allowlist if denylist is present', () => {
      const app = createApp({ denylist: ['password', 'apiKey'], allowlist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.postData.text).toBe(
            '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
          );
        });
    });

    it('should strip denylisted headers', () => {
      const app = createApp({ denylist: ['host', 'accept-encoding', 'user-agent', 'connection'] });

      return request(app)
        .post('/')
        .set('a', '1')
        .expect(({ body }) => {
          expect(body.headers).toStrictEqual(
            expect.arrayContaining([
              { name: 'host', value: '[REDACTED 15]' },
              { name: 'accept-encoding', value: '[REDACTED 13]' },
              { name: 'a', value: '1' },
              { name: 'connection', value: '[REDACTED 5]' },
              { name: 'content-length', value: '0' },
            ])
          );
        });
    });

    it('should only send allowlisted headers', () => {
      const app = createApp({ allowlist: ['a'] });

      return request(app)
        .post('/')
        .set('a', '1')
        .expect(({ body }) => {
          expect(body.headers).toStrictEqual(
            expect.arrayContaining([
              { name: 'host', value: '[REDACTED 15]' },
              { name: 'accept-encoding', value: '[REDACTED 13]' },
              { name: 'a', value: '1' },
              { name: 'connection', value: '[REDACTED 5]' },
              { name: 'content-length', value: '[REDACTED 1]' },
            ])
          );
        });
    });
  });

  it('should strip denylisted properties in body and headers', () => {
    const app = createApp({
      denylist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
    });

    return request(app)
      .post('/')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .set('a', '1')
      .expect(({ body }) => {
        expect(body.headers).toStrictEqual(
          expect.arrayContaining([
            { name: 'host', value: '[REDACTED 15]' },
            { name: 'accept-encoding', value: '[REDACTED 13]' },
            { name: 'content-type', value: 'application/json' },
            { name: 'a', value: '1' },
            { name: 'content-length', value: '[REDACTED 2]' },
            { name: 'connection', value: '[REDACTED 5]' },
          ])
        );

        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}');
      });
  });

  it('should only send allowlisted nested properties in body and headers', () => {
    const app = createApp({
      allowlist: ['a', 'another', 'content-type'],
    });

    return request(app)
      .post('/')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .set('a', '1')
      .expect(({ body }) => {
        expect(body.headers).toStrictEqual(
          expect.arrayContaining([
            { name: 'host', value: '[REDACTED 15]' },
            { name: 'accept-encoding', value: '[REDACTED 13]' },
            { name: 'content-type', value: 'application/json' },
            { name: 'a', value: '1' },
            { name: 'content-length', value: '[REDACTED 2]' },
            { name: 'connection', value: '[REDACTED 5]' },
          ])
        );

        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}');
      });
  });

  it('should ignore allowlist if there are denylisted properties in headers and body', () => {
    const app = createApp({
      denylist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
      allowlist: ['host', 'accept-encoding', 'user-agent', 'connection', 'content-length', 'password', 'apiKey'],
    });

    return request(app)
      .post('/')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .set('a', '1')
      .expect(({ body }) => {
        expect(body.headers).toStrictEqual(
          expect.arrayContaining([
            { name: 'host', value: '[REDACTED 15]' },
            { name: 'accept-encoding', value: '[REDACTED 13]' },
            { name: 'content-type', value: 'application/json' },
            { name: 'a', value: '1' },
            { name: 'content-length', value: '[REDACTED 2]' },
            { name: 'connection', value: '[REDACTED 5]' },
          ])
        );

        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}');
      });
  });
});

/**
 * These tests are for the legacy blacklist/whitelist properties that mirrors allowlist/denylist behavior.
 * Rather than reimplementing each test again here, it should be appropriate to just test the base case as
 * The behavior here is assumed to use the same code paths as those used by the new properties.
 */
describe('deprecated blacklist/whitelist', () => {
  it('should strip blacklisted properties', () => {
    const app = createApp({ blacklist: ['password', 'apiKey'] });

    return request(app)
      .post('/')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}');
      });
  });

  it('should only send whitelisted properties', () => {
    const app = createApp({ whitelist: ['password', 'apiKey'] });

    return request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
      .expect(({ body }) => {
        expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
      });
  });
});

test('#method', () =>
  request(createApp())
    .post('/')
    .expect(({ body }) => expect(body.method).toBe('POST')));

test('#url', () =>
  request(createApp())
    .post('/path')
    .query({ a: 'b' })
    // This regex is for supertest's random port numbers
    .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/path\?a=b/)));

test('#url protocol x-forwarded-proto', () =>
  request(createApp())
    .post('/')
    .set('x-forwarded-proto', 'https')
    // This regex is for supertest's random port numbers
    .expect(({ body }) => expect(body.url).toMatch(/^https/)));

test('#url-basepath', () =>
  request(createApp())
    .post('/test-base-path/a')
    .query({ a: 'b' })
    // This regex is for supertest's random port numbers
    .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a\?a=b/)));

test('#url with x-forwarded-host', () =>
  request(createApp())
    .post('/path')
    .set({ 'x-forwarded-host': 'dash.readme.io' })
    // This regex is for supertest's random port numbers
    .expect(({ body }) => expect(body.url).toMatch('http://dash.readme.io/path')));

test('#httpVersion', () =>
  request(createApp())
    .post('/')
    .expect(({ body }) => expect(body.httpVersion).toBe('HTTP/1.1')));

test('#headers', () =>
  request(createApp())
    .post('/')
    .set('a', '1')
    .expect(({ body }) => {
      expect(body.headers.find(header => header.name === 'host').value).toMatch(/127.0.0.1:\d+/);
      expect(body.headers.filter(header => header.name !== 'host')).toStrictEqual([
        { name: 'accept-encoding', value: 'gzip, deflate' },
        { name: 'a', value: '1' },
        { name: 'connection', value: 'close' },
        { name: 'content-length', value: '0' },
      ]);
    }));

test('#queryString', () =>
  request(createApp())
    .post('/')
    .query({ a: 'b', c: 'd' })
    .expect(({ body }) =>
      expect(body.queryString).toStrictEqual([
        { name: 'a', value: 'b' },
        { name: 'c', value: 'd' },
      ])
    ));

describe('#postData', () => {
  it('#params should contain parsed body', () => {
    return request(createApp())
      .post('/')
      .set({ name: 'content-type', value: 'application/x-www-form-urlencoded' })
      .send('a=1&b=2')
      .expect(res =>
        expect(res.body.postData.params).toStrictEqual([
          { name: 'a', value: '1' },
          { name: 'b', value: '2' },
        ])
      );
  });

  it('#mimeType should properly parse content-type header', () => {
    return request(createApp())
      .post('/')
      .set({ name: 'content-type', value: 'application/x-www-form-urlencoded; charset=UTF-8' })
      .send('a=1&b=2')
      .expect(res => expect(res.body.postData.mimeType).toBe('application/x-www-form-urlencoded'));
  });
});

test('should be a undefined if request is a GET', () =>
  request(createApp())
    .get('/')
    .expect(({ body }) => expect(body.postData).toBeUndefined()));

test('should be missing if req.body is empty', () =>
  request(createApp())
    .post('/')
    .expect(({ body }) => expect(body.postData).toBeUndefined()));

test('#text should contain stringified body', () => {
  const body = { a: 1, b: 2 };
  return request(createApp())
    .post('/')
    .set('Content-Type', 'application/json')
    .send(body)
    .expect(res => {
      expect(res.body.postData.text).toBe('{"a":1,"b":2}');
    });
});

test('#text should contain stringified body with an unknown format', () => {
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
