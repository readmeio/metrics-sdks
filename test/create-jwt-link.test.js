/* eslint-env mocha */
const nock = require('nock');
const assert = require('assert');
const config = require('../config');

const createJWTLink = require('../lib/create-jwt-link.js');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('#createJwtLink', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  it('should error if missing apiKey', async () => {
    try {
      await createJWTLink();
    } catch (e) {
      return assert.equal(e.message, 'You must provide your ReadMe API key');
    }
    return assert(false);
  });

  it('should error if missing user function', async () => {
    try {
      await createJWTLink(apiKey);
    } catch (e) {
      return assert.equal(e.message, 'You must provide a user object');
    }
    return assert(false);
  });

  it('should prepend base url if redirect is path', async () => {
    nock(config.readmeUrl)
      .get('/api/v1/')
      .basicAuth({
        user: apiKey,
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'http://readme.readme.io' });

    const jwtLink = await createJWTLink(apiKey, { user: 'marc' }, '/docs');
    assert(jwtLink.startsWith('http://readme.readme.io/docs'));
  });

  it('should not prepend base url if redirect is full url', async () => {
    nock(config.readmeUrl)
      .get('/api/v1/')
      .basicAuth({
        user: apiKey,
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'http://readme.readme.io' });

    const jwtLink = await createJWTLink(apiKey, { user: 'marc' }, 'http://docs.readme.io/docs');
    assert(jwtLink.startsWith('http://docs.readme.io/docs'));
  });
});
