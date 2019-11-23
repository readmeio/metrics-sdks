const express = require('express');
const request = require('supertest');
const nock = require('nock');
const config = require('../config');

const middleware = require('../');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('#metrics', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  afterEach(() => nock.cleanAll());

  it('should error if missing apiKey', () => {
    expect(() => {
      middleware.metrics();
    }).toThrow('You must provide your ReadMe API key');
  });

  it('should error if missing grouping function', () => {
    expect(() => {
      middleware.metrics('api-key');
    }).toThrow('You must provide a grouping function');
  });

  it('should send a request to the metrics server', async function test() {
    const group = '5afa21b97011c63320226ef3';

    const mock = nock(config.host)
      .post('/v1/request', ([body]) => {
        expect(body.group).toBe(group);
        expect(typeof body.request.log.entries[0].startedDateTime).toBe('string');
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
  }, 5000);

  describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async function test() {
      const group = '5afa21b97011c63320226ef3';

      const mock = nock(config.host)
        .post('/v1/request', body => {
          expect(body).toHaveLength(3);
          return true;
        })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { bufferLength: 3 }));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200);

      expect(mock.isDone()).toBeFalsy();

      await request(app)
        .get('/test')
        .expect(200);

      expect(mock.isDone()).toBeFalsy();

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    }, 5000);
  });

  describe('`res._body`', () => {
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return nock(config.host)
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].response.content.text).toBe(
            JSON.stringify(responseBody),
          );
          return true;
        })
        .reply(200);
    }

    it('should buffer up res.write() calls', async function test() {
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
    }, 5000);

    it('should buffer up res.end() calls', async function test() {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => '123'));
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    }, 5000);

    it('should work for res.send() calls', async function test() {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => '123'));
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app)
        .get('/test')
        .expect(200);

      mock.done();
    }, 5000);
  });

  describe('#login', () => {
    beforeEach(() => {
      nock.disableNetConnect();
      nock.enableNetConnect('127.0.0.1');
    });
    afterEach(() => nock.cleanAll());

    it('should error if missing apiKey', () => {
      expect(() => {
        middleware.login();
      }).toThrow('You must provide your ReadMe API key');
    });

    it('should error if missing user function', () => {
      expect(() => {
        middleware.login(apiKey);
      }).toThrow('You must provide a function to get the user');
    });

    describe('redirect flows', () => {
      beforeEach(() => {
        nock(config.readmeUrl)
          .get('/api/v1/')
          .basicAuth({
            user: apiKey,
            pass: '',
          })
          .reply(200, { jwtSecret: 'jwt', baseUrl: 'http://readme.readme.io' });
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
            expect(res.header.location.startsWith('/login?redirect=')).toBeTruthy();
          });
      });

      it('should redirect to readme if user', () => {
        const app = express();

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
            expect(
              res.header.location.startsWith('http://readme.readme.io?auth_token='),
            ).toBeTruthy();
          });
      });
    });
  });
});
