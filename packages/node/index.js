const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const config = require('./config');
const flatCache = require('flat-cache');
const findCacheDir = require('find-cache-dir');
const pkg = require('./package.json');

console.logx = obj => {
  console.log(require('util').inspect(obj, false, null, true /* enable colors */))
}

const constructPayload = require('./lib/construct-payload');

// We're doing this to buffer up the response body
// so we can send it off to the metrics server
// It's unfortunate that this isn't accessible
// natively. This may take up lots of memory on
// big responses, we can make it configurable in future
function patchResponse(res) {
  const { write, end } = res;

  res._body = '';

  res.write = (chunk, encoding, cb) => {
    res._body += chunk;
    write.call(res, chunk, encoding, cb);
  };

  res.end = (chunk, encoding, cb) => {
    // Chunk is optional in res.end
    // http://nodejs.org/dist/latest/docs/api/http.html#http_response_end_data_encoding_callback
    if (chunk) res._body += chunk;
    end.call(res, chunk, encoding, cb);
  };
}

async function getProjectBaseUrl(encodedApiKey, options) {
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
    let baseUrl;
    // await fetch(`${config.readmeApiUrl}/v1/`, {
    await fetch(`http://localhost:3000/readme-api/v1/`, {
      method: 'get',
      headers: {
        Authorization: `Basic ${encodedApiKey}`,
        'User-Agent': `${pkg.name}/${pkg.version}`,
      },
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
      .catch(err => {
        if (options.development && (res.status >= 400 && res.status <= 599)) {
          throw err;
        }

        // If unable to access the ReadMe API for whatever reason, let's set the last updated time to two minutes from
        // now yesterday so that in 2 minutes we'll automatically make another attempt.
        cache.setKey('baseUrl', null);
        cache.setKey('lastUpdated', Math.round(Date.now() / 1000) - 86400 + 120);
      });

    cache.save();

    return baseUrl;
  }

  return cache.getKey('baseUrl');
}

module.exports.metrics = (apiKey, group, options = {}) => {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  const bufferLength = options.bufferLength || config.bufferLength;
  const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
  let baseLogUrl = options.baseLogUrl || undefined;
  let queue = [];

  return async (req, res, next) => {
    if (baseLogUrl === undefined) {
      baseLogUrl = await getProjectBaseUrl(encodedApiKey, options);
    }

    const startedDateTime = new Date();
    const logId = uuidv4();

    if (baseLogUrl !== undefined && typeof baseLogUrl === 'string') {
      res.setHeader('x-documentation-url', `${baseLogUrl}/logs/${logId}`);
    }

    patchResponse(res);

    function send() {
      // This should in future become more sophisticated,
      // with flush timeouts and more error checking but
      // this is fine for now
      const payload = constructPayload(req, res, group, options, { logId, startedDateTime });
      queue.push(payload);
      if (queue.length >= bufferLength) {
        const json = queue.slice();
        queue = [];
        // fetch(`${config.host}/v1/request`, {
        fetch(`http://localhost:3000/metrics-api/v1/request`, {
          method: 'post',
          body: JSON.stringify(json),
          headers: {
            Authorization: `Basic ${encodedApiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': `${pkg.name}/${pkg.version}`,
          },
        })
          .then(async (res) => {
            // If we're running in development or unit test mode, toss any errors that happen when we try to call the
            // API.
            if (options.development && (res.status >= 400 && res.status <= 599)) {
              throw res;
            }
          });
      }

      cleanup(); // eslint-disable-line no-use-before-define
    }

    function cleanup() {
      res.removeListener('finish', send);
      res.removeListener('error', cleanup);
      res.removeListener('close', cleanup);
    }

    // Add response listeners
    res.once('finish', send);
    res.once('error', cleanup);
    res.once('close', cleanup);

    return next();
  };
};
