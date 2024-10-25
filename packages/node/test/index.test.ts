/* eslint-disable vitest/no-conditional-expect */
/* eslint-disable vitest/no-standalone-expect */
import type { OutgoingLogBody } from '../src/lib/metrics-log';
import type { Express } from 'express';

import * as crypto from 'crypto';
import { createServer } from 'http';

import express from 'express';
import { delay, http, HttpResponse, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import { describe, afterAll, beforeEach, afterEach, expect, it } from 'vitest';

import pkg from '../package.json';
import * as readmeio from '../src';
import config from '../src/config';
import { getCache, cache } from '../src/lib/get-project-base-url';
import { setBackoff } from '../src/lib/metrics-log';

import getReadMeApiMock from './helpers/getReadMeApiMock';
import { MockLoggerStrategy } from './lib/logger.test';

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
    http.all(/^http:\/\/127.0.0.1/, () => {
      return passthrough();
    }),
    getReadMeApiMock(baseLogUrl),
  ],
);

function doMetricsHeadersMatch(headers: Headers) {
  const auth = headers.get('authorization');
  const decodedAuth = Buffer.from((auth || '').replace(/^Basic /, ''), 'base64').toString('ascii');
  const contentType = headers.get('content-type');
  const userAgent = headers.get('user-agent');
  return (
    decodedAuth === `${apiKey}:` && contentType === 'application/json' && userAgent === `${pkg.name}/${pkg.version}`
  );
}

