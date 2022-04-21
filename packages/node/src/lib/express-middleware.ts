import type { LogOptions } from './construct-payload';
import type { GroupingObject, OutgoingLogBody } from './metrics-log';
import config from '../config';
import clamp from 'lodash/clamp';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { constructPayload } from './construct-payload';
import { getProjectBaseUrl } from './get-project-base-url';
import { metricsAPICall } from './metrics-log';

// Make sure we flush the queue if the process is exited
let doSend = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
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

/**
 * This middleware will set up Express to automatically log all API requests to ReadMe Metrics.
 *
 * @param apiKey The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication).
 * @param group A function that helps translate incoming request data to our metrics grouping data. You can read more under [Grouping Function](#grouping-function).
 * @param options Additional options. See the documentation for more details.
 * @returns Your Express middleware
 */
export function expressMiddleware(readmeApiKey: string, group: GroupingFunction, options: Options = {}) {
  if (!readmeApiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  // Ensures the buffer length is between 1 and 30
  const bufferLength = clamp(options.bufferLength || config.bufferLength, 1, 30);
  const requestTimeout = config.timeout;
  const encodedApiKey = Buffer.from(`${readmeApiKey}:`).toString('base64');
  let baseLogUrl = options.baseLogUrl || undefined;
  let queue: OutgoingLogBody[] = [];

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
      metricsAPICall(readmeApiKey, json).catch(e => {
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
        {
          ...req,

          // Shallow copying `req` destroys `req.headers` on Node 16 so we're re-adding it.
          headers: req.headers,

          // If you're using route nesting with `express.use()` then `req.url` is contextual to that route. So say
          // you have an `/api` route that loads `/v1/upload`, `req.url` within the `/v1/upload` controller will be
          // `/v1/upload`. Calling `req.originalUrl` ensures that we also capture the `/api` prefix.
          url: req.originalUrl,
        },
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

      cleanup(); // eslint-disable-line @typescript-eslint/no-use-before-define
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
