/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const nock = require('nock');
const config = require('config');

const middleware = require('../');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('@readme/metrics', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  it('should error if missing apiKey', () => {
    assert.throws(() => {
      middleware();
    }, 'You must provide your ReadMe API key');
  });

  it('should error if missing grouping function', () => {
    assert.throws(() => {
      middleware('api-key');
    }, 'You must provide a grouping function');
  });

  it('should send a request to the metrics server', async function test() {
    this.timeout(5000);

    const group = '5afa21b97011c63320226ef3';

    const mock = nock(config.host)
      .post('/request', body => {
        assert.equal(body.group, group);
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = express();
    app.use((req, res, next) => {
      req.user = { group };
      return next();
    });
    app.use(middleware(apiKey, req => req.user.group));
    app.get('/test', (req, res) => res.sendStatus(200));

    await request(app).get('/test').expect(200);

    mock.done()
  });
});
