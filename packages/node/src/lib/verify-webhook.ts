import crypto from 'crypto';

interface WebhookBody {
  email: string;
}

export default function verifyWebhook(body: WebhookBody, signature: string, secret: string): WebhookBody {
  if (!signature) throw new Error('Missing Signature');

  // Inspired by stripe-node
  // https://github.com/stripe/stripe-node/blob/4e82ccafda2017654ac264c070e7ebfa0e662fcd/lib/Webhooks.js#L240-L258
  const expectedScheme = 'v0';
  /* eslint-disable no-param-reassign */
  const { time, readmeSignature } = signature.split(',').reduce(
    (accum, item) => {
      const kv = item.split('=');

      if (kv[0] === 't') {
        accum.time = Number(kv[1]);
      }

      if (kv[0] === expectedScheme) {
        accum.readmeSignature = kv[1];
      }

      return accum;
    },
    {
      time: -1,
      readmeSignature: '',
    },
  );
  /* eslint-enable no-param-reassign */

  // Make sure timestamp is recent to prevent replay attacks
  const THIRTY_MIN = 30 * 60 * 1000;
  if (new Date().getTime() - new Date(+time).getTime() > THIRTY_MIN) {
    throw new Error('Expired Signature');
  }

  // Verify the signature is valid
  const unsigned = `${time}.${JSON.stringify(body)}`;
  const hmac = crypto.createHmac('sha256', secret);
  const verifySignature = hmac.update(unsigned).digest('hex');
  if (verifySignature !== readmeSignature) {
    throw new Error('Invalid Signature');
  }

  return body;
}
