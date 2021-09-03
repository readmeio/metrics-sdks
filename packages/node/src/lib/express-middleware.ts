import fetch from 'node-fetch';
import timeoutSignal from 'timeout-signal';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import clamp from 'lodash/clamp';
import pkg from '../../package.json';
import { constructPayload, GroupingFunction } from './construct-payload';
import { getProjectBaseUrl } from './get-project-base-url';

// Make sure we flush the queue if the process is exited
let doSend = () => {};
process.on('exit', doSend);

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

export interface Options {
  bufferLength?: number;
  baseLogUrl?: string;
  development?: boolean;
}

export function expressMiddleware(apiKey: string, group: GroupingFunction, options: Options = {}) {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  // Ensures the buffer length is between 1 and 30
  const bufferLength = clamp(options.bufferLength || config.bufferLength, 1, 30);
  const requestTimeout = config.timeout;
  const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
  let baseLogUrl = options.baseLogUrl || undefined;
  let queue = [];

  return async (req, res, next) => {
    if (baseLogUrl === undefined) {
      baseLogUrl = await getProjectBaseUrl(encodedApiKey, requestTimeout);
    }

    const startedDateTime = new Date();
    const logId = uuidv4();

    if (baseLogUrl !== undefined && typeof baseLogUrl === 'string') {
      res.setHeader('x-documentation-url', `${baseLogUrl}/logs/${logId}`);
    }

    patchResponse(res);

    doSend = () => {
      const json = queue.slice();
      queue = [];

      const signal = timeoutSignal(requestTimeout);

      fetch(`${config.host}/v1/request`, {
        method: 'post',
        body: JSON.stringify(json),
        headers: {
          Authorization: `Basic ${encodedApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': `${pkg.name}/${pkg.version}`,
        },
        signal,
      })
        .then(() => {})
        .catch(e => {
          // Silently discard errors and timeouts.
          if (options.development) throw e;
        })
        .finally(() => {
          timeoutSignal.clear(signal);
        });
    };

    function startSend() {
      // This should in future become more sophisticated,
      // with flush timeouts and more error checking but
      // this is fine for now
      const payload = constructPayload(req, res, group, options, { logId, startedDateTime });
      queue.push(payload);
      if (queue.length >= bufferLength) doSend();

      cleanup(); // eslint-disable-line no-use-before-define
    }

    function cleanup() {
      res.removeListener('finish', startSend);
      res.removeListener('error', cleanup);
      res.removeListener('close', cleanup);
    }

    // Add response listeners
    res.once('finish', startSend);
    res.once('error', cleanup);
    res.once('close', cleanup);

    return next();
  };
}
