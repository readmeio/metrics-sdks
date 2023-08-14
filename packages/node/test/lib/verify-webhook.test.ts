import crypto from 'crypto';

import { expect } from 'chai';

import verifyWebhook from '../../src/lib/verify-webhook';

describe('verifyWebhook', function () {
  it('should return the body if the signature is valid', function () {
    const body = { email: 'marc@readme.io' };
    const secret = 'docs4dayz';
    const time = Date.now();
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signature = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    const verifiedBody = verifyWebhook(body, signature, secret);
    expect(verifiedBody).to.deep.equal(body);
  });

  it('should throw an error if signature is invalid', function () {
    const body = { email: 'marc@readme.io' };
    const secret = 'docs4dayz';
    const time = Date.now();
    const unsigned = `${time}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', 'invalidsecret');
    const signature = `t=${time},v0=${hmac.update(unsigned).digest('hex')}`;

    expect(() => {
      verifyWebhook(body, signature, secret);
    }).to.throw(/Invalid Signature/);
  });

  it('should throw an error if timestamp is too old', function () {
    const body = { email: 'marc@readme.io' };
    const secret = 'docs4dayz';
    const time = new Date();
    time.setHours(time.getHours() - 1);
    const unsigned = `${time.getTime()}.${JSON.stringify(body)}`;
    const hmac = crypto.createHmac('sha256', secret);
    const signature = `t=${time.getTime()},v0=${hmac.update(unsigned).digest('hex')}`;

    expect(() => {
      verifyWebhook(body, signature, secret);
    }).to.throw(/Expired Signature/);
  });

  it('should throw an error if signature is missing', function () {
    const body = { email: 'marc@readme.io' };
    const secret = 'docs4dayz';
    const signature = '';

    expect(() => {
      verifyWebhook(body, signature, secret);
    }).to.throw(/Missing Signature/);
  });

  it('should throw an error if signature is undefined', function () {
    const body = { email: 'marc@readme.io' };
    const secret = 'docs4dayz';

    expect(() => {
      verifyWebhook(body, undefined, secret);
    }).to.throw(/Missing Signature/);
  });
});
