const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const processRequest = require('../lib/process-request');

function createApp(options) {
  const app = express();
  app.use(bodyParser.json());

  const router = express.Router();

  router.post('/a', (req, res) => res.json(processRequest(req, options)));

  app.use('/test-base-path', router);

  app.post('/*', (req, res) => {
    res.json(processRequest(req, options));
  });

  return app;
}

describe('processRequest()', () => {
  describe('options', () => {
    it('should strip blacklisted properties', () => {
      const app = createApp({ blacklist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abcdef', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.postData.params).toStrictEqual([{ name: 'another', value: 'Hello world' }]);
        });
    });

    it('should only send whitelisted properties', () => {
      const app = createApp({ whitelist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abcdef', another: 'Hello world' })
        .expect(({ body }) => {
          expect(body.postData.params).toStrictEqual([
            { name: 'password', value: '123456' },
            { name: 'apiKey', value: 'abcdef' },
          ]);
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
      .expect(({ body }) =>
        expect(body.url).toMatch(/http:\/\/127.0.0.1:\d+\/test-base-path\/a\?a=b/),
      ));

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
          { name: 'user-agent', value: 'node-superagent/3.8.3' },
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
        ]),
      ));

  describe('#postData', () => {
    it('#mimeType should be application/json', () =>
      request(createApp())
        .post('/')
        .expect(({ body }) => expect(body.postData.mimeType).toBe('application/json')));

    it('#text should be stringified body', () => {
      const body = { a: 1, b: 2 };
      return request(createApp())
        .post('/')
        .send(body)
        .expect(res =>
          expect(res.body.postData.params).toStrictEqual([
            { name: 'a', value: 1 },
            { name: 'b', value: 2 },
          ]),
        );
    });
  });
});
