import nock from 'nock';
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest';

import globals from './service-worker-globals';

function requireWorker() {
  delete require.cache[require.resolve('../src')];
  return require('../src'); // eslint-disable-line global-require
}

describe('worker', function () {
  beforeAll(function () {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  beforeEach(function () {
    Object.assign(global, globals());
  });

  afterAll(function () {
    return nock.cleanAll();
  });

  describe('#fetchAndCollect()', function () {
    it('should error if response from API is missing required headers', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      });

      const mock = nock('https://example.com').get('/a?b=2').reply(200);

      try {
        await requireWorker().fetchAndCollect(request);
      } catch (e) {
        expect(e.message).to.equal('Missing headers on the response: x-readme-id, x-readme-label');
      }

      mock.done();
    });

    it('should work for GET/HEAD requests (no body)', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      });
      const mock = nock('https://example.com').get('/a?b=2').reply(200, '', {
        'x-readme-id': 'id',
        'x-readme-label': 'label',
      });

      await requireWorker().fetchAndCollect(request);
      mock.done();
    });

    it('should make the request provided', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });
      const mock = nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200, '', {
          'x-readme-id': 'id',
          'x-readme-label': 'label',
        });

      await requireWorker().fetchAndCollect(request);
      mock.done();
    });

    it('should return a har file', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });

      nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200, 'response', {
          'content-type': 'text/plain',
          'x-response-header': 'hello',
          'x-readme-id': 'id',
          'x-readme-label': 'label',
        });

      const { har } = await requireWorker().fetchAndCollect(request);

      expect(har.log.creator.name).to.equal('@readme/cloudflare-worker');
      expect(typeof har.log.entries[0].startedDateTime).to.equal('string');
      expect(typeof har.log.entries[0].time).to.equal('number');
      expect(har.log.entries[0].request).to.deep.equal({
        method: request.method,
        url: request.url,
        httpVersion: '1.1',
        headers: [
          {
            name: 'content-type',
            value: 'application/json',
          },
        ],
        queryString: [
          {
            name: 'b',
            value: '2',
          },
        ],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify({ c: 3, d: 4 }),
        },
      });

      expect(har.log.entries[0].response).to.deep.equal({
        status: 200,
        statusText: 'OK',
        headers: [
          {
            name: 'content-type',
            value: 'text/plain',
          },
          {
            name: 'x-response-header',
            value: 'hello',
          },
        ],
        content: {
          text: 'response',
          size: 'response'.length,
          mimeType: 'text/plain',
        },
      });
    });

    it('should default mimeType to json if no content-type', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': '',
        },
      });

      nock('https://example.com').post('/a?b=2').reply(200, '', {
        'x-readme-id': 'id',
        'x-readme-label': 'label',
        'content-type': '',
      });

      const { har } = await requireWorker().fetchAndCollect(request);

      expect(har.log.entries[0].request.postData.mimeType).to.equal('application/json');
      expect(har.log.entries[0].response.content.mimeType).to.equal('application/json');
    });

    it('should return with a fresh response that can be read', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });

      nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(
          200,
          { response: true },
          {
            'x-response-header': 'hello',
            'x-readme-id': 'id',
            'x-readme-label': 'label',
          },
        );

      const { response } = await requireWorker().fetchAndCollect(request);

      // If we can read the response body, then it means
      // it can be returned from the service worker
      await response.json();
    });

    it('should strip out any x-readme-headers', async function () {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });

      nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200, '', {
          'x-readme-id': 'id',
          'x-readme-label': 'label',
          'x-readme-email': 'myEmail',
          coronavirus: 'activated',
        });

      const { har } = await requireWorker().fetchAndCollect(request);
      const headers = har.log.entries[0].response.headers.map(h => h.name);
      expect(headers).not.to.contain('x-readme-id');
      expect(headers).not.to.contain('x-readme-label');
      expect(headers).not.to.contain('x-readme-email');
    });
  });

  describe('#metrics()', function () {
    it('should make a request to the metrics api', async function () {
      const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';
      const group = '5afa21b97011c63320226ef3';
      const har = {
        log: {
          entries: [
            {
              request: {},
              response: {},
            },
          ],
        },
      };
      const clientIPAddress = '127.0.0.1';

      const mock = nock('http://localhost')
        .post('/v1/request', ([body]) => {
          expect(body.group).to.equal(group);
          expect(body.clientIPAddress).to.equal(clientIPAddress);
          expect(body.request).to.deep.equal(har);
          return true;
        })
        .basicAuth({ user: apiKey })
        .reply(200, 'OK', {
          'x-readme-id': 'id',
          'x-readme-label': 'label',
        });

      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': clientIPAddress,
        },
      });

      await requireWorker().metrics(apiKey, group, request, har);

      mock.done();
    });

    it('should default clientIPAddress to 0.0.0.0', async function () {
      const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';
      const har = {
        log: {
          entries: [
            {
              request: {},
              response: {},
            },
          ],
        },
      };

      const mock = nock('http://localhost')
        .post('/v1/request', ([body]) => {
          expect(body.clientIPAddress).to.equal('0.0.0.0');
          return true;
        })
        .basicAuth({ user: apiKey })
        .reply(200);

      const request = new Request('https://example.com');

      await requireWorker().metrics(apiKey, '1234', request, har);

      mock.done();
    });
  });
});
