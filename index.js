const request = require('r2');
const config = require('./config');

const constructPayload = require('./lib/construct-payload');
const createJWTLink = require('./lib/create-jwt-link');
const getReadmeData = require('./lib/get-readme-data');

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

module.exports.metrics = (apiKey, group, options = {}) => {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  const bufferLength = options.bufferLength || config.bufferLength;
  const encoded = Buffer.from(`${apiKey}:`).toString('base64');
  let queue = [];

  return (req, res, next) => {
    const startedDateTime = new Date();
    patchResponse(res);

    function send() {
      // This should in future become more sophisticated,
      // with flush timeouts and more error checking but
      // this is fine for now
      queue.push(constructPayload(req, res, group, options, { startedDateTime }));
      if (queue.length >= bufferLength) {
        request
          .post(`${config.host}/v1/request`, {
            headers: { authorization: `Basic ${encoded}` },
            json: queue,
          })
          .response.then(() => {
            queue = [];
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

module.exports.login = (apiKey, getUser, options = {}) => {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!getUser) throw new Error('You must provide a function to get the user');

  // Make sure api key is valid
  getReadmeData(apiKey);

  return async (req, res, next) => {
    let u;
    try {
      u = getUser(req);
    } catch (e) {
      // User isn't logged in
    }

    if (!u) {
      const domain = req.headers['x-forwarded-host'] || req.get('host');
      const fullUrl = `${req.protocol}://${domain}${req.originalUrl}`;
      return res.redirect(`${options.loginUrl}?redirect=${encodeURIComponent(fullUrl)}`);
    }

    try {
      const jwtUrl = await createJWTLink(apiKey, u, req.query.redirect);
      return res.redirect(jwtUrl);
    } catch (e) {
      return next(e);
    }
  };
};
