import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, beforeAll, afterAll, afterEach, expect, it } from 'vitest';

import { getProjectBaseUrl } from '../../src';
import config from '../../src/config';
import { getCache, cache } from '../../src/lib/get-project-base-url';
import getReadMeApiMock from '../helpers/getReadMeApiMock';

const apiKey = 'mockReadMeApiKey';
const baseLogUrl = 'https://docs.example.com';

const restHandlers = [getReadMeApiMock(baseLogUrl)];

const server = setupServer(...restHandlers);

function hydrateCache(lastUpdated: number) {
  getCache(apiKey);

  cache.setKey('lastUpdated', lastUpdated);
  cache.setKey('baseUrl', baseLogUrl);
  cache.save();
}

describe('get-project-base-url', function () {
  beforeAll(function () {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(function () {
    server.resetHandlers();

    getCache(apiKey);
    cache.destroy();
  });

  //  Close server after all tests
  afterAll(function () {
    server.close();
  });

  it('should not call the API for project data if the cache is fresh', async function () {
    await getProjectBaseUrl(apiKey, 2000);
    expect(cache.getKey('baseUrl')).toStrictEqual(baseLogUrl);
    const lastUpdated = cache.getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(cache.getKey('lastUpdated')).toStrictEqual(lastUpdated);
  });

  it('should populate the cache if not present', async function () {
    await getProjectBaseUrl(apiKey, 2000);
    expect(cache.getKey('baseUrl')).toStrictEqual(baseLogUrl);
  });

  it('should refresh the cache if stale', async function () {
    // Hydrate and postdate the cache to two days ago so it'll be seen as stale.
    hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));
    expect(cache.getKey('baseUrl')).toStrictEqual(baseLogUrl);

    const lastUpdated = cache.getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(cache.getKey('baseUrl')).toStrictEqual(baseLogUrl);
    expect(cache.getKey('lastUpdated')).not.toStrictEqual(lastUpdated);
  });

  it('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async function () {
    server.use(
      http.get(`${config.readmeApiUrl}/v1`, () => {
        return HttpResponse.json(
          {
            error: 'APIKEY_NOTFOUND',
            message: "We couldn't find your API key",
            suggestion:
              "The API key you passed in (moc··········Key) doesn't match any keys we have in our system. API keys must be passed in as the username part of basic auth>",
            docs: 'https://docs.readme.com/developers/logs/fake-uuid',
            help: "If you need help, email support@readme.io and mention log 'fake-uuid'.",
          },
          { status: 401 },
        );
      }),
    );

    await getProjectBaseUrl(apiKey, 2000);
    expect(cache.getKey('baseUrl')).toBeNull();
  });
});
