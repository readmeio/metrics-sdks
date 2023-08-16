import type { Express } from 'express';

import * as crypto from 'crypto';
import { createServer } from 'http';

import chai, { expect } from 'chai';
import express from 'express';
import FormData from 'form-data';
import multer from 'multer';
import nock from 'nock';
import request from 'supertest';

import pkg from '../package.json';
import * as readmeio from '../src';
import config from '../src/config';
import { getCache } from '../src/lib/get-project-base-url';
import { setBackoff } from '../src/lib/metrics-log';

import chaiPlugins from './helpers/chai-plugins';
import { getReadMeApiMock } from './lib/get-project-base-url.test';

chai.use(chaiPlugins);

const upload = multer();

const apiKey = 'mockReadMeApiKey';
const incomingGroup = {
  apiKey: '5afa21b97011c63320226ef3',
  label: 'test',
  email: 'test@example.com',
};

const outgoingGroup = {
  id: 'sha512-+MnFCkFeabWc/YaeOiMTjE5giOSFEQnar9xWSjm/BSYjNAoDmRQJvSyPZ3mYv0u9orXbfYWBqepmtY0SGBTF1A==?6ef3',
  label: 'test',
  email: 'test@example.com',
};

describe('#metrics', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    const cache = getCache(apiKey);

    cache.setKey('lastUpdated', Date.now());
    cache.setKey('baseUrl', 'https://docs.example.com');
    cache.save();
  });

  afterEach(function () {
    nock.cleanAll();
    getCache(apiKey).destroy();
  });

  it('should throw an error if `apiKey` is missing', function () {
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
    let mock: nock.Scope;
    let metricsServerRequests: number;
    let app: Express;
    let metricsServerResponseCode = 202;

    beforeEach(function () {
      metricsServerRequests = 0;
      mock = nock(config.host, {
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

      app = express();
      app.use((req, res, next) => {
        const logId = readmeio.log(apiKey, req, res, incomingGroup);
        res.setHeader('x-log-id', logId);
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));
    });

    afterEach(function () {
      mock.done();
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
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      expect(metricsServerRequests).to.equal(3);
    });

    it('should stop sending requests to the metrics server after the metrics server returns an error', async function () {
      metricsServerResponseCode = 401;
      for (let i = 0; i < 3; i += 1) {
        await makeRequest(); // eslint-disable-line no-await-in-loop
      }
      // first request goes to the server, server returns a 401, subsequent requests are skipped
      expect(metricsServerRequests).to.equal(1);
    });

    it('should send a request to the metrics server after the backoff time has expired', async function () {
      setBackoff(new Date(2022, 12, 31));
      await makeRequest();
      expect(metricsServerRequests).to.equal(1);
    });
  });

  it('should set `pageref` correctly based on `req.route`', function () {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.request.log.entries[0].pageref).to.equal('http://127.0.0.1/test/:id');
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = express();
    app.use((req, res, next) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      return next();
    });
    app.get('/test/:id', (req, res) => res.sendStatus(200));

    return request(app)
      .get('/test/hello')
      .expect(200)
      .then(() => {
        mock.done();
      });
  });

  // There's a slight inconsistency here between express and non-express.
  // When not in express, pageref contains the port but in express it does not.
  // This is due to us using `req.hostname` to construct the URL vs just
  // req.headers.host which has not been parsed.
  it('should set `pageref` without express', function () {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.request.log.entries[0].pageref).to.match(/http:\/\/127.0.0.1:\d.*\/test\/hello/);
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = createServer((req, res) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      res.statusCode = 200;
      res.end();
    });

    return request(app)
      .get('/test/hello')
      .expect(200)
      .then(() => {
        mock.done();
      });
  });

  it('express should log the full request url with nested express apps', function () {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.group).to.deep.equal(outgoingGroup);
        expect(body.request.log.entries[0].request.url).to.contain('/test/nested');
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = express();
    const appNest = express();

    app.use((req, res, next) => {
      readmeio.log(apiKey, req, res, incomingGroup);
      return next();
    });
    appNest.get('/nested', (req, res) => {
      // We're asserting `req.url` to be `/nested` here because the way that Express does contextual
      // route loading `req.url` won't include the `/test`. The `/test` is only added later
      // internally in Express with `req.originalUrl`.
      expect(req.url).to.equal('/nested');
      res.sendStatus(200);
    });

    app.use('/test', appNest);

    return request(app)
      .get('/test/nested')
      .expect(200)
      .then(() => {
        mock.done();
      });
  });

  describe('#timeout', function () {
    // eslint-disable-next-line mocha/no-pending-tests, mocha/no-skipped-tests
    it.skip('should silently fail metrics requests if they take longer than the timeout');

    // eslint-disable-next-line mocha/no-pending-tests, mocha/no-skipped-tests
    it.skip('should silently fail baseLogUrl requests if they take longer than the timeout');
  });

  describe('#bufferLength', function () {
    it('should send requests when number hits `bufferLength` size', async function test() {
      const baseLogUrl = 'https://docs.example.com';
      const mock = nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', body => {
          expect(body).to.have.lengthOf(3);
          return true;
        })
        .reply(200);

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

      expect(mock.isDone()).to.be.false;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.to.equal(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).not.to.be.undefined;
        });

      expect(mock.isDone()).to.be.false;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.to.equal(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).not.to.be.undefined;
        });

      expect(mock.isDone()).to.be.true;
      mock.done();
    });

    it('should clear out the queue when sent', function () {
      const numberOfLogs = 20;
      const numberOfMocks = 4;
      const bufferLength = numberOfLogs / numberOfMocks;

      const seenLogs: string[] = [];

      const mocks = [...new Array(numberOfMocks).keys()].map(() =>
        nock(config.host, {
          reqheaders: {
            'Content-Type': 'application/json',
            'User-Agent': `${pkg.name}/${pkg.version}`,
          },
        })
          .post('/v1/request', body => {
            expect(body).to.have.lengthOf(bufferLength);

            // Ensure that our executed requests and the buffered queue they're in remain unique.
            body.forEach((req: unknown) => {
              const requestHash = crypto.createHash('md5').update(JSON.stringify(req)).digest('hex');
              expect(seenLogs).not.to.contain(requestHash);
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
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { bufferLength });
        return next();
      });
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

  describe('#baseLogUrl', function () {
    it('should fetch the `baseLogUrl` if not passed', async function () {
      // Invalidating the cache so we do a fetch from the API
      const cache = getCache(apiKey);
      const lastUpdated = new Date();
      lastUpdated.setDate(lastUpdated.getDate() - 2);
      cache.setKey('lastUpdated', lastUpdated.getTime());
      cache.save();

      const baseLogUrl = 'https://docs.example.com';

      const apiMock = getReadMeApiMock(1, baseLogUrl);
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

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res.headers).to.have.a.documentationHeader(baseLogUrl);
        });

      apiMock.done();
      mock.done();
    });

    it('should set x-documentation-url if `baseLogUrl` is passed', async function () {
      const baseLogUrl = 'https://docs.example.com';

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
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { baseLogUrl });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => expect(res.headers).to.have.a.documentationHeader(baseLogUrl));

      mock.done();
    });
  });

  describe('`res._body`', function () {
    const responseBody = { a: 1, b: 2, c: 3 };
    function createMock() {
      return nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].response.content.text).to.equal(JSON.stringify(responseBody));
          return true;
        })
        .reply(200);
    }

    it('should buffer up res.write() calls', async function () {
      const mock = createMock();
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

      await request(app).get('/test').expect(200);

      mock.done();
    });

    it('should buffer up res.end() calls', async function () {
      const mock = createMock();
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => res.end(JSON.stringify(responseBody)));

      await request(app).get('/test').expect(200);

      mock.done();
    });

    it('should work for res.send() calls', async function () {
      const mock = createMock();
      const app = express();
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.get('/test', (req, res) => res.send(responseBody));

      await request(app).get('/test').expect(200);

      mock.done();
    });
  });

  describe('`req.body`', function () {
    function createMock(checkLocation: 'text' | 'params', requestBody: unknown) {
      return nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].request.postData[checkLocation]).to.equal(requestBody);
          return true;
        })
        .reply(200);
    }

    it('should accept multipart/form-data', async function () {
      const form = new FormData();
      form.append('password', '123456');
      form.append('apiKey', 'abc');
      form.append('another', 'Hello world');

      // If the request body for a multipart/form-data request comes in as an object (as it does with the express
      // middleware) we expect it to be recorded json encoded
      const mock = createMock('text', JSON.stringify({ password: '123456', apiKey: 'abc', another: 'Hello world' }));
      const app = express();
      app.use(upload.none());
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup);
        return next();
      });
      app.post('/test', (req, res) => {
        res.status(200).end();
      });

      await request(app).post('/test').set(form.getHeaders()).send(form.getBuffer().toString()).expect(200);

      mock.done();
    });
  });
});
