/* eslint-disable no-restricted-syntax */
import { once } from 'node:events';
import http from 'node:http';
import net from 'node:net';
import { Readable } from 'node:stream';

import chai, { expect } from 'chai';
import { FormDataEncoder } from 'form-data-encoder';
import { FormData } from 'formdata-node';
import 'isomorphic-fetch';

import chaiPlugins from './helpers/chai-plugins.js';

chai.use(chaiPlugins);

const PORT = 8000; // SDK HTTP server

function hasDenyList() {
  return 'README_DENYLIST' in process.env && process.env.README_DENYLIST === 'true';
}

function hasAllowList() {
  return 'README_ALLOWLIST' in process.env && process.env.README_ALLOWLIST === 'true';
}

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

describe('Metrics SDK Integration Redaction Tests', function () {
  const sockets = new Set();

  let server;
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

  beforeEach(function () {
    sdkCall = {
      req: {},
      body: {},
    };
  });

  before(async function () {
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

  after(function () {
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

  describe('denyList', function () {
    describe('request', function () {
      it('redacts headers', async function () {
        if (!hasDenyList()) {
          this.skip();
        }
        const content = JSON.stringify({ privateKey: 'myPrivateKey', user: { email: 'dom@readme.io' } });
        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: {
            'content-type': 'application/json',
            'private-header': 'private-header-value',
          },
          body: content,
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { request } = har.log.entries[0];

        expect(request.headers).to.have.header('content-type', 'application/json');
        expect(request.headers).to.have.header('private-header', '[REDACTED 20]');
      });

      it('redacts an `application/json` POST payload', async function () {
        if (!hasDenyList()) {
          this.skip();
        }
        const content = JSON.stringify({
          privateKey: 'myPrivateValue',
          user: { email: 'dom@readme.io' },
        });
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
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', 'application/json');
        expect(request.postData.mimeType).to.equal('application/json');
        expect(JSON.parse(request.postData.text)).to.deep.equal({
          privateKey: '[REDACTED 14]',
          user: { email: 'dom@readme.io' },
        });
      });

      it('redacts a vendored `+json` POST payload', async function () {
        if (!hasDenyList()) {
          this.skip();
        }
        const content = JSON.stringify({ privateKey: 'myPrivateValue', user: { email: 'dom@readme.io' } });
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
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', 'application/vnd.api+json');
        expect(request.postData.mimeType).to.equal('application/vnd.api+json');
        expect(JSON.parse(request.postData.text)).to.deep.equal({
          privateKey: '[REDACTED 14]',
          user: { email: 'dom@readme.io' },
        });
      });

      it('redacts an `application/x-www-url-formencoded` POST payload', async function () {
        if (!hasDenyList()) {
          this.skip();
        }
        const params = new URLSearchParams();
        params.append('email', 'dom@readme.io');
        params.append('privateKey', 'myPrivateValue');

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

        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', 'application/x-www-form-urlencoded');
        expect(request.postData).to.deep.equal({
          mimeType: 'application/x-www-form-urlencoded',
          params: [
            { name: 'email', value: 'dom@readme.io' },
            { name: 'privateKey', value: '[REDACTED 14]' },
          ],
        });
      });

      it('redacts a `multipart/form-data` POST payload', async function () {
        if (!supportsMultipart() || !hasDenyList()) {
          this.skip();
        }

        const formData = new FormData();
        formData.append('another', 'Hello world');
        formData.append('privateKey', 'myPrivateValue');

        const encoder = new FormDataEncoder(formData);

        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: encoder.headers,
          body: Readable.from(encoder),
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
        expect(request.postData.mimeType).to.match(/multipart\/form-data; boundary=(.*)/);
        expect(request.postData.params).to.deep.equal([
          { name: 'another', value: 'Hello world' },
          { name: 'privateKey', value: '[REDACTED 14' },
        ]);
      });

      describe('response', function () {
        it('removes the response headers', async function () {
          if (!hasDenyList()) {
            this.skip();
          }
          const content = JSON.stringify({ privateKey: 'myPrivateKey', user: { email: 'dom@readme.io' } });
          await fetch(`http://localhost:${PORT}/`, {
            method: 'post',
            headers: {
              'content-type': 'application/json',
              'private-header': 'private-header-value',
            },
            body: content,
          });

          const [, body] = await getRequest();
          const [payload] = body;

          const har = payload.request;
          const { response } = har.log.entries[0];

          expect(response.headers).to.not.have.key('x-header-1');
          expect(response.headers).to.have.header('x-header-2', 'header-2');
        });

        it('redacts the body fields', async function () {
          if (!hasDenyList()) {
            this.skip();
          }
          const content = JSON.stringify({ privateKey: 'myPrivateKey', user: { email: 'dom@readme.io' } });
          await fetch(`http://localhost:${PORT}/`, {
            method: 'post',
            headers: {
              'content-type': 'application/json',
              'private-header': 'private-header-value',
            },
            body: content,
          });

          const [, body] = await getRequest();
          const [payload] = body;

          const har = payload.request;
          const { response } = har.log.entries[0];

          expect(JSON.parse(response.content.text)).to.deep.equal({
            privateKey: '[REDACTED 14]',
            publicKey: 'myPublicValue',
          });
        });
      });
    });
  });

  describe('allowList', function () {
    describe('request', function () {
      it('redacts headers', async function () {
        if (!hasAllowList()) {
          this.skip();
        }
        const content = JSON.stringify({ publicKey: 'myPublicValue', user: { email: 'dom@readme.io' } });
        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: {
            'content-type': 'application/json',
            'public-header': 'public-header-value',
          },
          body: content,
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { request } = har.log.entries[0];

        expect(request.headers).to.have.header('content-type', '[REDACTED 16]');
        expect(request.headers).to.have.header('public-header', 'public-header-value');
      });

      it('redacts an `application/json` POST payload', async function () {
        if (!hasAllowList()) {
          this.skip();
        }
        const content = JSON.stringify({
          publicKey: 'myPublicValue',
          user: { email: 'dom@readme.io', nestedKey: 'nestedValue' },
        });
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
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', '[REDACTED 16]');
        expect(request.postData.mimeType).to.equal('application/json');
        const jsonBody = JSON.parse(request.postData.text);
        expect(jsonBody).to.deep.equal({
          publicKey: 'myPublicValue',
          user: { email: '[REDACTED 13]', nestedKey: '[REDACTED 11]' },
        });
      });

      it('redacts a vendored `+json` POST payload', async function () {
        if (!hasAllowList()) {
          this.skip();
        }
        const content = JSON.stringify({
          publicKey: 'myPublicValue',
          user: { email: 'dom@readme.io', nestedKey: 'nestedValue' },
        });
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
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', '[REDACTED 24]');

        expect(request.postData.mimeType).to.equal('application/vnd.api+json');
        const jsonBody = JSON.parse(request.postData.text);
        expect(jsonBody).to.deep.equal({
          publicKey: 'myPublicValue',
          user: { email: '[REDACTED 13]', nestedKey: '[REDACTED 11]' },
        });
      });

      it('redacts an `application/x-www-url-formencoded` POST payload', async function () {
        if (!hasAllowList()) {
          this.skip();
        }
        const params = new URLSearchParams();
        params.append('email', 'dom@readme.io');
        params.append('publicKey', 'myPublicValue');

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

        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', '[REDACTED 33]');
        expect(request.postData).to.deep.equal({
          mimeType: 'application/x-www-form-urlencoded',
          params: [
            { name: 'email', value: '[REDACTED 13]' },
            { name: 'publicKey', value: 'myPublicValue' },
          ],
        });
      });

      it('redacts a `multipart/form-data` POST payload', async function () {
        if (!supportsMultipart() || !hasAllowList()) {
          this.skip();
        }

        const formData = new FormData();
        formData.append('another', 'Hello world');
        formData.append('privateKey', 'myPrivateValue');

        const encoder = new FormDataEncoder(formData);

        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: encoder.headers,
          body: Readable.from(encoder),
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { request } = har.log.entries[0];

        expect(request.method).to.equal('POST');
        expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
        expect(request.postData.mimeType).to.match(/multipart\/form-data; boundary=(.*)/);
        expect(request.postData.params).to.deep.equal([
          { name: 'another', value: 'Hello world' },
          { name: 'privateKey', value: '[REDACTED 14' },
        ]);
      });
    });

    describe('response', function () {
      it('removes the response headers', async function () {
        const content = JSON.stringify({ privateKey: 'myPrivateKey', user: { email: 'dom@readme.io' } });
        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: {
            'content-type': 'application/json',
            'private-header': 'private-header-value',
          },
          body: content,
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { response } = har.log.entries[0];

        expect(response.headers).to.not.have.key('x-header-1');
        expect(response.headers).to.have.header('x-header-2', 'header-2');
      });

      it('redacts the body fields', async function () {
        const content = JSON.stringify({ privateKey: 'myPrivateKey', user: { email: 'dom@readme.io' } });
        await fetch(`http://localhost:${PORT}/`, {
          method: 'post',
          headers: {
            'content-type': 'application/json',
            'private-header': 'private-header-value',
          },
          body: content,
        });

        const [, body] = await getRequest();
        const [payload] = body;

        const har = payload.request;
        const { response } = har.log.entries[0];

        expect(JSON.parse(response.content.text)).to.deep.equal({
          privateKey: '[REDACTED 14]',
          publicKey: 'myPublicValue',
        });
      });
    });
  });
});
