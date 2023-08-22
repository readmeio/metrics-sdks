import { expect } from 'chai';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { getProjectBaseUrl } from '../../src';
import config from '../../src/config';
import { getCache } from '../../src/lib/get-project-base-url';
import getReadMeApiMock from '../helpers/getReadMeApiMock';

const apiKey = 'mockReadMeApiKey';
const baseLogUrl = 'https://docs.example.com';

const restHandlers = [getReadMeApiMock(baseLogUrl)];

const server = setupServer(...restHandlers);

function hydrateCache(lastUpdated: number) {
  const cache = getCache(apiKey);

  cache.setKey('lastUpdated', lastUpdated);
  cache.setKey('baseUrl', baseLogUrl);
  cache.save();
}

describe('get-project-base-url', function () {
  before(function () {
    server.listen({ onUnhandledRequest: 'error' });
  });

  //  Close server after all tests
  after(function () {
    server.close();
  });

  afterEach(function () {
    server.resetHandlers();

    getCache(apiKey).destroy();
  });

  it('should not call the API for project data if the cache is fresh', async function () {
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);
    const lastUpdated = getCache(apiKey).getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('lastUpdated')).to.deep.equal(lastUpdated);
  });

  it('should populate the cache if not present', async function () {
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);
  });

  it('should refresh the cache if stale', async function () {
    // Hydrate and postdate the cache to two days ago so it'll be seen as stale.
    hydrateCache(Math.round(Date.now() / 1000 - 86400 * 2));
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);

    const lastUpdated = getCache(apiKey).getKey('lastUpdated');
    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(baseLogUrl);
    expect(getCache(apiKey).getKey('lastUpdated')).not.to.deep.equal(lastUpdated);
  });

  it('should temporarily set baseUrl to null if the call to the ReadMe API fails for whatever reason', async function () {
    server.use(
      rest.get(`${config.readmeApiUrl}/v1`, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            error: 'APIKEY_NOTFOUND',
            message: "We couldn't find your API key",
            suggestion:
              "The API key you passed in (moc··········Key) doesn't match any keys we have in our system. API keys must be passed in as the username part of basic auth>",
            docs: 'https://docs.readme.com/developers/logs/fake-uuid',
            help: "If you need help, email support@readme.io and mention log 'fake-uuid'.",
          })
        );
      })
    );

    await getProjectBaseUrl(apiKey, 2000);
    expect(getCache(apiKey).getKey('baseUrl')).to.deep.equal(null);
  });
});
