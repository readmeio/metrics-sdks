import type { OutgoingLogBody } from '../src/lib/metrics-log';
import type { Express } from 'express';
import type { Headers } from 'headers-polyfill';

import * as crypto from 'crypto';
import { createServer } from 'http';

import chai, { expect } from 'chai';
import chaiAssertionsCount from 'chai-assertions-count';
import express from 'express';
import FormData from 'form-data';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import multer from 'multer';
import request from 'supertest';

import pkg from '../package.json';
import * as readmeio from '../src';
import config from '../src/config';
import { getCache } from '../src/lib/get-project-base-url';
import { setBackoff } from '../src/lib/metrics-log';

import chaiPlugins from './helpers/chai-plugins';
import getReadMeApiMock from './helpers/getReadMeApiMock';

chai.use(chaiPlugins);
chai.use(chaiAssertionsCount);

const upload = multer();

const apiKey = 'mockReadMeApiKey';
const endUserApiKey = '5afa21b97011c63320226ef3';
const incomingGroup = {
  apiKey: endUserApiKey,
  label: 'test',
  email: 'test@example.com',
};

const outgoingGroup = {
  id: 'sha512-+MnFCkFeabWc/YaeOiMTjE5giOSFEQnar9xWSjm/BSYjNAoDmRQJvSyPZ3mYv0u9orXbfYWBqepmtY0SGBTF1A==?6ef3',
  label: 'test',
  email: 'test@example.com',
};

const baseLogUrl = 'https://docs.example.com';

const server = setupServer(
  ...[
    // allow any localhost requests
    rest.all(/^http:\/\/127.0.0.1/, req => {
      return req.passthrough();
    }),
    getReadMeApiMock(baseLogUrl),
  ]
);

function doMetricsHeadersMatch(headers: Headers) {
  const auth = headers.get('authorization');
  const decodedAuth = Buffer.from(auth.replace(/^Basic /, ''), 'base64').toString('ascii');
  const contentType = headers.get('content-type');
  const userAgent = headers.get('user-agent');
  return (
    decodedAuth === `${apiKey}:` && contentType === 'application/json' && userAgent === `${pkg.name}/${pkg.version}`
  );
}

