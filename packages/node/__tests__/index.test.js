/* eslint-disable global-require */
const express = require('express');
const request = require('supertest');
// const nock = require('nock');
const rimraf = require('rimraf');
const crypto = require('crypto');
const flatCache = require('flat-cache');
const findCacheDir = require('find-cache-dir');
const { isValidUUIDV4 } = require('is-valid-uuid-v4');
const io = require('socket.io-client');

// const config = require('../config');
const pkg = require('../package.json');
const middleware = require('..');

/* const harFixtures = {
  standard: require('../../../fixtures/standard.har'),
}; */

const apiKey = 'mockReadMeApiKey';
const group = {
  id: '5afa21b97011c63320226ef3',
  label: 'example user',
  email: 'user@example.com',
};

const baseLogUrl = 'https://docs.example.com';
const cacheDir = findCacheDir({ name: pkg.name });

console.logx = obj => {
  console.log(require('util').inspect(obj, false, null, true /* enable colors */))
}

const asyncWrap = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/* function getReadMeApiMock(numberOfTimes) {
  return nock(config.readmeApiUrl, {
    reqheaders: {
      'User-Agent': `${pkg.name}/${pkg.version}`,
    },
  })
    .get('/v1/')
    .basicAuth({ user: apiKey })
    .times(numberOfTimes)
    .reply(200, { baseUrl: baseLogUrl });
} */

function getCache() {
  const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
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
  /* beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  }); */

  afterEach(() => {
    // nock.cleanAll();

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

  it.only('should send a request to the metrics server', () => {
    const socket = io('http://localhost:3000');
    socket.on('connect', function(){
      console.log('connected')
    });

    socket.on('testResult', function(data){
      console.logx(data);
    });

    socket.on('disconnect', function(){
      console.log('disconnected')
    });

    // const apiMock = getReadMeApiMock(1);
    /* const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', async ([body]) => {
        await toHaveValidPayload(body, 'standard');
      })
      .basicAuth({ user: apiKey })
      .reply(200); */

    const app = express();
    app.use(
      middleware.metrics(
        apiKey,
        () => ({
          ...group,
          id: 'standard',
        }),
        {
          developmentMode: true,
        }
      )
    );
    app.get('/test', (req, res) => res.sendStatus(200));

    return request(app)
      .get('/test')
      .expect(200)
      .expect(res => expect(res).toHaveDocumentationHeader())
      .then(() => {
        // apiMock.done();
        // mock.done();
        socket.disconnect();
      })
      .catch(err => {
        console.log('📮', err)
      });
  });

  /* describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async function test() {
      const apiMock = getReadMeApiMock(1);
      const mock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', body => {
          expect(body).toHaveLength(3);
          return true;
        })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { bufferLength: 3 }));
      app.get('/test', (req, res) => res.sendStatus(200));

      // We need to make sure that the logId isn't being preserved between buffered requests.
      let logUrl;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader();
          logUrl = res.headers['x-documentation-url'];
        });

      expect(apiMock.isDone()).toBe(true);
      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader();
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
          logUrl = res.headers['x-documentation-url'];
        });

      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader();
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
        });

      expect(mock.isDone()).toBe(true);
      apiMock.done();
      mock.done();
    });

    it('should clear out the queue when sent', () => {
      // Hydrate the cache so we don't need to mess with mocking out the API.
      hydrateCache(Math.round(Date.now() / 1000));

      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const seenLogs = [];

      const mocks = [...new Array(numberOfMocks).keys()].map(() =>
        nock(config.host, {
          reqheaders: {
            'Content-Type': 'application/json',
            'User-Agent': `${pkg.name}/${pkg.version}`,
          },
        })
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
  }); */

  /* describe('#baseLogUrl', () => {
    it('should not call the API if the baseLogUrl supplied as a middleware option', async () => {
      const mock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request')
        .basicAuth({ user: apiKey })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group, { baseLogUrl }));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      mock.done();
    });

    it('should not call the API for project data if the cache is fresh', async () => {
      const apiMock = getReadMeApiMock(1);
      const metricsMock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request')
        .basicAuth({ user: apiKey })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.sendStatus(200));

      // Cache will be populated with this call as the cache doesn't exist yet.
      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      // Spin up a new app so we're forced to look for the baseUrl in the cache instead of what's saved in-memory
      // within the middleware.
      const app2 = express();
      app2.use(middleware.metrics(apiKey, () => group));
      app2.get('/test', (req, res) => res.sendStatus(200));

      // Cache will be hit with this request and shouldn't make another call to the API for data it already has.
      await request(app2)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      apiMock.done();
      metricsMock.done();
    });

    it('should populate the cache if not present', async () => {
      const apiMock = getReadMeApiMock(1);
      const metricsMock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request')
        .basicAuth({ user: apiKey })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      apiMock.done();
      metricsMock.done();
    });

    it('should refresh the cache if stale', async () => {
      // Hydate and postdate the cache to two days ago so it'll bee seen as stale.
      hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));

      const apiMock = getReadMeApiMock(1);
      const metricsMock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request')
        .basicAuth({ user: apiKey })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      apiMock.done();
      metricsMock.done();
    });

    it('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async () => {
      const apiMock = nock(config.readmeApiUrl, {
        reqheaders: {
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .get('/v1/')
        .basicAuth({ user: apiKey })
        .reply(401, {
          error: 'APIKEY_NOTFOUNDD',
          message: "We couldn't find your API key",
          suggestion:
            "The API key you passed in (moc··········Key) doesn't match any keys we have in our system. API keys must be passed in as the username part of basic auth. You can get your API key in Configuration > API Key, or in the docs.",
          docs: 'https://docs.readme.com/developers/logs/fake-uuid',
          help: "If you need help, email support@readme.io and mention log 'fake-uuid'.",
        });

      const metricsMock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request')
        .basicAuth({ user: apiKey })
        .reply(200);

      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(getCache().getKey('baseUrl')).toBeNull();

          // `x-documentation-url` header should not be present since we couldn't get the base URL!
          expect(Object.keys(res.headers)).not.toContain('x-documentation-url');
        });

      apiMock.done();
      metricsMock.done();
    });
  }); */

  /* describe('`res._body`', () => {
    let apiMock;
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].response.content.text).toBe(JSON.stringify(responseBody));
          return true;
        })
        .reply(200);
    }

    beforeEach(() => {
      apiMock = getReadMeApiMock(1);
    });

    afterEach(() => {
      apiMock.done();
    });

    it('should buffer up res.write() calls', async () => {
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

    it('should buffer up res.end() calls', async () => {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      mock.done();
    });

    it('should work for res.send() calls', async () => {
      const mock = createMock();
      const app = express();
      app.use(middleware.metrics(apiKey, () => group));
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res).toHaveDocumentationHeader());

      mock.done();
    });
  }); */
});
