import 'isomorphic-fetch';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { cwd } from 'node:process';
import { Readable, Transform } from 'node:stream';

import chai, { expect } from 'chai';
import { FormDataEncoder } from 'form-data-encoder';
import { File, FormData } from 'formdata-node';
import getPort from 'get-port';

import chaiPlugins from './helpers/chai-plugins.js';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

chai.use(chaiPlugins);

function supportsMultipart() {
  return 'SUPPORTS_MULTIPART' in process.env && process.env.SUPPORTS_MULTIPART === 'true';
}

function isListening(childProcess, port, attempt = 0) {
  return new Promise((resolve, reject) => {
    if (childProcess.exitCode !== null) {
      throw new Error(`Unexpected exit code: ${childProcess.exitCode} from child process`);
    }
    if (attempt > 5) throw new Error(`Cannot connect on port: ${port}`);
    const socket = net.connect(port, 'localhost');
    socket.once('error', err => {
      if (err.code !== 'ECONNREFUSED') {
        throw err;
      }
      return setTimeout(() => {
        return isListening(childProcess, port, attempt + 1).then(resolve, reject);
      }, 300 * attempt);
    });

    socket.once('connect', () => {
      return resolve();
    });
  });
}

async function getBody(response) {
  let responseBody = '';
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of response) {
    responseBody += chunk;
  }
  expect(responseBody).not.to.equal('');
  return JSON.parse(responseBody);
}

const randomApiKey = 'a-random-readme-api-key';

