const request = require('r2');
const config = require('./config');

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

module.exports.metrics = (apiKey, group, options = {}, cb = () => {}) => {
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
        const json = queue.slice();
        queue = [];
        request
          .post(`${config.host}/v1/request`, {
            headers: { authorization: `Basic ${encoded}` },
            json,
          })
          // We only expose this callback for testing purposes
          .response.catch(e => cb && cb(e));
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
