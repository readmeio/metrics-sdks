import flatCache from 'flat-cache';
import findCacheDir from 'find-cache-dir';
import crypto from 'crypto';
import pkg from '../../package.json';
import timeoutSignal from 'timeout-signal';
import fetch from 'node-fetch';
import config from '../config';

export async function getProjectBaseUrl(readmeApiKey: string, requestTimeout = config.timeout) {
  const encodedApiKey = Buffer.from(`${readmeApiKey}:`).toString('base64');
  const cacheDir = findCacheDir({ name: pkg.name, create: true });
  const fsSafeApikey = crypto.createHash('md5').update(encodedApiKey).digest('hex');

  // Since we might have differences of cache management, set the package version into the cache key so all caches will
  // automatically get refreshed when the package is updated/installed.
  const cacheKey = `${pkg.name}-${pkg.version}-${fsSafeApikey}`;

  const cache = flatCache.load(cacheKey, cacheDir);

  // Does the cache exist? If it doesn't, let's fill it. If it does, let's see if it's stale. Caches should have a TTL
  // of 1 day.
  const lastUpdated = cache.getKey('lastUpdated');

  if (
    lastUpdated === undefined ||
    (lastUpdated !== undefined && Math.abs(lastUpdated - Math.round(Date.now() / 1000)) >= 86400)
  ) {
    const signal = timeoutSignal(requestTimeout);

    let baseUrl;
    await fetch(`${config.readmeApiUrl}/v1/`, {
      method: 'get',
      headers: {
        Authorization: `Basic ${encodedApiKey}`,
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
      signal,
    })
      .then(res => {
        if (res.status >= 400 && res.status <= 599) {
          throw res;
        }

        return res.json();
      })
      .then(project => {
        baseUrl = project.baseUrl;

        cache.setKey('baseUrl', project.baseUrl);
        cache.setKey('lastUpdated', Math.round(Date.now() / 1000));
      })
      .catch(() => {
        // If unable to access the ReadMe API for whatever reason, let's set the last updated time to two minutes from
        // now yesterday so that in 2 minutes we'll automatically make another attempt.
        cache.setKey('baseUrl', null);
        cache.setKey('lastUpdated', Math.round(Date.now() / 1000) - 86400 + 120);
      })
      .finally(() => {
        timeoutSignal.clear(signal);
      });

    cache.save();

    return baseUrl;
  }

  return cache.getKey('baseUrl');
}
