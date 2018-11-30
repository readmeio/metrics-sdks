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

    global.API_KEY = '123456';
    global.HOST = `http://127.0.0.1:${server.address().port}`;
    requireTemplate();

    nock('http://example.com')
      .post('/test')
      .reply(200, '', {
        'x-readme-id': id,
        'x-readme-label': label,
      });
    global.listeners.fetch[0](
      new FetchEvent({
        request: new Request('http://example.com/test', {
          method: 'POST',
          body: 'body',
        }),
      }),
    );
  });
});
