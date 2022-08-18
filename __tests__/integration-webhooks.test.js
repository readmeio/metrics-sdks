import { execSync, spawn } from 'child_process';
import crypto from 'crypto';
import http from 'http';
import { cwd } from 'process';

import getPort from 'get-port';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

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

const randomApiKey = 'rdme_abcdefghijklmnopqrstuvwxyz';

async function getResponseBody(response) {
  let responseBody = '';
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of response) {
    responseBody += chunk;
  }
  expect(responseBody).not.toBe('');
  return JSON.parse(responseBody);
}

describe('Metrics SDK Webhook Integration Tests', () => {
  let httpServer;
  let PORT;

  beforeAll(async () => {
    const [command, ...args] = process.env.EXAMPLE_SERVER.split(' ');
    PORT = await getPort();

    if (command === 'php') {
      // Laravel's `artisan serve` command doesn't pick up `PORT` environmental variables, instead
      // requiring that they're supplied as a command line argument.
      args.push(`--port=${PORT}`);
    }

    httpServer = spawn(command, args, {
      cwd: cwd(),
      env: {
        README_API_KEY: randomApiKey,
        PORT,
        ...process.env,
      },
    });

    // Uncomment the console.log lines to see stdout/stderr output from the child process
    return new Promise((resolve, reject) => {
      httpServer.stderr.on('data', data => {
        if (data.toString().match(/Running on/)) return resolve(); // For some reason Flask prints on stderr 🤷‍♂️
        // // eslint-disable-next-line no-console
        // console.error(`stderr: ${data}`);
        return reject(data.toString());
      });
      httpServer.on('error', err => {
        // // eslint-disable-next-line no-console
        // console.error('error', err);
        return reject(err.toString());
      });
      // eslint-disable-next-line consistent-return
      httpServer.stdout.on('data', data => {
        if (data.toString().match(/listening/)) return resolve();
        if (data.toString().match(/Server running on/)) return resolve(); // Laravel
        // // eslint-disable-next-line no-console
        // console.log(`stdout: ${data}`);
      });
    });
  });

  afterAll(() => {
    /**
     * There's a fun quirk with Laravel's Artisan web server where when you spawn it it also spawns
     * another thread that components of the web server. When we kill the main Artisan process
     * we've created here that kills the main Artisan process, and frees up the address:port it was
     * bound to but it unfortunately doesn't clean up the sub-thread.
     *
     * Annoyingly sending CTRL+C when you run `php artisan serve` by itself cleans up this process
     * but sending `proc.kill('SIGINT')` (and neither `SIGTERM`) doesn't. The only way we can clean
     * up this orphan process is to look for the process by querying the system for its parent
     * thread and then manually invoking a `kill` command to dust it.
     */
    if (httpServer.spawnargs.includes('php')) {
      const pid = execSync(`pgrep -P ${httpServer.pid}`);
      if (pid) {
        execSync(`kill -9 ${pid}`);
      }
    }

    return httpServer.kill();
  });

  it('should return with a user object if the signature is correct', async () => {
    const time = Date.now();
    const body = {
      email: 'dom@readme.io',
    };
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', randomApiKey);
    const output = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    const response = await post(`http://localhost:${PORT}/webhook`, JSON.stringify(body), {
      headers: {
        'readme-signature': output,
        'content-type': 'application/json',
      },
    });
    const responseBody = await getResponseBody(response);

    expect(response.statusCode).toBe(200);
    expect(responseBody).toMatchObject({
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });

  it('should return with a 401 if the signature is not correct', async () => {
    const response = await post(`http://localhost:${PORT}/webhook`, JSON.stringify({ email: 'dom@readme.io' }), {
      headers: {
        'readme-signature': `t=${Date.now()},v0=abcdefghjkl`,
        'content-type': 'application/json',
      },
    });
    const responseBody = await getResponseBody(response);

    expect(response.statusCode).toBe(401);
    expect(responseBody.error).toBe('Invalid Signature');
  });

  it('should return with a 401 if the signature is empty/missing', async () => {
    const response = await post(`http://localhost:${PORT}/webhook`, JSON.stringify({ email: 'dom@readme.io' }), {
      headers: {
        'content-type': 'application/json',
      },
    });
    const responseBody = await getResponseBody(response);

    expect(response.statusCode).toBe(401);
    expect(responseBody.error).toBe('Missing Signature');
  });

  it('should return an error with an expired signature', async () => {
    // Expiry time is 30 mins
    const FORTY_MIN = 40 * 60 * 1000;
    const time = Date.now() - FORTY_MIN;
    const body = {
      email: 'dom@readme.io',
    };
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', randomApiKey);
    const output = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    const response = await post(`http://localhost:${PORT}/webhook`, JSON.stringify(body), {
      headers: {
        'readme-signature': output,
        'content-type': 'application/json',
      },
    });
    const responseBody = await getResponseBody(response);

    expect(response.statusCode).toBe(401);
    expect(responseBody.error).toBe('Expired Signature');
  });
});