describe('#metrics', function () {
  beforeEach(function () {
    server.listen();
    getCache(apiKey);

    cache.setKey('lastUpdated', Date.now());
    cache.setKey('baseUrl', 'https://docs.example.com');
    cache.save();
  });

  afterEach(function () {
    server.resetHandlers();
    cache.destroy();
  });

  // Close server after all tests
  afterAll(function () {
    server.close();
  });

  it('should throw an error if `apiKey` is missing', function () {
    expect.assertions(1);
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
        expect(res.text).toMatch(/Error: You must provide your ReadMe API key/);
      });
  });

  it('should throw an error if `group` is missing', function () {
    expect.assertions(1);
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
        expect(res.text).toMatch(/Error: You must provide a group/);
      });
  });

  describe('tests for sending requests to the metrics server', function () {
    let metricsServerRequests: number;
    let app: Express;
    let metricsServerResponseCode: number;
    const mockLogger = new MockLoggerStrategy();

    beforeEach(function () {
      metricsServerRequests = 0;
      metricsServerResponseCode = 202;
      server.use(
        http.post(`${config.host}/v1/request`, async ({ request: req }) => {
          const body = (await req.json()) as OutgoingLogBody[];
          if (doMetricsHeadersMatch(req.headers)) {
            metricsServerRequests += 1;
            expect(body[0]._version).toBe(3);
            expect(body[0].group).toStrictEqual(outgoingGroup);
            expect(typeof body[0].request.log.entries[0].startedDateTime).toBe('string');
            return new HttpResponse('', { status: metricsServerResponseCode });
          }

          return new HttpResponse(null, { status: 500 });
        }),
      );

      app = express();
      app.use((req, res, next) => {
        const logId = readmeio.log(apiKey, req, res, incomingGroup, { logger: mockLogger });
        res.setHeader('x-log-id', logId!);
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
      expect.assertions(10);
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).toBe(3);
    });

    it('should stop sending requests to the metrics server after the metrics server returns an error', async function () {
      expect.assertions(4);
      metricsServerResponseCode = 401;
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      // first request goes to the server, server returns a 401, subsequent requests are skipped
      expect(metricsServerRequests).toBe(1);
    });

    it('should log response status after the metrics server responds', async function () {
      metricsServerResponseCode = 202;
      await makeRequest();
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: expect.stringContaining(`Service responded with status ${metricsServerResponseCode}`),
      });
    });

    it('should log error response status after the metrics server returns an error', async function () {
      metricsServerResponseCode = 401;
      await makeRequest();
      expect(mockLogger.error).toHaveBeenCalledWith({
        message: expect.stringContaining(`Service responded with status ${metricsServerResponseCode}`),
      });
    });

    it('should send a request to the metrics server after the backoff time has expired', async function () {
      expect.assertions(4);
      setBackoff(new Date(2022, 12, 31));
      await makeRequest();
      expect(metricsServerRequests).toBe(1);
    });
  });

  describe('unified snippet tests', function () {
    let metricsServerRequests: number;
    let app: Express;
    let metricsServerResponseCode: number;

    beforeEach(function () {
      metricsServerRequests = 0;
      metricsServerResponseCode = 202;
      server.use(
        ...[
          http.post(`${config.host}/v1/request`, async ({ request: req }) => {
            const body = (await req.json()) as OutgoingLogBody[];
            if (doMetricsHeadersMatch(req.headers)) {
              metricsServerRequests += 1;
              expect(body[0]._version).to.equal(3);
              expect(body[0].group).to.deep.equal(outgoingGroup);
              expect(typeof body[0].request.log.entries[0].startedDateTime).to.equal('string');
              return new HttpResponse('', { status: metricsServerResponseCode });
            }

            return new HttpResponse(null, { status: 500 });
          }),
          http.get(`${config.readmeApiUrl}/v1`, () => {
            return HttpResponse.json(
              {
                jwtSecret: '123',
                subdomain: 'subdomain',
              },
              { status: 200 },
            );
          }),
          http.get(`${config.readmeApiUrl}/v1/version`, () => {
            return HttpResponse.json(
              [
                {
                  version: '1.0',
                  subdomain: 'subdomain',
                },
              ],
              { status: 200 },
            );
          }),
        ],
      );

      const readme = new readmeio.ReadMe(apiKey);
      app = express();
      app.use(
        readme.express((req, getUser) => {
          return getUser({
            byAPIKey: (requestApiKey: string) => {
              // TODO should we be calling this if the requestApiKey is undefined?
              if (!requestApiKey) {
                return undefined;
              }

              return Promise.resolve({
                keys: [{ apiKey: requestApiKey, name: 'test' }],
                name: 'test',
                email: 'test@example.com',
              });
            },
            byEmail: (email: string) => {
              if (!email) {
                return undefined;
              }

              return Promise.resolve({
                keys: [{ apiKey: endUserApiKey, name: 'test' }],
                name: 'test',
                email: 'test@example.com',
              });
            },
          });
        }),
      );
      app.get('/test', (req, res) => {
        return res.sendStatus(200);
      });
    });

    afterEach(function () {
      setBackoff(undefined);
      metricsServerResponseCode = 202;
    });

    function makeRequest(query = '') {
      return request(app).get(`/test${query}`).expect(200);
    }

    it('should send requests to the metrics server', async function () {
      expect.assertions(10);
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(`?api_key=${endUserApiKey}`); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(3);
    });

    it('should send not requests to the metrics server if no api key is included', async function () {
      expect.assertions(1);
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(0);
    });

    it('should not persist the api key between requests', async function () {
      // Four since we have assertions in the beforeEach for each request
      // the one without the key will fail on the first assertion
      expect.assertions(4);

      await makeRequest(`?api_key=${endUserApiKey}`);
      await makeRequest();
      expect(metricsServerRequests).to.equal(1);
    });
  });

  it('should set `pageref` correctly based on `req.route`', function () {
    expect.assertions(1);
    server.use(
      http.post(`${config.host}/v1/request`, async ({ request: req }) => {
        const body = (await req.json()) as OutgoingLogBody[];
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].request.log.entries[0].pageref).toBe('http://127.0.0.1/test/:id');
          return new HttpResponse(null, { status: 200 });
        }

        return new HttpResponse(null, { status: 500 });
      }),
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
    expect.assertions(1);
    server.use(
      http.post(`${config.host}/v1/request`, async ({ request: req }) => {
        const body = (await req.json()) as OutgoingLogBody[];
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].request.log.entries[0].pageref).toMatch(/^http:\/\/127.0.0.1:\d.*\/test\/hello/);
          return new HttpResponse(null, { status: 200 });
        }

        return new HttpResponse(null, { status: 500 });
      }),
    );

    const app = createServer((req, res) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      res.statusCode = 200;
      res.end();
    });

    return request(app).get('/test/hello').expect(200);
  });

  it('express should log the full request url with nested express apps', function () {
    expect.assertions(3);
    server.use(
      http.post(`${config.host}/v1/request`, async ({ request: req }) => {
        const body = (await req.json()) as OutgoingLogBody[];
        if (doMetricsHeadersMatch(req.headers)) {
          expect(body[0].group).toStrictEqual(outgoingGroup);
          expect(body[0].request.log.entries[0].request.url).toContain('/test/nested');
          return new HttpResponse(null, { status: 200 });
        }

        return new HttpResponse(null, { status: 500 });
      }),
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
      expect(req.url).toBe('/nested');
      res.sendStatus(200);
    });

    app.use('/test', appNest);

    return request(app).get('/test/nested').expect(200);
  });

  describe('#timeout', function () {
    it.todo('should silently fail metrics requests if they take longer than the timeout');

    it.todo('should silently fail baseLogUrl requests if they take longer than the timeout');
  });

  describe('#bufferLength', function () {
    it('should send requests when number hits `bufferLength` size', async function test() {
      expect.assertions(9);
      server.use(
        http.post(`${config.host}/v1/request`, async ({ request: req }) => {
          const body = (await req.json()) as OutgoingLogBody[];
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body).toHaveLength(3);
            return new HttpResponse(null, { status: 200 });
          }

          return new HttpResponse(null, { status: 500 });
        }),
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
          expect(res.headers).toHaveADocumentationHeader(baseLogUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
        });

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).toHaveADocumentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
        });

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).toHaveADocumentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
        });
    });

    it('should clear out the queue when sent', function () {
      expect.assertions(24);
      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const seenLogs: string[] = [];

      server.use(
        http.post(`${config.host}/v1/request`, async ({ request: req }) => {
          const body = (await req.json()) as OutgoingLogBody[];
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body).toHaveLength(bufferLength);

            // Ensure that our executed requests and the buffered queue they're in remain unique.
            body.forEach((log: unknown) => {
              const requestHash = crypto.createHash('md5').update(JSON.stringify(log)).digest('hex');
              expect(seenLogs).not.toContain(requestHash);
              seenLogs.push(requestHash);
            });

            await delay(1000);

            return new HttpResponse(null, { status: 200 });
          }

          return new HttpResponse(null, { status: 500 });
        }),
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
        }),
      );
    });
  });

  describe('#baseLogUrl', function () {
    beforeEach(function () {
      server.use(
        http.post(`${config.host}/v1/request`, ({ request: req }) => {
          if (doMetricsHeadersMatch(req.headers)) {
            return new HttpResponse(null, { status: 200 });
          }

          return new HttpResponse(null, { status: 500 });
        }),
      );
    });

    it('should fetch the `baseLogUrl` if not passed', function () {
      expect.assertions(1);
      // Invalidating the cache so we do a fetch from the API
      getCache(apiKey);
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
        return setTimeout(function () {
          res.sendStatus(200);
        }, 50);
      });

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).toHaveADocumentationHeader(baseLogUrl);
        });
    });

    it('should set x-documentation-url if `baseLogUrl` is passed', function () {
      expect.assertions(1);
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { baseLogUrl });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      return request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res.headers).toHaveADocumentationHeader(baseLogUrl));
    });
  });

  describe('`res._body`', function () {
    const responseBody = { a: 1, b: 2, c: 3 };

    function createMock() {
      return server.use(
        http.post(`${config.host}/v1/request`, async ({ request: req }) => {
          const body = (await req.json()) as OutgoingLogBody[];
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body[0].request.log.entries[0].response.content.text).toStrictEqual(JSON.stringify(responseBody));
            return new HttpResponse(null, { status: 200 });
          }

          return new HttpResponse(null, { status: 500 });
        }),
      );
    }

    it('should buffer up res.write() calls', function () {
      expect.assertions(1);
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
      expect.assertions(1);
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
      expect.assertions(1);
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
    function createMock(checkLocation: 'params' | 'text', requestBody: unknown) {
      return server.use(
        http.post(`${config.host}/v1/request`, async ({ request: req }) => {
          const body = (await req.json()) as OutgoingLogBody[];
          if (doMetricsHeadersMatch(req.headers)) {
            expect(body[0].request.log.entries[0].request.postData?.[checkLocation]).toStrictEqual(requestBody);
            return new HttpResponse(null, { status: 200 });
          }

          return new HttpResponse(null, { status: 500 });
        }),
      );
    }

    it('should accept multipart/form-data', function () {
      expect.assertions(1);

      // If the request body for a multipart/form-data request comes in as an object (as it does with the express
      // middleware) we expect it to be recorded json encoded
      createMock('text', JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }));
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.post('/test', (req, res) => {
        res.status(200).end();
      });

      return request(app)
        .post('/test')
        .field('password', '123456')
        .field('apiKey', 'abc')
        .field('another', 'Hello world')
        .expect(200);
    });
  });
});
