const express = require('express');
const request = require('supertest');
const rimraf = require('rimraf');
const crypto = require('crypto');
const flatCache = require('flat-cache');
const findCacheDir = require('find-cache-dir');
const { isValidUUIDV4 } = require('is-valid-uuid-v4');
const io = require('socket.io-client');
const pkg = require('../package.json');
const middleware = require('..');

const baseLogUrl = 'https://docs.example.com';
const cacheDir = findCacheDir({ name: pkg.name });
const apiKey = 'validApiKey';
const group = {
  id: '5afa21b97011c63320226ef3',
  label: 'example user',
  email: 'user@example.com',
};

function constructGroup(testFixture) {
  return {
    ...group,
    id: testFixture,
  };
}

function getCache(key = apiKey) {
  const encodedApiKey = Buffer.from(`${key}:`).toString('base64');
  const fsSafeApikey = crypto.createHash('md5').update(encodedApiKey).digest('hex');
  const cacheKey = [pkg.name, pkg.version, fsSafeApikey].join('-');

  return flatCache.load(cacheKey, cacheDir);
}

function hydrateCache(lastUpdated) {
  const cache = getCache();

  // Postdate the cache to two days ago so it'll bee seen as stale.
  cache.setKey('lastUpdated', lastUpdated);
  cache.setKey('baseUrl', baseLogUrl);
  cache.save();
}

expect.extend({
  /**
   * Assert that a given response contains the `x-documentation-url` header.
   *
   * @param {Response} res
   * @returns {Object}
   */
  toHaveDocumentationHeader(res) {
    const { matcherHint, printExpected, printReceived } = this.utils;
    const message = (pass, actual) => () => {
      return (
        `${matcherHint(pass ? '.not.toHaveDocumentationHeader' : '.toHaveDocumentationHeader')}\n\n` +
        `Expected response headers to have a ${printExpected('x-documentation-url')} header with a valid UUIDv4 ID.\n` +
        'Received:\n' +
        `\t${printReceived(actual)}`
      );
    };

    let pass;
    if (!('x-documentation-url' in res.headers)) {
      pass = false;
    } else {
      pass = isValidUUIDV4(res.headers['x-documentation-url'].replace(`${baseLogUrl}/logs/`, ''));
    }

    return {
      pass,
      message: message(pass, 'x-documentation-url' in res.headers ? res.headers['x-documentation-url'] : undefined),
    };
  },
});

describe('#metrics', () => {
  let socket;

  beforeEach(() => {
    socket = io('http://localhost:3000');

    socket.on('connect_error', () => {
      throw new Error('Could not connect to the local test server. Is it running?');
    });
  });

  afterEach(() => {
    socket.disconnect();

    // Clean up the cache dir between tests.
    rimraf.sync(cacheDir);
  });

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

  it('should send a request to the metrics server', async done => {
    socket.on('sdk:metrics:assertion', assertion => {
      expect(assertion.error, assertion.reason).toBeUndefined();
      done();
    });

    const app = express();
    app.use(middleware.metrics(apiKey, () => constructGroup('standard')));
    app.get('/test', (req, res) => res.sendStatus(200));

    await request(app)
      .get('/test')
      .expect(200)
      .expect(res => expect(res).toHaveDocumentationHeader());
  });

  describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async done => {
      // Hydrate the cache so we don't need to mess with mocking out the API.
      hydrateCache(Math.round(Date.now() / 1000));

      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const buffersReceived = [];
      socket.on('sdk:metrics:buffer', buffer => {
        buffersReceived.push(buffer);
        if (buffersReceived.length === numberOfMocks) {
          done();
        }
      });

      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('buffered-requests'), { bufferLength }));
      app.get('/test', (req, res) => res.sendStatus(200));

      await Promise.all(
        [...new Array(numberOfLogs).keys()].map(i => {
          return request(app).get(`/test?log=${i}`).expect(200);
        })
      );
    });
  });

  describe('#baseLogUrl', () => {
    it('should not call the API if the baseLogUrl supplied as a middleware option', async done => {
      socket.on('sdk:readme:call', () => {
        throw new Error('ReadMe API should not have been called');
      });

      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('standard'), { baseLogUrl }));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });

    it('should not call the API for project data if the cache is fresh', async done => {
      let readmeCalls = 0;
      let metricsCalls = 0;
      socket.on('sdk:readme:call', () => {
        readmeCalls += 1;
      });

      socket.on('sdk:metrics:assertion', assertion => {
        metricsCalls += 1;
        expect(readmeCalls).toBe(1);
        expect(assertion.error, assertion.reason).toBeUndefined();

        if (metricsCalls === 2) {
          done();
        }
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('standard')));
      app.get('/test', (req, res) => res.sendStatus(200));

      // Cache will be populated with this call as the cache doesn't exist yet.
      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      // Spin up a new app so we're forced to look for the baseUrl in the cache instead of what's saved in-memory
      // within the middleware.
      const app2 = express();
      app2.use(middleware.metrics(apiKey, () => constructGroup('standard')));
      app2.get('/test', (req, res) => res.sendStatus(200));

      // Cache will be hit with this request and shouldn't make another call to the API for data it already has.
      await request(app2)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });

    it('should populate the cache if not present', async done => {
      let readmeCalls = 0;
      socket.on('sdk:readme:call', () => {
        readmeCalls += 1;
      });

      socket.on('sdk:metrics:assertion', assertion => {
        expect(readmeCalls).toBe(1);
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('standard')));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });

    it('should refresh the cache if stale', async done => {
      // Hydate and postdate the cache to two days ago so it'll bee seen as stale.
      hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));

      let readmeCalls = 0;
      socket.on('sdk:readme:call', () => {
        readmeCalls += 1;
      });

      socket.on('sdk:metrics:assertion', assertion => {
        expect(readmeCalls).toBe(1);
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('standard')));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });

    it('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async done => {
      const simmedApiKey = 'apiKeyToSimReadmeBeingDown';

      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(simmedApiKey, () => constructGroup('no-log-url')));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(getCache(simmedApiKey).getKey('baseUrl')).toBeNull();

          // `x-documentation-url` header should not be present since we couldn't get the base URL!
          expect(Object.keys(res.headers)).not.toContain('x-documentation-url');
        });
    });
  });

  describe('`res._body`', () => {
    const responseBody = { a: 1, b: 2, c: 3 };

    it('should buffer up res.write() calls', async done => {
      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('payload-plaintext')));
      app.get('/test', (req, res) => {
        res.write('{"a":1,');
        res.write('"b":2,');
        res.write('"c":3}');
        res.status(200).end();
      });

      await request(app).get('/test').expect(200);
    });

    it('should buffer up res.end() calls', async done => {
      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('payload-plaintext')));
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });

    it('should work for res.send() calls', async done => {
      socket.on('sdk:metrics:assertion', assertion => {
        expect(assertion.error, assertion.reason).toBeUndefined();
        done();
      });

      const app = express();
      app.use(middleware.metrics(apiKey, () => constructGroup('payload-json')));
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());
    });
  });
});
