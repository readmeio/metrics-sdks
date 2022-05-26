import nock from 'nock';
import findCacheDir from 'find-cache-dir';
import rimraf from 'rimraf';
import flatCache from 'flat-cache';
import { createHash } from 'crypto';

import config from '../../src/config';
import pkg from '../../package.json';
import { getProjectBaseUrl } from '../../src';

const apiKey = 'mockReadMeApiKey';
const baseLogUrl = 'https://docs.example.com';
const cacheDir = findCacheDir({ name: pkg.name });

// eslint-disable-next-line jest/no-export
export function getReadMeApiMock(numberOfTimes, baseUrl = baseLogUrl) {
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

function getCache() {
  const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
  const fsSafeApikey = createHash('md5').update(encodedApiKey).digest('hex');
  const cacheKey = [pkg.name, pkg.version, fsSafeApikey].join('-');

  return flatCache.load(cacheKey, cacheDir);
}

function hydrateCache(lastUpdated) {
  const cache = getCache();

  // Postdate the cache to two days ago so it'll bee seen as stale.
  cache.setKey('lastUpdated', lastUpdated);
  cache.setKey('baseUrl', baseLogUrl);
  cache.save();
}

beforeEach(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {
  nock.cleanAll();

  // Clean up the cache dir between tests.
  rimraf.sync(cacheDir);
});

test('should not call the API for project data if the cache is fresh', async () => {
  const apiMock = getReadMeApiMock(1);

  await getProjectBaseUrl(apiKey, 2000);
  expect(getCache().getKey('baseUrl')).toBe(baseLogUrl);
  const lastUpdated = getCache().getKey('lastUpdated');

  await getProjectBaseUrl(apiKey, 2000);
  expect(getCache().getKey('lastUpdated')).toBe(lastUpdated);
  apiMock.done();
});

test('should populate the cache if not present', async () => {
  const apiMock = getReadMeApiMock(1);

  await getProjectBaseUrl(apiKey, 2000);
  expect(getCache().getKey('baseUrl')).toBe(baseLogUrl);

  apiMock.done();
});

test('should refresh the cache if stale', async () => {
  const apiMock = getReadMeApiMock(1);

  // Hydrate and postdate the cache to two days ago so it'll be seen as stale.
  hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));
  expect(getCache().getKey('baseUrl')).toBe(baseLogUrl);

  const lastUpdated = getCache().getKey('lastUpdated');
  await getProjectBaseUrl(apiKey, 2000);
  expect(getCache().getKey('baseUrl')).toBe(baseLogUrl);
  expect(getCache().getKey('lastUpdated')).not.toBe(lastUpdated);

  apiMock.done();
});

test('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async () => {
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
        "The API key you passed in (moc··········Key) doesn't match any keys we have in our system. API keys must be passed in as the username part of basic auth. You can get your API key in Configuration > API Key, or in the docs.",
      docs: 'https://docs.readme.com/developers/logs/fake-uuid',
      help: "If you need help, email support@readme.io and mention log 'fake-uuid'.",
    });

  await getProjectBaseUrl(apiKey, 2000);
  expect(getCache().getKey('baseUrl')).toBeNull();

  apiMock.done();
});
