const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const processRequest = require('../../src/lib/process-request');

function createApp(options) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const router = express.Router();

  router.post('/a', (req, res) => res.json(processRequest(req, options)));

  app.use('/test-base-path', router);

  app.get('/*', (req, res) => res.json(processRequest(req, options)));

  app.post('/*', (req, res) => {
    res.json(processRequest(req, options));
  });

  return app;
}

describe('processRequest()', () => {
  describe('options', () => {
    describe('denylist/allowlist', () => {
      it('should strip denylisted properties', () => {
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

      it('should strip denylisted nested properties', () => {
        const app = createApp({ denylist: ['a.b.c'] });

        return request(app)
          .post('/')
          .send({ a: { b: { c: {} } } })
          .expect(({ body }) => {
            expect(body.postData.text).toBe('{"a":{"b":{"c":"[REDACTED]"}}}');
          });
      });

      it('should only send allowlisted properties', () => {
        const app = createApp({ allowlist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
          .expect(({ body }) => {
            expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
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
    });

    describe('denylist/allowlist in headers', () => {
      it('should strip denylisted properties', () => {
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

      it('should only send allowlisted properties', () => {
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

    describe('denylist/allowlist in body and headers', () => {
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
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
            );
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
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
            );
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
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
            );
          });
      });
    });

    /*
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
            expect(body.postData.text).toBe(
              '{"password":"[REDACTED 6]","apiKey":"[REDACTED 3]","another":"Hello world"}'
            );
          });
      });

      it('should only send whitelisted properties', () => {
        const app = createApp({ whitelist: ['password', 'apiKey'] });

        return request(app)
          .post('/')
          .send({ password: '123456', apiKey: 'abc', another: 'Hello world' })
          .expect(({ body }) => {
            expect(body.postData.text).toBe('{"password":"123456","apiKey":"abc","another":"[REDACTED 11]"}');
          });
      });
    });
  });

  it('#method', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => expect(body.method).toBe('POST')));

  it('#url', () =>
    request(createApp())
      .post('/path')
      .query({ a: 'b' })
      // This regex is for supertest's random port numbers
      .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/path\?a=b/)));

  it('#url protocol x-forwarded-proto', () =>
    request(createApp())
      .post('/')
      .set('x-forwarded-proto', 'https')
      // This regex is for supertest's random port numbers
      .expect(({ body }) => expect(body.url).toMatch(/^https/)));

  it('#url-basepath', () =>
    request(createApp())
      .post('/test-base-path/a')
      .query({ a: 'b' })
      // This regex is for supertest's random port numbers
      .expect(({ body }) => expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a\?a=b/)));

  it('#url with x-forwarded-host', () =>
    request(createApp())
      .post('/path')
      .set({ 'x-forwarded-host': 'dash.readme.io' })
      // This regex is for supertest's random port numbers
      .expect(({ body }) => expect(body.url).toMatch('http://dash.readme.io/path')));

  it('#httpVersion', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => expect(body.httpVersion).toBe('HTTP/1.1')));

  it('#headers', () =>
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

  it('#queryString', () =>
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
    describe('application/x-www-form-urlencoded', () => {
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

    it('#mimeType should default to application/json', () =>
      request(createApp())
        .post('/')
        .send({ a: 1 })
        .expect(({ body }) => expect(body.postData.mimeType).toBe('application/json')));

    it('should be an empty object if request is a GET', () =>
      request(createApp())
        .get('/')
        .expect(({ body }) => expect(body.postData).toStrictEqual({})));

    it('should be an empty object if req.body is empty', () =>
      request(createApp())
        .post('/')
        .expect(({ body }) => expect(body.postData).toStrictEqual({})));

    it('#text should contain stringified body', () => {
      const body = { a: 1, b: 2 };
      return request(createApp())
        .post('/')
        .send(body)
        .expect(res => expect(res.body.postData.text).toBe('{"a":1,"b":2}'));
    });
  });
});