describe('Metrics SDK Integration Tests', function () {
  let metricsServer;
  let httpServer;
  let PORT;

  before(async function () {
    metricsServer = http.createServer().listen(0, 'localhost');

    await once(metricsServer, 'listening');
    const { address, port } = metricsServer.address();
    PORT = await getPort();

    // In order to use child_process.spawn, we have to provide a
    // command along with an array of arguments. So this is a very
    // rudimental way of splitting the two values provided to us
    // from the environment variable.
    //
    // I tried refactoring this to use child_process.exec, which just
    // takes in a single string to run, but that creates it's own
    // shell so we can't do `cp.kill()` on it later on (because that
    // just kills the shell, not the actual command we're running).
    //
    // Annoyingly this works under macOS, so it must be a platform
    // difference when running under docker/linux.
    const [command, ...args] = process.env.EXAMPLE_SERVER.split(' ');
    if (command === 'php') {
      // Laravel's `artisan serve` command doesn't pick up `PORT` environmental variables, instead
      // requiring that they're supplied as a command line argument.
      args.push(`--port=${PORT}`);
    }

    httpServer = spawn(command, args, {
      cwd: cwd(),
      detached: true,
      env: {
        PORT,
        METRICS_SERVER: new URL(`http://${address}:${port}`).toString(),
        README_API_KEY: randomApiKey,
        ...process.env,
      },
    });

    function prefixStream(prefix) {
      return new Transform({
        transform(chunk, encoding, cb) {
          return cb(
            null,
            chunk
              .toString()
              .split('\n')
              .map(line => `[${prefix}]: ${line}`)
              .join('\n')
          );
        },
      });
    }
    if (process.env.DEBUG) {
      httpServer.stdout.pipe(prefixStream('stdout')).pipe(process.stdout);
      httpServer.stderr.pipe(prefixStream('stderr')).pipe(process.stderr);
    }

    return isListening(httpServer, PORT);
  });

  after(function () {
    /**
     * Instead of running `httpServer.kill()` we need to dust the process group that was created
     * because some languages and frameworks (like Laravel's Artisan server) fire off a sub-process
     * that doesn't get normally cleaned up when we kill the original `php artisan serve` process.
     *
     * Checking that `exitCode` is null before killing group to ensure it is still running
     *
     * @see {@link https://stackoverflow.com/questions/56016550/node-js-cannot-kill-process-executed-with-child-process-exec/56016815#56016815}
     * @see {@link https://www.baeldung.com/linux/kill-members-process-group#killing-a-process-using-the-pgid}
     * @see {@link https://nodejs.org/docs/latest/api/child_process.html#subprocessexitcode}
     */
    if (httpServer.exitCode === null) process.kill(-httpServer.pid);

    return new Promise((resolve, reject) => {
      metricsServer.close(err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });

  it('should make a request to a Metrics backend with a HAR file', async function () {
    await fetch(`http://localhost:${PORT}`, { method: 'get' });

    const [req, res] = await once(metricsServer, 'request');
    expect(req.url).to.equal('/v1/request');
    expect(req.headers.authorization).to.equal('Basic YS1yYW5kb20tcmVhZG1lLWFwaS1rZXk6');

    const body = await getBody(req);
    const [har] = body;

    // https://uibakery.io/regex-library/uuid
    expect(har._id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    expect(har.group).to.deep.equal({
      id: 'owlbert-api-key',
      label: 'Owlbert',
      email: 'owlbert@example.com',
    });

    expect(har.clientIPAddress).to.equal('127.0.0.1');
    expect(har.development).to.be.false;

    const { creator } = har.request.log;
    expect(creator.name).to.match(/readme-metrics \((dotnet|node|php|python|ruby)\)/);
    expect(creator.version).not.to.be.empty;
    expect(creator.comment).not.to.be.empty;

    const { request, response, startedDateTime } = har.request.log.entries[0];

    /**
     * `startedDateTime` should look like the following, with optional microseconds component:
     *
     *  JavaScript: `new Date.toISOString()`
     *    - 2022-06-30T10:21:55.394Z
     *  PHP: `date('Y-m-d\TH:i:sp')`
     *    - 2022-08-17T19:23:31Z
     *  Python: `datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")`
     *    - 2022-06-30T10:31:43Z
     */
    expect(startedDateTime).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{3})?Z/);

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).to.match(new RegExp(`http://localhost:${PORT}(/)?`));
    expect(request.method).to.equal('GET');
    expect(request.httpVersion).to.equal('HTTP/1.1');

    expect(request.headers).to.have.header('connection', [
      'close',
      'keep-alive', // Running this suite with Node 18 the `connection` header is different.
    ]);
    expect(request.headers).to.have.header('host', `localhost:${PORT}`);

    expect(response.status).to.equal(200);
    expect(response.statusText).to.match(/OK|200/); // Django returns with "200"
    expect(response.headers).to.have.header('content-type', /application\/json(;\s?charset=utf-8)?/);

    // Flask prints a \n character after the JSON response
    // https://github.com/pallets/flask/issues/4635
    expect(response.content.text.replace('\n', '')).to.equal(JSON.stringify({ message: 'hello world' }));
    expect(response.content.size).to.equal(response.content.text.length);
    expect(response.content.mimeType).to.match(/application\/json(;\s?charset=utf-8)?/);

    res.end();
    return once(res, 'finish');
  });

  it('should capture query strings in a GET request', async function () {
    await fetch(`http://localhost:${PORT}?arr%5B1%5D=3&val=1`, { method: 'get' });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).to.match(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

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
    ]);

    expect(request.postData).to.be.undefined;

    res.end();
    return once(res, 'finish');
  });

  it('should capture query strings that may be supplied in a POST request', async function () {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/?arr%5B1%5D=3&val=1`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).to.match(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

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
    ]);

    expect(request.postData).to.deep.equal({
      mimeType: 'application/json',
      text: payload,
    });

    expect(response.status).to.equal(200);

    res.end();
    return once(res, 'finish');
  });

  it('should process a POST payload with no explicit `Content-Type` header', async function () {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      body: payload,
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', 'text/plain;charset=UTF-8');

    expect(request.postData.mimeType).to.match(/text\/plain(;charset=UTF-8)?/);
    expect(request.postData.params).to.be.undefined;
    expect(request.postData.text).to.equal(payload);

    res.end();
    return once(res, 'finish');
  });

  it('should process an `application/json` POST payload', async function () {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', 'application/json');
    expect(request.postData).to.deep.equal({
      mimeType: 'application/json',
      text: payload,
    });

    expect(response.status).to.equal(200);

    res.end();
    return once(res, 'finish');
  });

  /**
   * We should eventually support returning the raw POST payload to Metrics in this case but Express
   * has a fun quirk where if you declare the `express.json()` middleware on a route to identify
   * that that route accepts a JSON payload, if that JSON payload is corrupted then it completely
   * wipes out `req.body` and replaces it with an empty JSON object -- eliminating all access for
   * us to the what the original payload was.
   */
  // eslint-disable-next-line mocha/no-pending-tests, mocha/no-skipped-tests
  it.skip('should process an `application/JSON POST payload containing unparseable JSON');

  it('should process a vendored `+json` POST payload', async function () {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/vnd.api+json',
      },
      body: payload,
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', 'application/vnd.api+json');
    expect(request.postData).to.deep.equal({
      mimeType: 'application/vnd.api+json',
      text: payload,
    });

    expect(response.status).to.be.oneOf([
      200,
      // Fastify doesn't support vendored JSON content types out of the box and will return a
      // `FST_ERR_CTP_INVALID_MEDIA_TYPE` error but thankfully we're still able to capture and
      // process the payload into Metrics.
      415,
    ]);

    res.end();
    return once(res, 'finish');
  });

  it('should process an `application/x-www-url-formencoded` POST payload', async function () {
    const payload = new URLSearchParams();
    payload.append('email', 'dom@readme.io');

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', 'application/x-www-form-urlencoded');
    expect(request.postData).to.deep.equal({
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

    res.end();
    return once(res, 'finish');
  });

  it('should process a `multipart/form-data` POST payload', async function () {
    if (!supportsMultipart()) {
      this.skip();
    }

    const formData = new FormData();
    formData.append('password', 123456);
    formData.append('apiKey', 'abcdef');
    formData.append('another', 'Hello world');
    formData.append('buster', [1234, 5678]);

    const encoder = new FormDataEncoder(formData);

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: encoder.headers,
      body: Readable.from(encoder),
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
    expect(request.postData.mimeType).to.match(/multipart\/form-data; boundary=(.*)/);
    expect(request.postData.params).to.deep.equal([
      { name: 'password', value: '123456' },
      { name: 'apiKey', value: 'abcdef' },
      { name: 'another', value: 'Hello world' },
      { name: 'buster', value: '1234,5678' },
    ]);

    expect(request.postData.text).to.be.undefined;

    res.end();
    return once(res, 'finish');
  });

  it('should process a `multipart/form-data` POST payload containing files', async function () {
    if (!supportsMultipart()) {
      this.skip();
    }

    const owlbert = await fs.readFile('./__tests__/__datasets__/owlbert.png');

    const payload = new FormData();
    payload.append('password', 123456);
    payload.append('apiKey', 'abcdef');
    payload.append('another', 'Hello world');
    payload.append('buster', [1234, 5678]);
    payload.append('owlbert.png', new File([owlbert], 'owlbert.png', { type: 'image/png' }), 'owlbert.png');

    const encoder = new FormDataEncoder(payload);

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: encoder.headers,
      body: Readable.from(encoder),
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', /multipart\/form-data; boundary=(.*)/);
    expect(request.headers).to.have.header('content-length', 982);
    expect(request.postData.mimeType).to.match(/multipart\/form-data; boundary=(.*)/);

    const owlbertDataURL = await fs.readFile('./__tests__/__datasets__/owlbert.dataurl.json').then(JSON.parse);
    expect(request.postData.params).to.deep.equal([
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

    expect(request.postData.text).to.be.undefined;

    res.end();
    return once(res, 'finish');
  });

  it('should process a `text/plain` payload', async function () {
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'text/plain',
      },
      body: 'Hello world',
    });

    const [req, res] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).to.equal('POST');
    expect(request.headers).to.have.header('content-type', 'text/plain');
    expect(request.postData).to.deep.equal({
      mimeType: 'text/plain',
      text: 'Hello world',
    });

    expect(response.status).to.equal(200);

    res.end();
    return once(res, 'finish');
  });
});
