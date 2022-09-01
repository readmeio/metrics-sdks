import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import net from 'node:net';
import { cwd } from 'node:process';
import { Transform } from 'node:stream';

import { expect } from 'chai';
import getPort from 'get-port';
import 'isomorphic-fetch';

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

const randomApiKey = 'rdme_abcdefghijklmnopqrstuvwxyz';

describe('Metrics SDK Webhook Integration Tests', function () {
  let httpServer;
  let PORT;

  before(async function () {
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

  after(function () {
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

  it('should return with a 401 if the signature is empty/missing', async function () {
    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'dom@readme.io' }),
    });

    expect(response.status).to.equal(401);

    const responseBody = await response.json();
    expect(responseBody.error).to.equal('Missing Signature');
  });

  it('should return an error with an expired signature', async function () {
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

    expect(response.status).to.equal(401);

    const responseBody = await response.json();
    expect(responseBody.error).to.equal('Expired Signature');
  });

  it('should return with a 401 if the signature is not correct', async function () {
    const response = await fetch(`http://localhost:${PORT}/webhook`, {
      method: 'post',
      headers: {
        'readme-signature': `t=${Date.now()},v0=abcdefghjkl`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'dom@readme.io' }),
    });

    expect(response.status).to.equal(401);

    const responseBody = await response.json();
    expect(responseBody.error).to.equal('Invalid Signature');
  });

  it('should return with a user object if the signature is correct', async function () {
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

    expect(response.status).to.equal(200);

    const responseBody = await response.json();
    expect(responseBody).to.deep.equal({
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });
});
