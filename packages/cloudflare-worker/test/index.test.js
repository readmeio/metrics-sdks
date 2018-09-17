/* eslint-env mocha */
const fetch = require('node-fetch');

const { Request, Response } = fetch;
const { URL } = require('url');

global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.URL = URL;
global.btoa = str => Buffer.from(str).toString('base64');

const assert = require('assert');
const nock = require('nock');
const config = require('../../config');

const worker = require('../../worker');

describe('worker', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  describe('#fetchAndCollect()', () => {
    it('should work for GET/HEAD requests (no body)', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
      });
      const mock = nock('https://example.com')
        .get('/a?b=2')
        .reply(200);

      await worker.fetchAndCollect(request);
      mock.done();
    });

    it('should make the request provided', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ c: 3, d: 4 }),
      });
      const mock = nock('https://example.com')
        .post('/a?b=2', JSON.stringify({ c: 3, d: 4 }))
        .reply(200);

      await worker.fetchAndCollect(request);
      mock.done();
    });

    it('should return a har file', async () => {
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
        });

      const { har } = await worker.fetchAndCollect(request);

      assert.deepEqual(har.log.creator, { name: 'cloudflare-worker', version: 'node' });
      assert.equal(typeof har.log.entries[0].startedDateTime, 'string');
      assert.equal(typeof har.log.entries[0].time, 'number');
      assert.deepEqual(har.log.entries[0].request, {
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

      assert.deepEqual(har.log.entries[0].response, {
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

    it('should default mimeType to json if no content-type', async () => {
      const request = new global.Request('https://example.com/a?b=2', {
        method: 'POST',
        headers: {
          'content-type': '',
        },
      });

      nock('https://example.com')
        .post('/a?b=2')
        .reply(200);

      const { har } = await worker.fetchAndCollect(request);

      assert.equal(har.log.entries[0].request.postData.mimeType, 'application/json');
      assert.equal(har.log.entries[0].response.content.mimeType, 'application/json');
    });

    it('should return with a fresh response that can be read', async () => {
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
          },
        );

      const { response } = await worker.fetchAndCollect(request);

      // If we can read the response body, then it means
      // it can be returned from the service worker
      await response.json();
    });
  });

  describe('#metrics()', () => {
    it('should make a request to the metrics api', async () => {
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

      const mock = nock('http://localhost')
        .post('/request', ([body]) => {
          assert.equal(body.group, group);
          assert.deepEqual(body.request, har);
          return true;
        })
        .basicAuth({ user: apiKey })
        .reply(200, 'OK');

      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '127.0.0.1',
        },
      });

      await worker.metrics(apiKey, group, request, har);

      mock.done();
    });
  });
});
