import crypto from 'node:crypto';

import { describe, it, expect } from 'vitest';

const PORT = 8000; // SDK HTTP server port
const randomAPIKey = 'rdme_abcdefghijklmnopqrstuvwxyz'; // This must match what's in `docker-compose.yml`.

describe('Metrics SDK Webhook Integration Tests', function () {
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
    const hmac = crypto.createHmac('sha256', randomAPIKey);
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
    const hmac = crypto.createHmac('sha256', randomAPIKey);
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
