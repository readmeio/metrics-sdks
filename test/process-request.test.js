/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const bodyParser = require('body-parser');

const processRequest = require('../lib/process-request');

function createApp(options) {
  const app = express();
  app.use(bodyParser.json());
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
          assert.deepEqual(body.postData.text, JSON.stringify({ another: 'Hello world' }));
        });
    });

    it('should only send whitelisted properties', () => {
      const app = createApp({ whitelist: ['password', 'apiKey'] });

      return request(app)
        .post('/')
        .send({ password: '123456', apiKey: 'abcdef', another: 'Hello world' })
        .expect(({ body }) => {
          assert.deepEqual(
            body.postData.text,
            JSON.stringify({ password: '123456', apiKey: 'abcdef' }),
          );
        });
    });
  });

  it('#method', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => assert.equal(body.method, 'POST')));

  it('#url', () =>
    request(createApp())
      .post('/path')
      .query({ a: 'b' })
      // This regex is for supertest's random port numbers
      .expect(({ body }) => assert(body.url.match(/http:\/\/127.0.0.1:\d+\/path\?a=b/))));

  it('#httpVersion', () =>
    request(createApp())
      .post('/')
      .expect(({ body }) => assert.equal(body.httpVersion, '1.1')));

  it('#headers', () =>
    request(createApp())
      .post('/')
      .set('a', '1')
      .expect(({ body }) => {
        assert(body.headers.find(header => header.name === 'host').value.match(/127.0.0.1:\d+/));
        assert.deepEqual(body.headers.filter(header => header.name !== 'host'), [
          { name: 'accept-encoding', value: 'gzip, deflate' },
          { name: 'user-agent', value: 'node-superagent/3.8.2' },
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
        assert.deepEqual(body.queryString, [{ name: 'a', value: 'b' }, { name: 'c', value: 'd' }]),
      ));

  describe('#postData', () => {
    it('#mimeType should be application/json', () =>
      request(createApp())
        .post('/')
        .expect(({ body }) => assert.equal(body.postData.mimeType, 'application/json')));

    it('#text should be stringified body', () => {
      const body = { a: 1, b: 2 };
      return request(createApp())
        .post('/')
        .send(body)
        .expect(res => assert.equal(res.body.postData.text, JSON.stringify(body)));
    });
  });
});
