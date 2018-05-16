/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const bodyParser = require('body-parser');

const processResponse = require('../lib/process-response');

function createApp(response) {
  const app = express();
  app.use(bodyParser.json());
  app.post('/*', (req, res) => res.json(response));

  return app;
}

describe('processResponse()', () => {
  describe('options', () => {
    it('should strip blacklisted properties', () => {
      const app = createApp({ password: '123456', apiKey: 'abcdef', another: 'Hello world' });

      return request(app)
        .post('/')
        .expect(res => {
          assert.deepEqual(
            processResponse(res, { blacklist: ['password', 'apiKey'] }).content.text,
            JSON.stringify({ another: 'Hello world' }),
          );
        });
    });

    it('should only send whitelisted properties', () => {
      const app = createApp({ password: '123456', apiKey: 'abcdef', another: 'Hello world' });

      return request(app)
        .post('/')
        .expect(res => {
          assert.deepEqual(
            processResponse(res, { whitelist: ['password', 'apiKey'] }).content.text,
            JSON.stringify({ password: '123456', apiKey: 'abcdef' }),
          );
        });
    });
  });

  it('#status', () =>
    request(createApp())
      .post('/')
      .expect(res => assert.equal(processResponse(res).status, 200)));

  it('#statusText', () =>
    request(createApp())
      .post('/')
      .expect(res => {
        assert.equal(processResponse(res).statusText, 'OK');
      }));

  it('#headers', () =>
    request(createApp())
      .post('/')
      .expect(res =>
        assert.deepEqual(processResponse(res).headers.filter(header => header.name !== 'date'), [
          { name: 'x-powered-by', value: 'Express' },
          {
            name: 'content-type',
            value: 'application/json; charset=utf-8',
          },
          { name: 'connection', value: 'close' },
          { name: 'content-length', value: '0' },
        ]),
      ));

  describe('#content', () => {
    it('#size', () => {
      const body = { a: 1, b: 2, c: 3 };
      return request(createApp(body))
        .post('/')
        .expect(res =>
          assert.deepEqual(processResponse(res).content.size, JSON.stringify(body).length),
        );
    });

    it('#mimeType', () =>
      request(createApp())
        .post('/')
        .expect(res =>
          assert.deepEqual(
            processResponse(res).content.mimeType,
            'application/json; charset=utf-8',
          ),
        ));

    it('#text', () => {
      const body = { a: 1, b: 2, c: 3 };
      return request(createApp(body))
        .post('/')
        .expect(res => assert.deepEqual(processResponse(res).content.text, JSON.stringify(body)));
    });
  });
});
