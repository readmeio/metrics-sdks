/* eslint-env mocha */
const { join } = require('path');
const http = require('http');
const assert = require('assert');
const nock = require('nock');

// Have to set this up here because this is normally done from within webpack
// We could use compile() in this test and eval() the output
// but then we lose all stack traces from the errors
require('module-alias').addAlias('@readme/cloudflare-worker', join(__dirname, '..', 'index.js'));

const globals = require('./service-worker-globals');

function requireTemplate() {
  delete require.cache[require.resolve('../template.js')];
  delete require.cache[require.resolve('@readme/cloudflare-worker')];
  require('../template'); // eslint-disable-line global-require
}

class FetchEvent {
  constructor({ request }) {
    this.request = request;
    this.passThroughOnException = () => {};
    this.respondWith = () => {};
    this.waitUntil = () => {};
  }
}

describe('template', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  beforeEach(() => {
    Object.assign(global, globals());
  });

  afterEach(() => {
    delete global.HOST;
  });

  it('should send x-readme-* headers through to metrics backend', done => {
    const id = 123456;
    const label = 'api-key-label';
    const server = http
      .createServer((req, res) => {
        console.log(req);
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          body = JSON.parse(body);
          assert.equal(body[0].group.id, id);
          assert.equal(body[0].group.label, label);
          res.end();
          server.close();
          return done();
        });
      })
      .listen(0);

    global.HOST = `http://127.0.0.1:${server.address().port}`;
    global.INSTALL_OPTIONS = {
      API_KEY: '123456',
      ROUTES: ['http://example.com/*', 'http://*.example.com/test'],
    };

    requireTemplate();
    nock('http://www.example.com')
      .post('/test')
      .reply(200, '', {
        'x-readme-id': id,
        'x-readme-label': label,
      });

    global.listeners.fetch[0](
      new FetchEvent({
        request: new Request('http://www.example.com/test', {
          method: 'POST',
          body: 'body',
        }),
      }),
    );
  });

  it('should passthrough if domain routing does not match existing routes', done => {
    const server = http
      .createServer((req, res) => {
        let body = '';

        req.on('data', chunk => {
          body += chunk;
        });

        req.on('error', () => done());

        req.on('end', () => {
          assert.equal(body, null);
          res.end();
          server.close();
          return done();
        });
      })
      .listen(0);

    global.HOST = `http://127.0.0.1:${server.address().port}`;
    global.INSTALL_OPTIONS = {
      API_KEY: '123456',
      ROUTES: ['http://www.example.com/docs'],
    };

    requireTemplate();
    nock('http://www.example.com')
      .get('/test')
      .reply(200);

    global.listeners.fetch[0](
      new FetchEvent({
        request: new Request('http://www.example.com/test', {
          method: 'GET',
        }),
      }),
    );
  });
});
