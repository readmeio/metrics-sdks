import 'isomorphic-fetch';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { cwd } from 'process';

import getPort from 'get-port';

if (!process.env.EXAMPLE_SERVER) {
  // eslint-disable-next-line no-console
  console.error('Missing `EXAMPLE_SERVER` environment variable');
  process.exit(1);
}

const randomApiKey = 'rdme_abcdefghijklmnopqrstuvwxyz';

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
      detached: true,
      env: {
        README_API_KEY: randomApiKey,
        PORT,
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
  });

  it('should return with a 401 if the signature is empty/missing', async () => {
    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'dom@readme.io' }),
    });

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.error).toBe('Missing Signature');
  });

  it('should return an error with an expired signature', async () => {
    // The expiry time for the HMAC is 30 mins, so here we're
    // creating an expired one which is 40 mins old
    const FORTY_MIN = 40 * 60 * 1000;
    const time = Date.now() - FORTY_MIN;
    const body = {
      email: 'dom@readme.io',
    };
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', randomApiKey);
    const output = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'readme-signature': output,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.error).toBe('Expired Signature');
  });

  it('should return with a 401 if the signature is not correct', async () => {
    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'readme-signature': `t=${Date.now()},v0=abcdefghjkl`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'dom@readme.io' }),
    });

    expect(response.status).toBe(401);

    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid Signature');
  });

  it('should return with a user object if the signature is correct', async () => {
    const time = Date.now();
    const body = {
      email: 'dom@readme.io',
    };
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', randomApiKey);
    const output = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'readme-signature': output,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });
});
