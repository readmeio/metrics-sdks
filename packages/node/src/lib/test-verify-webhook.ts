import crypto from 'crypto';

import pkg from '../../package.json';

async function verifyWebhook(url: string, email: string, secret: string, opts = { unsigned: false }) {
  if (!url || !email || !secret) {
    throw new Error('Missing required params');
  }

  const time = Date.now();
  const payload = {
    email,
  };

  const headers = new Headers({
    'User-Agent': `${pkg.name}/${pkg.version}`,
    'content-type': 'application/json',
  });

  if (!opts.unsigned) {
    const unsigned = `${time}.${JSON.stringify(payload)}`;
    const hmac = crypto.createHmac('sha256', secret);
    headers.set('ReadMe-Signature', `t=${time},v0=${hmac.update(unsigned).digest('hex')}`);
  }

  const jwtPacketDecoratorObject = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  }).then(res => {
    if (res.status !== 200) {
      return (res.json() as Promise<{ error: string }>).then(json => {
        throw new Error(json.error);
      });
    }
    return res.json();
  });

  return jwtPacketDecoratorObject;
}

export async function testVerifyWebhook(baseUrl: string, email: string, apiKey: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let signed: any; /** @fixme give this a better type */
  try {
    signed = await verifyWebhook(`${baseUrl}/readme-webhook`, email, apiKey);
  } catch (e) {
    return {
      webhookError: 'FAILED_VERIFY',
      error: (e as Error).message,
    };
  }

  try {
    const unsigned = await verifyWebhook(`${baseUrl}/readme-webhook`, email, apiKey, { unsigned: true });

    if (JSON.stringify(unsigned) === JSON.stringify(signed)) {
      return {
        webhookError: 'UNVERIFIED',
      };
    }

    // Should never reach here
    return {
      webhookError: 'UNKNOWN',
    };
  } catch (e) {
    // Webhook correctly failed with unsigned request

    // Make sure we actually have a user we got back
    if (JSON.stringify(signed) === JSON.stringify({})) {
      return {
        webhookError: 'EMPTY_USER',
      };
    }

    // Required to have a keys array
    if (!signed.keys) {
      return {
        webhookError: 'MISSING_KEYS',
        user: signed,
      };
    }

    // We can do more validation here
    return {
      user: signed,
    };
  }
}
