import * as crypto from 'crypto';
import { createServer } from 'http';

import express from 'express';
import FormData from 'form-data';
import { isValidUUIDV4 } from 'is-valid-uuid-v4';
import multer from 'multer';
import nock from 'nock';
import request from 'supertest';

import pkg from '../package.json';
import * as readmeio from '../src';
import config from '../src/config';

const upload = multer();

const apiKey = 'mockReadMeApiKey';
const incomingGroup = {
  apiKey: '5afa21b97011c63320226ef3',
  label: 'test',
  email: 'test@example.com',
};

const outgoingGroup = {
  id: '5afa21b97011c63320226ef3',
  label: 'test',
  email: 'test@example.com',
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveDocumentationHeader(baseLogUrl: string): R;
    }
  }
}

expect.extend({
  toHaveDocumentationHeader(res, baseLogUrl) {
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
  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw an error if `apiKey` is missing', () => {
    const app = express();
    app.use((req, res, next) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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

  it('should throw an error if `group` is missing', () => {
    const app = express();
    app.use((req, res, next) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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

  it('should send a request to the metrics server', () => {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.group).toStrictEqual(outgoingGroup);
        expect(typeof body.request.log.entries[0].startedDateTime).toBe('string');
        return true;
      })
      .basicAuth({ user: apiKey })
      .reply(200);

    const app = express();
    app.use((req, res, next) => {
      const logId = readmeio.log(apiKey, req, res, incomingGroup);
      res.setHeader('x-log-id', logId);
      return next();
    });
    app.get('/test', (req, res) => res.sendStatus(200));

    return request(app)
      .get('/test')
      .expect(200)
      .expect('x-log-id', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      .then(() => {
        mock.done();
      });
  });

  it('should set `pageref` correctly based on `req.route`', () => {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.request.log.entries[0].pageref).toBe('http://127.0.0.1/test/:id');
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
  it('should set `pageref` without express', () => {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.request.log.entries[0].pageref).toMatch(/http:\/\/127.0.0.1:\d.*\/test\/hello/);
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

  it('express should log the full request url with nested express apps', () => {
    const mock = nock(config.host, {
      reqheaders: {
        'Content-Type': 'application/json',
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .post('/v1/request', ([body]) => {
        expect(body.group).toStrictEqual(outgoingGroup);
        expect(body.request.log.entries[0].request.url).toContain('/test/nested');
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
      // We're asserting `req.url` to be `/nested` here because the way that Express does contextual route loading
      // `req.url` won't include the `/test`. The `/test` is only added later internally in Express with `req.originalUrl`.
      expect(req.url).toBe('/nested');
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

  describe('#timeout', () => {
    it.todo('should silently fail metrics requests if they take longer than the timeout');

    it.todo('should silently fail baseLogUrl requests if they take longer than the timeout');
  });

  describe('#bufferLength', () => {
    it('should send requests when number hits `bufferLength` size', async function test() {
      const baseLogUrl = 'https://docs.example.com';
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
      app.use((req, res, next) => {
        readmeio.log(apiKey, req, res, incomingGroup, { bufferLength: 3, baseLogUrl });
        return next();
      });
      app.get('/test', (req, res) => res.sendStatus(200));

      // We need to make sure that the logId isn't being preserved between buffered requests.
      let logUrl;

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader(baseLogUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
        });

      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
        });

      expect(mock.isDone()).toBe(false);

      await request(app)
        .get('/test')
        .expect(200)
        .expect(res => {
          expect(res).toHaveDocumentationHeader(baseLogUrl);
          expect(res.headers['x-documentation-url']).not.toBe(logUrl);
          logUrl = res.headers['x-documentation-url'];
          expect(logUrl).toBeDefined();
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

  describe('#baseLogUrl', () => {
    it('should set x-documentation-url if `baseLogUrl` is passed', async () => {
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
        .expect(res => expect(res).toHaveDocumentationHeader(baseLogUrl));

      mock.done();
    });
  });

  describe('`res._body`', () => {
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

    it('should buffer up res.write() calls', async () => {
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

    it('should buffer up res.end() calls', async () => {
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

    it('should work for res.send() calls', async () => {
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

  describe('`req.body`', () => {
    function createMock(checkLocation: 'text' | 'params', requestBody: unknown) {
      return nock(config.host, {
        reqheaders: {
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
      })
        .post('/v1/request', ([body]) => {
          expect(body.request.log.entries[0].request.postData[checkLocation]).toBe(requestBody);
          return true;
        })
        .reply(200);
    }

    it('should accept multipart/form-data', async () => {
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