describe('#metrics', function () {
  beforeEach(function () {
    server.listen();
    const cache = getCache(apiKey);

    cache.setKey('lastUpdated', Date.now());
    cache.setKey('baseUrl', 'https://docs.example.com');
    cache.save();
    chai.Assertion.resetAssertsCheck();
  });

  //  Close server after all tests
  after(function () {
    server.close();
  });

  afterEach(function () {
    server.resetHandlers();
    getCache(apiKey).destroy();
    chai.Assertion.checkExpectsCount();
  });

  it('should throw an error if `apiKey` is missing', function () {
    chai.Assertion.expectExpects(1);
    const app = express();
    app.use((req, res, next) => {
      // @ts-expect-error deliberately passing in bad data
      readmeio.log('', req, res, {});
      return next();
    });
    app.get('/test', (req, res) => res.sendStatus(200));

    // This silences console.errors from default express errorhandler
    app.set('env', 'test');

    return request(app)
      .get('/test')
      .expect(500)
      .then(res => {
        expect(res.text).to.match(/Error: You must provide your ReadMe API key/);
      });
  });

  it('should throw an error if `group` is missing', function () {
    chai.Assertion.expectExpects(1);
    const app = express();
    app.use((req, res, next) => {
      // @ts-expect-error deliberately passing in bad data
      readmeio.log(apiKey, req, res);
      return next();
    });
    app.get('/test', (req, res) => res.sendStatus(200));

    // This silences console.errors from default express errorhandler
    app.set('env', 'test');

    return request(app)
      .get('/test')
      .expect(500)
      .then(res => {
        expect(res.text).to.match(/Error: You must provide a group/);
      });
  });

  describe('tests for sending requests to the metrics server', function () {
    let metricsServerRequests: number;
    let app: Express;
    let metricsServerResponseCode = 202;

    beforeEach(function () {
      metricsServerRequests = 0;
      server.use(
        rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
          const body: OutgoingLogBody[] = await req.json();
          if (doMetricsHeadersMatch(req.headers)) {
            metricsServerRequests += 1;
            expect(body[0]._version).to.equal(3);
            expect(body[0].group).to.deep.equal(outgoingGroup);
            expect(typeof body[0].request.log.entries[0].startedDateTime).to.equal('string');
            return res(ctx.status(metricsServerResponseCode), ctx.text(''));
          }

          return res(ctx.status(500));
        })
      );

      app = express();
      app.use((req, res, next) => {
        const logId = readmeio.log(apiKey, req, res, incomingGroup);
        res.setHeader('x-log-id', logId);
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));
    });

    afterEach(function () {
      setBackoff(undefined);
      metricsServerResponseCode = 202;
    });

    function makeRequest() {
      return request(app)
        .get('/test')
        .expect(200)
        .expect('x-log-id', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    }

    it('should send requests to the metrics server', async function () {
      chai.Assertion.expectExpects(10);
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(3);
    });

    it('should stop sending requests to the metrics server after the metrics server returns an error', async function () {
      chai.Assertion.expectExpects(4);
      metricsServerResponseCode = 401;
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      // first request goes to the server, server returns a 401, subsequent requests are skipped
      expect(metricsServerRequests).to.equal(1);
    });

    it('should send a request to the metrics server after the backoff time has expired', async function () {
      chai.Assertion.expectExpects(4);
      setBackoff(new Date(2022, 12, 31));
      await makeRequest();
      expect(metricsServerRequests).to.equal(1);
    });
  });

  describe('unified snippet tests', function () {
    let metricsMock: nock.Scope;
    let readmeApiNock: nock.Scope;
    let metricsServerRequests: number;
    let app: Express;
    let metricsServerResponseCode = 202;

    beforeEach(function () {
      metricsServerRequests = 0;
      metricsMock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', ([body]) => {
          metricsServerRequests += 1;
          expect(body._version).to.equal(3);
          expect(body.group).to.deep.equal(outgoingGroup);
          expect(typeof body.request.log.entries[0].startedDateTime).to.equal('string');
          return true;
        })
        .basicAuth({ user: apiKey })
        .reply(() => {
          return [metricsServerResponseCode, ''];
        })
        .persist();

      readmeApiNock = nock('https://dash.readme.com').get('/api/v1/').reply(200, {
        jwtSecret: '123',
        subdomain: 'subdomain',
      });

      readmeio.auth(apiKey);
      app = express();
      app.use(
        readmeio.readme(() => {
          return {
            keys: [{ apiKey: endUserApiKey, name: 'test' }],
            name: 'First Last',
            email: 'test@example.com',
          };
        })
      );
      app.get('/test', (req, res) => {
        return res.sendStatus(200);
      });
    });

    afterEach(function () {
      readmeApiNock.done();
      setBackoff(undefined);
      metricsServerResponseCode = 202;
    });

    function makeRequest(query = '') {
      return request(app).get(`/test${query}`).expect(200);
    }

    it('should send requests to the metrics server', async function () {
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(`?api_key=${endUserApiKey}`); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(3);
      metricsMock.done();
    });

    it('should send not requests to the metrics server if no api key is included', async function () {
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(0);
    });
  });

  it('should set `pageref` correctly based on `req.route`', function () {
    chai.Assertion.expectExpects(1);
    server.use(
      rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
        const body: OutgoingLogBody[] = await req.json();
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].request.log.entries[0].pageref).to.equal('http://127.0.0.1/test/:id');
          return res(ctx.status(200));
        }

        return res(ctx.status(500));
      })
    );

    const app = express();
    app.use((req, res, next) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      return next();
    });
    app.get('/test/:id', (req, res) => res.sendStatus(200));

    return request(app).get('/test/hello').expect(200);
  });

  // There's a slight inconsistency here between express and non-express.
  // When not in express, pageref contains the port but in express it does not.
  // This is due to us using `req.hostname` to construct the URL vs just
  // req.headers.host which has not been parsed.
  it('should set `pageref` without express', function () {
    chai.Assertion.expectExpects(1);
    server.use(
      rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
        const body: OutgoingLogBody[] = await req.json();
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].request.log.entries[0].pageref).to.match(/^http:\/\/127.0.0.1:\d.*\/test\/hello/);
          return res(ctx.status(200));
        }

        return res(ctx.status(500));
      })
    );

    const app = createServer((req, res) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      res.statusCode = 200;
      res.end();
    });

    return request(app).get('/test/hello').expect(200);
  });

  it('express should log the full request url with nested express apps', function () {
    chai.Assertion.expectExpects(3);
    server.use(
      rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
        const body: OutgoingLogBody[] = await req.json();
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].group).to.deep.equal(outgoingGroup);
          expect(body[0].request.log.entries[0].request.url).to.contain('/test/nested');
          return res(ctx.status(200));
        }

        return res(ctx.status(500));
      })
    );

    const app = express();
    const appNest = express();

    app.use((req, res, next) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      return next();
    });
    appNest.get('/nested', (req, res) => {
      // We're asserting `req.url` to be `/nested` here because the way that Express does contextual
      // route loading `req.url` won't include the `/test`. The `/test` is merely added later
      // internally in Express with `req.originalUrl`.
      expect(req.url).to.equal('/nested');
      res.sendStatus(200);
    });

    app.use('/test', appNest);

    return request(app).get('/test/nested').expect(200);
  });

  describe('#timeout', function () {
    // eslint-disable-next-line mocha/no-pending-tests, mocha/no-skipped-tests
    it.skip('should silently fail metrics requests if they take longer than the timeout');

    // eslint-disable-next-line mocha/no-pending-tests, mocha/no-skipped-tests
    it.skip('should silently fail baseLogUrl requests if they take longer than the timeout');
  });

  describe('#bufferLength', function () {
    it('should send requests when number hits `bufferLength` size', async function test() {
      chai.Assertion.expectExpects(9);
      server.use(
        rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
          const body: OutgoingLogBody[] = await req.json();
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body).to.have.lengthOf(3);
            return res(ctx.status(200));
          }

          return res(ctx.status(500));
        })
      );

      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { bufferLength: 3, baseLogUrl });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      // We need to make sure that the logId isn't being preserved between buffered requests.
      let logUrl: string;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).not.to.be.undefined;
        });

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.to.equal(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).not.to.be.undefined;
        });

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.to.equal(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).not.to.be.undefined;
        });
    });

    it('should clear out the queue when sent', function () {
      chai.Assertion.expectExpects(24);
      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const seenLogs: string[] = [];

      server.use(
        rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
          const body: OutgoingLogBody[] = await req.json();
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body).to.have.lengthOf(bufferLength);

            // Ensure that our executed requests and the buffered queue they're in remain unique.
            body.forEach((log: unknown) => {
              const requestHash = crypto.createHash('md5').update(JSON.stringify(log)).digest('hex');
              expect(seenLogs).not.to.contain(requestHash);
              seenLogs.push(requestHash);
            });

            return res(ctx.status(200), ctx.delay(1000));
          }

          return res(ctx.status(500));
        })
      );

      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { bufferLength });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      return Promise.all(
        [...new Array(numberOfLogs).keys()].map(i => {
          return request(app).get(`/test?log=${i}`).expect(200);
        })
      );
    });
  });

  describe('#baseLogUrl', function () {
    beforeEach(function () {
      server.use(
        rest.post(`${config.host}/v1/request`, (req, res, ctx) => {
          if (doMetricsHeadersMatch(req.headers)) {
            return res(ctx.status(200));
          }

          return res(ctx.status(500));
        })
      );
    });

    it('should fetch the `baseLogUrl` if not passed', function () {
      chai.Assertion.expectExpects(1);
      // Invalidating the cache so we do a fetch from the API
      const cache = getCache(apiKey);
      const lastUpdated = new Date();
      lastUpdated.setDate(lastUpdated.getDate() - 2);
      cache.setKey('lastUpdated', lastUpdated.getTime());
      cache.save();

      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => {
        // We have to delay the response here so that the request to fetch
        // the base url has a chance to resolve. We may have to figure out
        // a better way to do this in future
        return setTimeout(() => {
          res.sendStatus(200);
        }, 50);
      });

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
        });
    });

    it('should set x-documentation-url if `baseLogUrl` is passed', function () {
      chai.Assertion.expectExpects(1);
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { baseLogUrl });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res.headers).to.have.a.documentationHeader(baseLogUrl));
    });
  });

  describe('`res._body`', function () {
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return server.use(
        rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
          const body: OutgoingLogBody[] = await req.json();
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body[0].request.log.entries[0].response.content.text).to.equal(JSON.stringify(responseBody));
            return res(ctx.status(200));
          }

          return res(ctx.status(500));
        })
      );
    }

    it('should buffer up res.write() calls', function () {
      chai.Assertion.expectExpects(1);
      createMock();
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => {
        res.write('{"a":1,');
        res.write('"b":2,');
        res.write('"c":3}');
        res.status(200).end();
      });

      return request(app).get('/test').expect(200);
    });

    it('should buffer up res.end() calls', function () {
      chai.Assertion.expectExpects(1);
      createMock();
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      return request(app).get('/test').expect(200);
    });

    it('should work for res.send() calls', function () {
      chai.Assertion.expectExpects(1);
      createMock();
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => res.send(responseBody));

      return request(app).get('/test').expect(200);
    });
  });

  describe('`req.body`', function () {
    function createMock(checkLocation: 'text' | 'params', requestBody: unknown) {
      return server.use(
        rest.post(`${config.host}/v1/request`, async (req, res, ctx) => {
          const body: OutgoingLogBody[] = await req.json();
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body[0].request.log.entries[0].request.postData[checkLocation]).to.equal(requestBody);
            return res(ctx.status(200));
          }

          return res(ctx.status(500));
        })
      );
    }

    it('should accept multipart/form-data', function () {
      chai.Assertion.expectExpects(1);
      const form = new FormData();
      form.append('password', '123456');
      form.append('apiKey', 'abc');
      form.append('another', 'Hello world');

      // If the request body for a multipart/form-data request comes in as an object (as it does with the express
      // middleware) we expect it to be recorded json encoded
      createMock('text', JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }));
      const app = express();
      app.use(upload.none());
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.post('/test', (req, res) => {
        res.status(200).end();
      });

      return request(app).post('/test').set(form.getHeaders()).send(form.getBuffer().toString()).expect(200);
    });
  });
});
