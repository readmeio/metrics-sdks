import 'isomorphic-fetch';
import { spawn } from 'child_process';
import { once } from 'events';
import fs from 'fs/promises';
import http from 'http';
import { cwd } from 'process';
import { Readable } from 'stream';

import { FormDataEncoder } from 'form-data-encoder';
import { File, FormData } from 'formdata-node';
import getPort from 'get-port';

import owlbertDataURL from './__datasets__/owlbert.dataurl.json';
import { toHaveHeader } from './helpers/jest.matchers';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

expect.extend({ toHaveHeader });

function itif(envVar) {
  if (!(envVar in process.env)) {
    throw new Error(
      `This test run does not specify a ${envVar} environment variable. It must be configured for us to run or skip tests that require it.`
    );
  } else if (process.env[envVar] === 'false') {
    return it.skip;
  }

  return it;
}

async function getBody(response) {
  let responseBody = '';
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of response) {
    responseBody += chunk;
  }
  expect(responseBody).not.toBe('');
  return JSON.parse(responseBody);
}

const randomApiKey = 'a-random-readme-api-key';

describe('Metrics SDK Integration Tests', () => {
  let metricsServer;
  let httpServer;
  let PORT;

  beforeAll(async () => {
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

    return new Promise((resolve, reject) => {
      httpServer.stderr.on('data', data => {
        if (data.toString().match(/Running on/)) return resolve(); // For some reason Flask prints on stderr 🤷‍♂️
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.error(`stderr: ${data}`);
        }

        return reject(data.toString());
      });

      httpServer.on('error', err => {
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.error('error', err);
        }

        return reject(err.toString());
      });

      // eslint-disable-next-line consistent-return
      httpServer.stdout.on('data', data => {
        if (data.toString().match(/listening/)) return resolve();
        if (data.toString().match(/Server running on/)) return resolve(); // Laravel
        if (process.env.DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`stdout: ${data}`);
        }
      });
    });
  });

  afterAll(() => {
    /**
     * Instead of running `httpServer.kill()` we need to dust the process group that was created
     * because some languages and frameworks (like Laravel's Artisan server) fire off a sub-process
     * that doesn't get normally cleaned up when we kill the original `php artisan serve` process.
     *
     * @see {@link https://stackoverflow.com/questions/56016550/node-js-cannot-kill-process-executed-with-child-process-exec/56016815#56016815}
     * @see {@link https://www.baeldung.com/linux/kill-members-process-group#killing-a-process-using-the-pgid}
     */
    process.kill(-httpServer.pid);

    return new Promise((resolve, reject) => {
      metricsServer.close(err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });

  it('should make a request to a Metrics backend with a HAR file', async () => {
    await fetch(`http://localhost:${PORT}`, { method: 'get' });

    const [req] = await once(metricsServer, 'request');
    expect(req.url).toBe('/v1/request');
    expect(req.headers.authorization).toBe('Basic YS1yYW5kb20tcmVhZG1lLWFwaS1rZXk6');

    const body = await getBody(req);
    const [har] = body;

    // https://uibakery.io/regex-library/uuid
    expect(har._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(har.group).toMatchSnapshot();
    expect(har.clientIPAddress).toBe('127.0.0.1');
    expect(har.development).toBe(false);

    const { creator } = har.request.log;
    expect(creator.name).toMatch(/readme-metrics \((dotnet|node|php|python|ruby)\)/);
    expect(creator.version).not.toBeEmpty();
    expect(creator.comment).not.toBeEmpty();

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
    expect(startedDateTime).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d{3})?Z/);

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?`));
    expect(request.method).toBe('GET');
    expect(request.httpVersion).toBe('HTTP/1.1');

    expect(request.headers).toHaveHeader('connection', 'close');
    expect(request.headers).toHaveHeader('host', `localhost:${PORT}`);

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.headers).toHaveHeader('content-type', /application\/json(;\s?charset=utf-8)?/);

    // Flask prints a \n character after the JSON response
    // https://github.com/pallets/flask/issues/4635
    expect(response.content.text.replace('\n', '')).toBe(JSON.stringify({ message: 'hello world' }));
    // The \n character above means we cannot compare to a fixed number
    expect(response.content.size).toStrictEqual(response.content.text.length);
    expect(response.content.mimeType).toMatch(/application\/json(;\s?charset=utf-8)?/);
  });

  it('should capture query strings in a GET request', async () => {
    await fetch(`http://localhost:${PORT}?arr%5B1%5D=3&val=1`, { method: 'get' });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

    // Some frameworks handle query string arrays slightly differently.
    expect(JSON.stringify(request.queryString)).toBeOneOf([
      JSON.stringify([
        { name: 'arr[1]', value: '3' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: '{"1":"3"}' },
        { name: 'val', value: '1' },
      ]),
    ]);

    expect(request.postData).toBeUndefined();
  });

  it('should capture query strings that maybe supplied in a POST request', async () => {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/?arr%5B1%5D=3&val=1`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).toBe('POST');

    // Some frameworks remove the trailing slash from the URL we get.
    expect(request.url).toMatch(new RegExp(`http://localhost:${PORT}(/)?\\?arr%5B1%5D=3&val=1`));

    expect(request.headers).toHaveHeader('content-type', 'application/json');

    // Some frameworks handle query string arrays slightly differently.
    expect(JSON.stringify(request.queryString)).toBeOneOf([
      JSON.stringify([
        { name: 'arr[1]', value: '3' },
        { name: 'val', value: '1' },
      ]),
      JSON.stringify([
        { name: 'arr', value: '{"1":"3"}' },
        { name: 'val', value: '1' },
      ]),
    ]);

    expect(request.postData).toStrictEqual({
      mimeType: 'application/json',
      text: payload,
    });

    expect(response.status).toBe(200);
  });

  it('should process a POST payload with no explicit `Content-Type` header', async () => {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      body: payload,
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', 'text/plain;charset=UTF-8');
    expect(request.postData).toStrictEqual({
      mimeType: expect.stringMatching(/text\/plain(;charset=UTF-8)?/),
      text: payload,
    });
  });

  it('should process an `application/json` POST payload', async () => {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', 'application/json');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/json',
      text: payload,
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

  it('should process a vendored `+json` POST payload', async () => {
    const payload = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/vnd.api+json',
      },
      body: payload,
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', 'application/vnd.api+json');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/vnd.api+json',
      text: payload,
    });

    expect(response.status).toBe(200);
  });

  it('should process an `application/x-www-url-formencoded` POST payload', async () => {
    const payload = new URLSearchParams();
    payload.append('email', 'dom@readme.io');

    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', 'application/x-www-form-urlencoded');
    expect(request.postData).toStrictEqual({
      mimeType: 'application/x-www-form-urlencoded',
      params: [{ name: 'email', value: 'dom@readme.io' }],
      text: null,
    });

    expect(response.status).toBe(200);
  });

  itif('SUPPORTS_MULTIPART')('should process a `multipart/form-data` POST payload', async () => {
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

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', /multipart\/form-data; boundary=(.*)/);
    expect(request.postData.mimeType).toMatch(/multipart\/form-data; boundary=(.*)/);
    expect(request.postData.params).toStrictEqual([
      { name: 'password', value: '123456' },
      { name: 'apiKey', value: 'abcdef' },
      { name: 'another', value: 'Hello world' },
      { name: 'buster', value: '1234,5678' },
    ]);

    expect(request.postData.text).toBeNull();
  });

  itif('SUPPORTS_MULTIPART')('should process a `multipart/form-data` POST payload containing files', async () => {
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

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', /multipart\/form-data; boundary=(.*)/);
    expect(request.headers).toHaveHeader('content-length', 982);
    expect(request.postData.mimeType).toMatch(/multipart\/form-data; boundary=(.*)/);
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

    expect(request.postData.text).toBeNull();
  });

  it('should process a `text/plain` payload', async () => {
    await fetch(`http://localhost:${PORT}/`, {
      method: 'post',
      headers: {
        'content-type': 'text/plain',
      },
      body: 'Hello world',
    });

    const [req] = await once(metricsServer, 'request');
    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];

    expect(request.method).toBe('POST');
    expect(request.headers).toHaveHeader('content-type', 'text/plain');
    expect(request.postData).toStrictEqual({
      mimeType: 'text/plain',
      text: 'Hello world',
    });

    expect(response.status).toBe(200);
  });
});
