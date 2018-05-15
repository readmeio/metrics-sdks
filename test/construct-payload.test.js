/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const bodyParser = require('body-parser');

const constructPayload = require('../lib/construct-payload');

function createApp(options) {
  const app = express();
  app.use(bodyParser.json());
  app.post('/*', (req, res) => {
    res.json(constructPayload(req, () => {}, options));
  });

  return app;
}

describe('constructPayload()', () => {
  it('should construct a har file from the request', () =>
    request(createApp({ blacklist: ['password'] }))
      .post('/')
      .send({ password: '123456' })
      .expect(({ body }) => {
        assert.equal(typeof body.request.log.entries[0].request, 'object');
        assert(!body.request.log.entries[0].request.postData.text.match('password'), 'Should pass through options');
      }));

  it('#clientIPAddress', () =>
    request(createApp({ blacklist: ['password'] }))
      .post('/')
      .send({ password: '123456' })
      .expect(({ body }) => {
        assert.equal(body.clientIPAddress, '::ffff:127.0.0.1');
      }));
});
