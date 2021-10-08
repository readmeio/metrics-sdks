import config from '../config';
import clamp from 'lodash/clamp';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { constructPayload, LogOptions } from './construct-payload';
import { getProjectBaseUrl } from './get-project-base-url';
import { GroupingObject, metricsAPICall, OutgoingLogBody } from './metrics-log';

// Make sure we flush the queue if the process is exited
let doSend = () => {};
process.on('exit', doSend);

export interface GroupingFunction {
  (req, res): GroupingObject;
}

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

export interface Options extends LogOptions {
  bufferLength?: number;
  baseLogUrl?: string;
}

export function expressMiddleware(apiKey: string, group: GroupingFunction, options: Options = {}) {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  // Ensures the buffer length is between 1 and 30
  const bufferLength = clamp(options.bufferLength || config.bufferLength, 1, 30);
  const requestTimeout = config.timeout;
  const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
  let baseLogUrl = options.baseLogUrl || undefined;
  let queue: Array<OutgoingLogBody> = [];

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
      // Copy the queue so we can send all the requests in one batch
      const json = queue.slice();
      // Clear out the queue so we don't resend any data in the future
      queue = [];

      // Make the log call
      metricsAPICall(apiKey, json).catch(e => {
        // Silently discard errors and timeouts.
        if (options.development) throw e;
      });
    };

    function startSend() {
      // This should in future become more sophisticated,
      // with flush timeouts and more error checking but
      // this is fine for now
      const groupData = group(req, res);

      const payload = constructPayload(
        req,
        res,
        {
          ...groupData,
          logId,
          startedDateTime,
          responseEndDateTime: new Date(),
          routePath: req.route
            ? url.format({
                protocol: req.protocol,
                host: req.hostname,
                pathname: `${req.baseUrl}${req.route.path}`,
              })
            : '',
          responseBody: res._body,
          requestBody: req.body,
        },
        options
      );
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
