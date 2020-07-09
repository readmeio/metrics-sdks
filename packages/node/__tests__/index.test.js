const express = require('express');
const request = require('supertest');
const nock = require('nock');
const crypto = require('crypto');
const { isValidUUIDV4 } = require('is-valid-uuid-v4');
const config = require('../config');

const middleware = require('..');

const apiKey = 'fakeApiKey';
const group = '5afa21b97011c63320226ef3';

expect.extend({
  toHaveLogHeader(res) {
    const { matcherHint, printExpected, printReceived } = this.utils;
    const message = (pass, actual) => () => {
      return (
        `${matcherHint(pass ? '.not.toHaveLogHeader' : '.toHaveLogHeader')}\n\n` +
        `Expected response headers to have a ${printExpected('x-readme-log')} header with a valid UUIDv4.\n` +
        'Received:\n' +
        `\t${printReceived(actual)}`
      );
    };

    const pass = 'x-readme-log' in res.headers && isValidUUIDV4(res.headers['x-readme-log']);

    return {
      pass,
      message: message(pass, 'x-readme-log' in res.headers ? res.headers['x-readme-log'] : undefined),
    };
  },
});

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
      .expect(200)
      .expect(res => expect(res).toHaveLogHeader());

    mock.done();
  });

  describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async function test() {
      const mock = nock(config.host)
        .post('/v1/request', body => {
          expect(body).toHaveLength(3);
          return true;
        })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { bufferLength: 3 }));
      app.get('/test', (req, res) => res.sendStatus(200));

      // We need to make sure that the logId isn't being preserved between buffered requests.
      let logId;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveLogHeader();
          logId = res.headers['x-readme-log'];
        });

      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveLogHeader();
          expect(res.headers['x-readme-log']).not.toBe(logId);
          logId = res.headers['x-readme-log'];
        });

      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveLogHeader();
          expect(res.headers['x-readme-log']).not.toBe(logId);
        });

      expect(mock.isDone()).toBe(true);
      mock.done();
    });

    it('should clear out the queue when sent', () => {
      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const seenLogs = [];

      const mocks = [...new Array(numberOfMocks).keys()].map(() =>
        nock(config.host)
          .post('/v1/request', body => {
            expect(body).toHaveLength(bufferLength);

            // Ensure that our executed requests and the buffered queue they're in remain unique.
            body.forEach(req => {
              const requestHash = crypto.createHash('md5').update(JSON.stringify(req)).digest('hex');
              expect(seenLogs).not.toContain(requestHash);
              seenLogs.push(requestHash);
            });

            return true;
          })
          // This is the important part of this test,
          // the delay mimics the latency of a real
          // HTTP request
          .delay(1000)
          .reply(200)
      );

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { bufferLength }));
      app.get('/test', (req, res) => res.sendStatus(200));

      return Promise.all(
        [...new Array(numberOfLogs).keys()].map(i => {
          return request(app).get(`/test?log=${i}`).expect(200);
        })
      ).then(() => {
        mocks.map(mock => mock.done());
      });
    });
  });

  describe('`res._body`', () => {
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return nock(config.host)
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].response.content.text).toBe(JSON.stringify(responseBody));
          return true;
        })
        .reply(200);
    }

    it('should buffer up res.write() calls', async function test() {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => {
        res.write('{"a":1,');
        res.write('"b":2,');
        res.write('"c":3}');
        res.status(200).end();
      });

      await request(app).get('/test').expect(200);

      mock.done();
    });

    it('should buffer up res.end() calls', async function test() {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveLogHeader());

      mock.done();
    });

    it('should work for res.send() calls', async function test() {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveLogHeader());

      mock.done();
    });
  });
});
