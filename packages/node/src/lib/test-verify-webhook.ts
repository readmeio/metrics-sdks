import crypto from 'crypto';

import fetch from 'node-fetch';

async function verifyWebhook(url, email, secret, opts) {
  if (!url || !email || !secret) {
    throw new Error('Missing required params');
  }

  const time = Date.now();
  const payload = {
    email,
  };

  const headers = {
    'User-Agent': 'readme',
    'content-type': 'application/json',
  };

  if (!opts.unsigned) {
    const unsigned = `${time}.${JSON.stringify(payload)}`;
    const hmac = crypto.createHmac('sha256', secret);
    headers['ReadMe-Signature'] = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;
  }

  const jwtPacketDecoratorObject = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  }).then(res => {
    if (res.status !== 200) throw res;
    return res.json();
  });

  return jwtPacketDecoratorObject;
}

export async function testVerifyWebhook(baseUrl, email, apiKey) {
  const signed = await verifyWebhook(`${baseUrl}/readme-webhook`, email, apiKey, {});
  // TODO: error case if this is an empty object
  try {
    const unsigned = await verifyWebhook(`${baseUrl}/readme-webhook`, email, apiKey, { unsigned: true });

    if (JSON.stringify(unsigned) === JSON.stringify(signed))
      return {
        webhookVerified: false,
      };

    // Might have returned a 200 with an empty object
    return {
      webhookVerified: true,
      user: signed,
    };
  } catch (e) {
    // handled the invalid request properly
    return {
      webhookVerified: true,
      user: signed,
    };
  }
}
