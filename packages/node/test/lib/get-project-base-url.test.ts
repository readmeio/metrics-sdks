import { expect } from 'chai';
import nock from 'nock';

import pkg from '../../package.json';
import { getProjectBaseUrl } from '../../src';
import config from '../../src/config';
import { getCache } from '../../src/lib/get-project-base-url';

const apiKey = 'mockReadMeApiKey';
const baseLogUrl = 'https://docs.example.com';

// eslint-disable-next-line mocha/no-exports
export function getReadMeApiMock(numberOfTimes: number, baseUrl = baseLogUrl) {
  return nock(config.readmeApiUrl, {
    reqheaders: {
      'User-Agent': `${pkg.name}/${pkg.version}`,
    },
  })
    .get('/v1/')
    .basicAuth({ user: apiKey })
    .times(numberOfTimes)
    .reply(200, { baseUrl });
}

function hydrateCache(lastUpdated: number) {
  const cache = getCache(apiKey);

  cache.setKey('lastUpdated', lastUpdated);
  cache.setKey('baseUrl', baseLogUrl);
  cache.save();
}

describe('get-project-base-url', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(function () {
    nock.cleanAll();

    getCache(apiKey).destroy();
  });

  it('should not call the API for project data if the cache is fresh', async function () {
    const apiMock = getReadMeApiMock(1);

    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);
    const lastUpdated = getCache(apiKey).getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('lastUpdated')).to.deep.equal(lastUpdated);
    apiMock.done();
  });

  it('should populate the cache if not present', async function () {
    const apiMock = getReadMeApiMock(1);

    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);

    apiMock.done();
  });

  it('should refresh the cache if stale', async function () {
    const apiMock = getReadMeApiMock(1);

    // Hydrate and postdate the cache to two days ago so it'll be seen as stale.
    hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);

    const lastUpdated = getCache(apiKey).getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);
    expect(getCache(apiKey).getKey('lastUpdated')).not.to.deep.equal(lastUpdated);

    apiMock.done();
  });

  it('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async function () {
    const apiMock = nock(config.readmeApiUrl, {
      reqheaders: {
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
    })
      .get('/v1/')
      .basicAuth({ user: apiKey })
      .reply(401, {
        error: 'APIKEY_NOTFOUNDD',
        message: "We couldn't find your API key",
        suggestion:
          "The API key you passed in (moc··········Key) doesn't match any keys we have in our system. API keys must be passed in as the username part of basic auth>",
        docs: 'https://docs.readme.com/developers/logs/fake-uuid',
        help: "If you need help, email support@readme.io and mention log 'fake-uuid'.",
      });

    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(null);

    apiMock.done();
  });
});
