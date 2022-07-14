const crypto = require('crypto');

interface WebhookBody {
  email: String;
}

export function verify(body: WebhookBody, signature: string, secret: string): WebhookBody {
  const [fullMatch, time, readmeSignature] = /^t\=(.*){1},v0\=(.*)/.exec(signature);
  
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
