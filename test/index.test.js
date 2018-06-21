/* eslint-env mocha */
const express = require('express');
const request = require('supertest');
const assert = require('assert');
const nock = require('nock');
const config = require('../config');

const middleware = require('../');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('#metrics', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  it('should error if missing apiKey', () => {
    assert.throws(() => {
      middleware.metrics();
    }, /You must provide your ReadMe API key/);
  });

  it('should error if missing grouping function', () => {
    assert.throws(() => {
      middleware.metrics('api-key');
    }, /You must provide a grouping function/);
  });

  it('should send a request to the metrics server', async function test() {
    this.timeout(5000);

    const group = '5afa21b97011c63320226ef3';

    const mock = nock(config.host)
      .post('/request', ([body]) => {
        assert.equal(body.group, group);
        assert.equal(typeof body.request.log.entries[0].startedDateTime, 'string');
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = express();
    app.use(middleware.metrics(apiKey, () => group));
    app.get('/test', (req, res) => res.sendStatus(200));

    await request(app)
      .get('/test')
      .expect(200);

    mock.done();
  });

  describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async function test() {
      this.timeout(5000);

      const group = '5afa21b97011c63320226ef3';

      const mock = nock(config.host)
        .post('/request', body => {
          assert.equal(body.length, 3);
          return true;
        })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { bufferLength: 3 }));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200);

      assert.equal(mock.isDone(), false);

      await request(app)
        .get('/test')
        .expect(200);

      assert.equal(mock.isDone(), false);

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    });
  });

  describe('`res._body`', () => {
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return nock(config.host)
        .post('/request', ([body]) => {
          assert.equal(
            body.request.log.entries[0].response.content.text,
            JSON.stringify(responseBody),
          );
          return true;
        })
        .reply(200);
    }

    it('should buffer up res.write() calls', async function test() {
      this.timeout(5000);

      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => '123'));
      app.get('/test', (req, res) => {
        res.write('{"a":1,');
        res.write('"b":2,');
        res.write('"c":3}');
        res.status(200).end();
      });

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    });

    it('should buffer up res.end() calls', async function test() {
      this.timeout(5000);

      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => '123'));
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    });

    it('should work for res.send() calls', async function test() {
      this.timeout(5000);

      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => '123'));
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    });
  });

  describe('#login', () => {
    before(() => {
      nock.disableNetConnect();
      nock.enableNetConnect('127.0.0.1');
    });
    after(() => nock.cleanAll());

    it('should error if missing apiKey', () => {
      assert.throws(() => {
        middleware.login();
      }, /You must provide your ReadMe API key/);
    });

    it('should error if missing user function', () => {
      assert.throws(() => {
        middleware.login(apiKey);
      }, /You must provide a function to get the user/);
    });

    it('should redirect if no user', () => {
      const app = express();
      app.get(
        '/readme',
        middleware.login(apiKey, () => false, {
          loginUrl: '/login',
        }),
      );

      return request(app)
        .get('/readme')
        .expect(302)
        .expect(res => {
          assert(res.header.location.startsWith('/login?redirect='));
        });
    });

    it('should redirect to readme if user', () => {
      const app = express();
      nock(config.readmeUrl)
        .get('/api/v1/jwt-secret')
        .basicAuth({
          user: apiKey,
          pass: '',
        })
        .reply(200, { jwtSecret: 'jwt', redirect: 'http://readme.readme.io' });

      app.get(
        '/readme',
        middleware.login(apiKey, () => ({ name: 'marc' }), {
          loginUrl: '/login',
        }),
      );

      return request(app)
        .get('/readme')
        .expect(302)
        .expect(res => {
          assert(res.header.location.startsWith('http://readme.readme.io?auth_token='));
        });
    });
  });

  describe('#magicLink', () => {
    before(() => {
      nock.disableNetConnect();
      nock.enableNetConnect('127.0.0.1');
    });
    after(() => nock.cleanAll());

    it('should error if missing apiKey', async () => {
      try {
        await middleware.magicLink();
      } catch (e) {
        return assert.equal(e.message, 'You must provide your ReadMe API key');
      }
      return assert(false);
    });

    it('should error if missing user function', async () => {
      try {
        await middleware.magicLink(apiKey);
      } catch (e) {
        return assert.equal(e.message, 'You must provide a user object');
      }
      return assert(false);
    });

    it('should prepend base url if redirect is path', async () => {
      nock(config.readmeUrl)
        .get('/api/v1/jwt-secret')
        .basicAuth({
          user: apiKey,
          pass: '',
        })
        .reply(200, { jwtSecret: 'jwt', baseUrl2: 'http://readme.readme.io' });

      const jwtLink = await middleware.magicLink(apiKey, { user: 'marc' }, '/docs');
      assert(jwtLink.startsWith('http://readme.readme.io/docs'));
    });
  });

  it('should not prepend base url if redirect is full url', async () => {
    nock(config.readmeUrl)
      .get('/api/v1/jwt-secret')
      .basicAuth({
        user: apiKey,
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'http://readme.readme.io' });

    const jwtLink = await middleware.magicLink(
      apiKey,
      { user: 'marc' },
      'http://docs.readme.io/docs',
    );
    assert(jwtLink.startsWith('http://docs.readme.io/docs'));
  });
});
