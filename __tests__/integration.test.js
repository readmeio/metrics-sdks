import http from 'http';
import { cwd } from 'process';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { once } from 'events';
import getPort from 'get-port';
import caseless from 'caseless';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

// https://gist.github.com/krnlde/797e5e0a6f12cc9bd563123756fc101f
http.get[promisify.custom] = function getAsync(options) {
  return new Promise((resolve, reject) => {
    http
      .get(options, response => {
        response.end = new Promise(res => {
          response.on('end', res);
        });
        resolve(response);
      })
      .on('error', reject);
  });
};
const get = promisify(http.get);

async function getRequestBody(req) {
  let body = '';
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of req) {
    body += chunk;
  }
  return JSON.parse(body);
}

const randomApiKey = 'a-random-readme-api-key';

// Converts an array of headers like this:
// [
//   { name: 'host', value: 'localhost:49914' },
//   { name: 'connection', value: 'close' },
// ];
//
// To an object that can be passed in to caseless:
// {
//    host: 'localhost:49914',
//    connection: 'close'
// }
function arrayToObject(array) {
  return array.reduce((prev, next) => {
    return Object.assign(prev, { [next.name]: next.value });
  }, {});
}

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

    httpServer = spawn(command, args, {
      cwd: cwd(),
      env: {
        PORT,
        METRICS_SERVER: new URL(`http://${address}:${port}`).toString(),
        README_API_KEY: randomApiKey,
        ...process.env,
      },
    });
    return new Promise((resolve, reject) => {
      httpServer.stderr.on('data', data => {
        // eslint-disable-next-line no-console
        console.error(`stderr: ${data}`);
        return reject(data.toString());
      });
      httpServer.on('error', err => {
        // eslint-disable-next-line no-console
        console.error('error', err);
        return reject(err.toString());
      });
      // eslint-disable-next-line consistent-return
      httpServer.stdout.on('data', data => {
        if (data.toString().match(/listening/)) return resolve();
        // eslint-disable-next-line no-console
        console.log(`stdout: ${data}`);
      });
    });
  });

  afterAll(() => {
    httpServer.kill();
    return new Promise((resolve, reject) => {
      metricsServer.close(err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });

  // Hashing is only supported in some versions of the SDK
  function getGroupId() {
    if (process.env.SUPPORTS_HASHING) {
      return 'sha512-u2GbQ83jIqNa+a8v110+8IDztQQr4joL1xSE+wFH51zSOA1qQKPwOC8t2n2LWJQA1mX4ZLZ45SEokITzLed/ow==?-key';
    }
    return 'owlbert-api-key';
  }

  // TODO this needs fleshing out more with more assertions and complex
  // test cases, along with more servers in different languages too!
  it('should make a request to a metrics backend with a har file', async () => {
    await get(`http://localhost:${PORT}`);

    const [req] = await once(metricsServer, 'request');
    expect(req.url).toBe('/v1/request');
    expect(req.headers.authorization).toBe('Basic YS1yYW5kb20tcmVhZG1lLWFwaS1rZXk6');

    const [har] = await getRequestBody(req);

    // Check for a uuid
    // https://uibakery.io/regex-library/uuid
    // eslint-disable-next-line no-underscore-dangle
    expect(har._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    expect(har.group.id).toBe(getGroupId());
    expect(har.group.email).toBe('owlbert@example.com');
    expect(har.group.label).toBe('Owlbert');
    expect(har.clientIPAddress).toBe('127.0.0.1');

    const { request, response } = har.request.log.entries[0];

    expect(request.url).toBe(`http://localhost:${PORT}/`);
    expect(request.method).toBe('GET');
    expect(request.httpVersion).toBe('HTTP/1.1');

    const requestHeaders = caseless(arrayToObject(request.headers));
    expect(requestHeaders.get('connection')).toBe('close');
    expect(requestHeaders.get('host')).toBe(`localhost:${PORT}`);

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.content.text).toBe(JSON.stringify({ message: 'hello world' }));
    expect(response.content.size).toBe(25);
    expect(response.content.mimeType).toBe('application/json; charset=utf-8');

    const responseHeaders = caseless(arrayToObject(response.headers));
    expect(responseHeaders.get('content-type')).toBe('application/json; charset=utf-8');
  });

  const authorizationHeader = 'Bearer: a-random-api-key';
  function getAuthorizationHeader() {
    if (process.env.SUPPORTS_HASHING) {
      return 'sha512-7S+L0vUE8Fn6HI3836rtz4b6fVf6H4JFur6SGkOnL3bFpC856+OSZkpIHphZ0ipNO+kUw1ePb5df2iYrNQCpXw==?-key';
    }
    return authorizationHeader;
  }

  it('should process `Authorization` header', async () => {
    await get({
      host: 'localhost',
      port: PORT,
      headers: { authorization: authorizationHeader },
    });

    const [req] = await once(metricsServer, 'request');
    const [har] = await getRequestBody(req);
    const { request } = har.request.log.entries[0];

    const requestHeaders = caseless(arrayToObject(request.headers));
    expect(requestHeaders.get('authorization')).toBe(getAuthorizationHeader());
  });
});
