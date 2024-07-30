/* eslint-disable no-restricted-syntax */
import { once } from 'node:events';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';

import chai from 'chai';
import { describe, beforeAll, beforeEach, afterAll, expect, it, expectTypeOf } from 'vitest';

import chaiPlugins from './helpers/chai-plugins.js';

// eslint-disable-next-line vitest/require-hook
chai.use(chaiPlugins);

const PORT = 8000; // SDK HTTP server
const randomAPIKey = 'rdme_abcdefghijklmnopqrstuvwxyz'; // This must match what's in `docker-compose.yml`.

function supportsMultipart() {
  return 'SUPPORTS_MULTIPART' in process.env && process.env.SUPPORTS_MULTIPART === 'true';
}

function isListening(port, attempt = 0) {
  return new Promise((resolve, reject) => {
    if (attempt > 5) throw new Error(`Cannot connect on port: ${port}`);
    const socket = net.connect(port, '0.0.0.0');
    socket.once('error', err => {
      if (err.code !== 'ECONNREFUSED') {
        throw err;
      }
      return setTimeout(() => {
        return isListening(port, attempt + 1).then(resolve, reject);
      }, 300 * attempt);
    });

    socket.once('connect', () => {
      socket.destroy();
      // Sometimes the TCP connection is resolving before
      // the HTTP server is ready to receive connections
      // So just sleeping for 500ms to be sure.
      return setTimeout(() => resolve(), 500);
    });
  });
}

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Metrics SDK Integration Tests', function () {
  const sockets = new Set();

  let server;
  // eslint-disable-next-line vitest/require-hook
  let sdkCall = {
    req: {},
    body: {},
  };

  async function getRequest() {
    // Make sure the request has completed and the body has been
    // parsed before returning
    if (!sdkCall.req.complete) {
      await sleep(300);
      return getRequest();
    }
    return [sdkCall.req, sdkCall.body];
  }

  beforeAll(async function () {
    await isListening(PORT);

    server = http
      .createServer((req, res) => {
        sdkCall.req = req;

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          sdkCall.body = JSON.parse(body);
          res.writeHead(200);
          res.end();
        });
      })
      .listen(8001, '0.0.0.0');

    server.on('connection', socket => {
      sockets.add(socket);
    });

    return once(server, 'listening');
  });

  beforeEach(function () {
    sdkCall = {
      req: {},
      body: {},
    };
  });

  afterAll(function () {
    // The mock server will sometimes hang after we're done when we're trying to close it down,
    // this will forcefull kill everything and prevent our tests from crashing out from Mocha "you
    // didn't call done()" errors.
    for (const socket of sockets) {
      socket.destroy();
      sockets.delete(socket);
    }

    return new Promise((resolve, reject) => {
      server.close(err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });

  function getGroupId() {
    // Hashing is only supported in some versions of the SDK
    if (process.env.SUPPORTS_HASHING) {
      return 'sha512-u2GbQ83jIqNa+a8v110+8IDztQQr4joL1xSE+wFH51zSOA1qQKPwOC8t2n2LWJQA1mX4ZLZ45SEokITzLed/ow==?-key';
    }
    return 'owlbert-api-key';
  }

  it('should make a request to a Metrics backend with a HAR file', async function () {
    await fetch(`http://localhost:${PORT}`, { method: 'get' });

    const [req, body] = await getRequest();
    const [payload] = body;

    expect(req.url).toBe('/v1/request');
    expect(req.headers.authorization).toBe(`Basic ${Buffer.from(`${randomAPIKey}:`).toString('base64')}`);

    // https://uibakery.io/regex-library/uuid
    expect(payload._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    expect(payload.group.id).toBe(getGroupId());
    expect(payload.group.email).toBe('owlbert@example.com');
    expect(payload.group.label).toBe('Owlbert');

    expect(payload.clientIPAddress).toMatch(/\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/);
    expect(payload.development).toBe(false);

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { creator } = har.log;
    expect(creator.name).toMatch(/readme-metrics \((dotnet|node|php|python|ruby)\)/);
    expectTypeOf(creator.version).toBeString();
    expectTypeOf(creator.comment).toBeString();

    const { request, response, startedDateTime } = har.log.entries[0];

    /**
     * `startedDateTime` should look like the following, with optional microseconds component:
     *
     *  JavaScript: `new Date().toISOString()`
     *    - 2022-06-30T10:21:55.394Z
     *  PHP: `date('Y-m-d\TH:i:sp')`
     *    - 2022-08-17T19:23:31Z
     *  Python: `datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")`
     *    - 2022-06-30T10:31:43Z
     */
    expect(startedDateTime).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{3})?Z/);

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?`));
    expect(request.method).toBe('GET');
    expect(request.httpVersion).toBe('HTTP/1.1');

    expect(request.headers).to.have.header('connection', [
      'close',
      'keep-alive', // Running this suite with Node 18 the `connection` header is different.
    ]);
    expect(request.headers).to.have.header('host', [
      `localhost:${PORT}`,
      'localhost', // rails does not include the port
    ]);

    expect(response.status).toBe(200);
    expect(response.statusText).toMatch(/OK|200/); // Django returns with "200"
    expect(response.headers).to.have.header('content-type', /application\/json(;\s?charset=utf-8)?/);

    // Flask prints a \n character after the JSON response
    // https://github.com/pallets/flask/issues/4635
    expect(response.content.text.replace('\n', '')).toBe(JSON.stringify({ message: 'hello world' }));
    expect(response.content.size).toBe(response.content.text.length);
    expect(response.content.mimeType).toMatch(/application\/json(;\s?charset=utf-8)?/);
  });

  it('should include an _id UUID in har payload', async function () {
    await fetch(`http://localhost:${PORT}`, { method: 'get' });

    const [, body] = await getRequest();
    const [har] = body;
    expect(typeof har._id).toBe('string');
  });

  it.todo('should add `x-documentation-url` to response headers', async function () {
    await fetch(`http://localhost:${PORT}`, { method: 'get' });

    const [, body] = await getRequest();
    const [har] = body;

    const { response } = har.request.log.entries[0];
    const docHeader = response.headers.find(h => h.name.toLowerCase() === 'x-documentation-url');
    expect(docHeader.value).toContain('/logs');
  });

  it('should mask `Authorization` headers', async function () {
    const authorizationHeader = 'Bearer: a-random-api-key';
    function getAuthorizationHeader() {
      if (process.env.SUPPORTS_HASHING) {
        return 'sha512-7S+L0vUE8Fn6HI3836rtz4b6fVf6H4JFur6SGkOnL3bFpC856+OSZkpIHphZ0ipNO+kUw1ePb5df2iYrNQCpXw==?-key';
      }
      return authorizationHeader;
    }

    await fetch(`http://localhost:${PORT}`, { method: 'get', headers: { authorization: authorizationHeader } });

    const [, body] = await getRequest();
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.headers).to.have.header('authorization', getAuthorizationHeader());
  });

  it('should capture query strings in a GET request', async function () {
    await fetch(`http://localhost:${PORT}?arr%5B1%5D=3&val=1`, { method: 'get' });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request } = har.log.entries[0];

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

    // Some frameworks handle query string arrays slightly differently.
    expect(JSON.stringify(request.queryString)).to.be.oneOf([
      JSON.stringify([
        { name: 'arr[1]', value: '3' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: '{"1":"3"}' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: { 1: '3' } },
        { name: 'val', value: '1' },
      ]), // Rails
    ]);

    expect(request.postData).toBeUndefined();
  });

  it('should capture query strings that may be supplied in a POST request', async function () {
    const content = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/?arr%5B1%5D=3&val=1`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: content,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.be.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request, response } = har.log.entries[0];

    expect(request.method).toBe('POST');

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

    expect(request.headers).to.have.header('content-type', 'application/json');

    // Some frameworks handle query string arrays slightly differently.
    expect(JSON.stringify(request.queryString)).to.be.oneOf([
      JSON.stringify([
        { name: 'arr[1]', value: '3' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: '{"1":"3"}' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: { 1: '3' } },
        { name: 'val', value: '1' },
      ]), // Rails
    ]);

    expect(request.postData).toStrictEqual({
      mimeType: 'application/json',
      text: content,
    });

    expect(response.status).toBe(200);
  });

  it('should process a POST payload with no explicit `Content-Type` header', async function () {
    const content = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      body: content,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', 'text/plain;charset=UTF-8');

    expect(request.postData.mimeType).toMatch(/text\/plain(;charset=UTF-8)?/);
    expect(request.postData.params).toBeUndefined();
    expect(request.postData.text).toStrictEqual(content);
  });

  it('should process an `application/json` POST payload', async function () {
    const content = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: content,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request, response } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', 'application/json');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/json',
      text: content,
    });

    expect(response.status).toBe(200);
  });

  /**
   * We should eventually support returning the raw POST payload to Metrics in this case but Express
   * has a fun quirk where if you declare the `express.json()` middleware on a route to identify
   * that that route accepts a JSON payload, if that JSON payload is corrupted then it completely
   * wipes out `req.body` and replaces it with an empty JSON object -- eliminating all access for
   * us to the what the original payload was.
   */
  it.todo('should process an `application/JSON POST payload containing unparseable JSON');

  it('should process a vendored `+json` POST payload', async function () {
    const content = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/vnd.api+json',
      },
      body: content,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request, response } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', 'application/vnd.api+json');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/vnd.api+json',
      text: content,
    });

    expect(response.status).to.be.oneOf([
      200,
      // Fastify doesn't support vendored JSON content types out of the box and will return a
      // `FST_ERR_CTP_INVALID_MEDIA_TYPE` error but thankfully we're still able to capture and
      // process the payload into Metrics.
      415,
    ]);
  });

  it('should process an `application/x-www-url-formencoded` POST payload', async function () {
    const params = new URLSearchParams();
    params.append('email', 'dom@readme.io');

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request, response } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', 'application/x-www-form-urlencoded');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/x-www-form-urlencoded',
      params: [{ name: 'email', value: 'dom@readme.io' }],
    });

    expect(response.status).to.be.oneOf([
      200,
      // Fastify, without the `@fastify/formbody` package out of the box doesn't support
      // `x-www-form-urlencoded` and will return a `FST_ERR_CTP_INVALID_MEDIA_TYPE` error.
      // Thankfully our middleware is still able to capture the payload from the request and send
      // that to Metrics regardless if Fastify supports it or not.
      415,
    ]);
  });

  it.skipIf(!supportsMultipart())('should process a `multipart/form-data` POST payload', async function () {
    const formData = new FormData();
    formData.append('password', 123456);
    formData.append('apiKey', 'abcdef');
    formData.append('another', 'Hello world');
    formData.append('buster', [1234, 5678]);

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      body: formData,
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
    expect(request.postData.mimeType).toMatch(/multipart\/form-data; boundary=(.*)/);
    expect(request.postData.params).toStrictEqual([
      { name: 'password', value: '123456' },
      { name: 'apiKey', value: 'abcdef' },
      { name: 'another', value: 'Hello world' },
      { name: 'buster', value: '1234,5678' },
    ]);

    expect(request.postData.text).toBeUndefined();
  });

  it.skipIf(!supportsMultipart())(
    'should process a `multipart/form-data` POST payload containing files',
    async function () {
      const owlbert = await fs.readFile('./test/__datasets__/owlbert.png');

      const formData = new FormData();
      formData.append('password', 123456);
      formData.append('apiKey', 'abcdef');
      formData.append('another', 'Hello world');
      formData.append('buster', [1234, 5678]);
      formData.append('owlbert.png', new File([owlbert], 'owlbert.png', { type: 'image/png' }), 'owlbert.png');

      await fetch(`http://localhost:${PORT}/`, {
        method: 'post',
        body: formData,
      });

      const [, body] = await getRequest();
      const [payload] = body;

      const har = payload.request;
      await expect(har).to.have.a.har.request;
      await expect(har).to.have.a.har.response;

      const { request } = har.log.entries[0];

      expect(request.method).toBe('POST');
      expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
      expect(request.headers).to.have.header('content-length', [960, 982]);
      expect(request.postData.mimeType).toMatch(/multipart\/form-data; boundary=(.*)/);

      const owlbertDataURL = await fs.readFile('./test/__datasets__/owlbert.dataurl.json').then(JSON.parse);
      expect(request.postData.params).toStrictEqual([
        { name: 'password', value: '123456' },
        { name: 'apiKey', value: 'abcdef' },
        { name: 'another', value: 'Hello world' },
        { name: 'buster', value: '1234,5678' },
        {
          name: 'owlbert_png',
          value: owlbertDataURL,
          fileName: 'owlbert.png',
          contentType: 'image/png',
        },
      ]);

      expect(request.postData.text).toBeUndefined();
    },
  );

  it('should process a `text/plain` payload', async function () {
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'text/plain',
      },
      body: 'Hello world',
    });

    const [, body] = await getRequest();
    const [payload] = body;

    const har = payload.request;
    await expect(har).to.have.a.har.request;
    await expect(har).to.have.a.har.response;

    const { request, response } = har.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).to.have.header('content-type', 'text/plain');
    expect(request.postData).toStrictEqual({
      mimeType: 'text/plain',
      text: 'Hello world',
    });

    expect(response.status).toBe(200);
  });
});
