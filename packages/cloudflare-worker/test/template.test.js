import http from 'http';

import nock from 'nock';
import { describe, beforeAll, afterAll, beforeEach, afterEach, expect, it } from 'vitest';

import globals from './service-worker-globals';

function requireTemplate() {
  delete require.cache[require.resolve('../src/template.js')];
  delete require.cache[require.resolve('@readme/cloudflare-worker')];
  require('../src/template'); // eslint-disable-line global-require
}

class FetchEvent {
  constructor({ request }) {
    this.request = request;
    this.passThroughOnException = () => {};
    this.respondWith = () => {};
    this.waitUntil = () => {};
  }
}

// This test is really flaky with how it tries to load the `template` file that loads
// `@readme/cloudflare-worker`. There's got to be a cleaner way to do this.
// eslint-disable-next-line vitest/no-disabled-tests
describe.skip('template', function () {
  beforeAll(function () {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  beforeEach(function () {
    Object.assign(global, globals());
  });

  afterEach(function () {
    delete global.HOST;
  });

  afterAll(function () {
    return nock.cleanAll();
  });

  // eslint-disable-next-line vitest/no-done-callback
  it('should send x-readme-* headers through to metrics backend', function (done) {
    const id = 123456;
    const label = 'api-key-label';
    const email = 'test@readme.io';
    const server = http
      .createServer((req, res) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          body = JSON.parse(body);
          expect(body[0].group.id).to.equal(String(id));
          expect(body[0].group.label).to.equal(label);
          expect(body[0].group.email).to.equal(email);
          res.end();
          server.close();
          return done();
        });
      })
      .listen(0);

    global.HOST = `http://127.0.0.1:${server.address().port}`;
    global.INSTALL_OPTIONS = {
      routes: ['http://example.com/*', 'http://*.example.com/test'],
    };

    requireTemplate();
    nock('http://www.example.com').post('/test').reply(200, '', {
      'x-readme-id': id,
      'x-readme-label': label,
      'x-readme-email': email,
    });

    const fetchEvent = new FetchEvent({
      request: new Request('http://www.example.com/test', {
        method: 'POST',
        body: 'body',
      }),
    });

    fetchEvent.request.authentications = { account: { token: { token: '123456' } } };
    global.listeners.fetch[0](fetchEvent);
  });

  it('should passthrough if domain routing does not match existing routes', function () {
    global.INSTALL_OPTIONS = {
      routes: ['http://www.example.com/docs'],
    };

    requireTemplate();
    const mock = nock('http://www.example.com').post('/test').optionally().reply(200, '', {
      'x-readme-id': '123456',
      'x-readme-label': 'api-key-label',
      'x-readme-email': 'test@readme.io',
    });

    const event = new FetchEvent({
      request: new Request('http://www.example.com/test', {
        method: 'POST',
        body: 'body',
      }),
    });

    global.listeners.fetch[0](event);

    expect(Object.keys(event.request.headers)).to.have.lengthOf(0);
    mock.done();
  });
});
