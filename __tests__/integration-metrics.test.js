/* eslint-disable unicorn/no-unsafe-regex */
import { spawn } from 'child_process';
import { once } from 'events';
import http from 'http';
import net from 'net';
import { Transform } from 'node:stream';
import { cwd } from 'process';
import { promisify } from 'util';

import caseless from 'caseless';
import getPort from 'get-port';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

function isListening(port, attempt = 0) {
  if (attempt > 5) throw new Error(`Cannot connect on port: ${port}`);
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, 'localhost');
    socket.once('error', err => {
      if (err.code !== 'ECONNREFUSED') {
        throw err;
      }
      return setTimeout(() => {
        return isListening(port, attempt + 1).then(resolve, reject);
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
  expect(responseBody).not.toBe('');
  return JSON.parse(responseBody);
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

function post(url, body, options) {
  return new Promise((resolve, reject) => {
    const request = http
      .request(url, { method: 'post', ...options }, response => {
        response.end = new Promise(res => {
          response.on('end', res);
        });
        resolve(response);
      })
      .on('error', reject);

    request.write(body);
    request.end();
  });
}

const get = promisify(http.get);

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
    return isListening(PORT);
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

  it('should make a request to a metrics backend with a har file', async () => {
    await get(`http://localhost:${PORT}`);

    const [req] = await once(metricsServer, 'request');
    expect(req.url).toBe('/v1/request');
    expect(req.headers.authorization).toBe('Basic YS1yYW5kb20tcmVhZG1lLWFwaS1rZXk6');

    const body = await getBody(req);
    const [har] = body;

    // Check for a uuid
    // https://uibakery.io/regex-library/uuid
    // eslint-disable-next-line no-underscore-dangle
    expect(har._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(har.group).toMatchSnapshot();
    expect(har.clientIPAddress).toBe('127.0.0.1');
    expect(har.development).toBe(false);

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

    const requestHeaders = caseless(arrayToObject(request.headers));
    expect(requestHeaders.get('connection')).toBe('close');
    expect(requestHeaders.get('host')).toBe(`localhost:${PORT}`);

    expect(response.status).toBe(200);
    // Django returns with "200"
    expect(response.statusText).toMatch(/OK|200/);
    // Flask prints a \n character after the JSON response
    // https://github.com/pallets/flask/issues/4635
    expect(response.content.text.replace('\n', '')).toBe(JSON.stringify({ message: 'hello world' }));
    expect(response.content.size).toStrictEqual(response.content.text.length);
    expect(response.content.mimeType).toMatch(/application\/json(;\s?charset=utf-8)?/);

    const responseHeaders = caseless(arrayToObject(response.headers));
    expect(responseHeaders.get('content-type')).toMatch(/application\/json(;\s?charset=utf-8)?/);
  });

  it('should process the http POST body', async () => {
    const postData = JSON.stringify({ user: { email: 'dom@readme.io' } });
    await post(`http://localhost:${PORT}/`, postData, {
      headers: {
        'content-type': 'application/json',
        // Explicit content-length is required for Python/Flask
        'content-length': Buffer.byteLength(postData),
      },
    });

    const [req] = await once(metricsServer, 'request');

    const body = await getBody(req);
    const [har] = body;

    const { request, response } = har.request.log.entries[0];
    expect(request.method).toBe('POST');
    expect(response.status).toBe(200);
    expect(request.postData).toStrictEqual(
      process.env.EXAMPLE_SERVER.startsWith('php')
        ? {
            mimeType: 'application/json',
            params: [],
          }
        : {
            mimeType: 'application/json',
            text: postData,
          }
    );
    expect(response.content.text).toMatch('');
    expect(response.content.size).toBe(0);
  });
});
