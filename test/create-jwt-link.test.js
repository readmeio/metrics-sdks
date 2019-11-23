const nock = require('nock');
const config = require('../config');

const createJWTLink = require('../lib/create-jwt-link.js');

const apiKey = 'OUW3RlI4gUCwWGpO10srIo2ufdWmMhMH';

describe('#createJwtLink', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  afterEach(() => nock.cleanAll());

  it('should prepend base url if redirect is path', async () => {
    nock(config.readmeUrl)
      .get('/api/v1/')
      .basicAuth({
        user: apiKey,
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'http://readme.readme.io' });

    const jwtLink = await createJWTLink(apiKey, { user: 'marc' }, '/docs');
    expect(jwtLink.startsWith('http://readme.readme.io/docs')).toBeTruthy();
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
    expect(jwtLink.startsWith('http://docs.readme.io/docs')).toBeTruthy();
  });
});
