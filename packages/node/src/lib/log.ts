import type { LogOptions } from './construct-payload';
import type { GroupingObject, OutgoingLogBody } from './metrics-log';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { randomUUID } from 'node:crypto';
import * as url from 'url';

import clamp from 'lodash/clamp';

import config from '../config';

import { constructPayload } from './construct-payload';
import { getProjectBaseUrl } from './get-project-base-url';
import isRequest from './is-request';
import { logger } from './logger';
import { metricsAPICall } from './metrics-log';
import { patchRequest } from './patch-request';
import { patchResponse } from './patch-response';

let queue: OutgoingLogBody[] = [];
function doSend(readmeApiKey: string, options: Options) {
  // Copy the queue so we can send all the requests in one batch
  const json = [...queue];
  // Clear out the queue so we don't resend any data in the future
  queue = [];

  // Make the log call
  metricsAPICall(readmeApiKey, json, options).catch(err => {
    // Silently discard errors and timeouts.
    if (options.development) {
      logger.error({ message: 'Failed to capture API request.', err });
    }
  });

  logger.debug({ message: 'Queue flushed.', args: { queue } });
}
// Make sure we flush the queue if the process is exited
process.on('exit', doSend);

/* eslint-disable typescript-sort-keys/interface */
export interface ExtendedIncomingMessage extends IncomingMessage {
  /*
   * This is where most body-parsers put the parsed HTTP body
   * but it is not part of Node's builtin. We expect the body
   * to be parsed by the time it gets passed to us
   */
  body?: Record<string, unknown> | string;

  // These are all express additions to Node's builtin type
  route?: {
    path: string;
  };
  protocol?: string;
  baseUrl?: string;
  hostname?: string;
  originalUrl?: string;

  // These are custom properties that we're adding to counter quirks with Express handling of
  // certain types of payloads where they require the `body-parser` library to be present.
  _text?: string;
  _json?: string;
  _form_encoded?: string;
}
/* eslint-enable typescript-sort-keys/interface */

export interface ExtendedResponse extends ServerResponse {
  _body?: string;
}

export interface Options extends LogOptions {
  baseLogUrl?: string;
  bufferLength?: number;
  disableMetrics?: boolean;
  disableWebhook?: boolean;
}

function setDocumentationHeader(res: ServerResponse, baseLogUrl: string, logId: string) {
  // This is to catch the potential race condition where `getProjectBaseUrl()`
  // takes longer to respond than the original req/res to finish. Without this
  // we would get an error that would be very difficult to trace. This could
  // do with a test, but it's a little difficult to test. Maybe with a nock()
  // delay timeout.
  if (res.headersSent) return;
  const documentationUrl = `${baseLogUrl}/logs/${logId}`;
  logger.verbose({
    message: 'Created URL to your API request log.',
    args: { 'x-documentation-url': documentationUrl },
  });
  res.setHeader('x-documentation-url', documentationUrl);
}

/**
 * This method will send supplied API requests to ReadMe Metrics.
 *
 * @see {@link https://readme.com/metrics}
 * @see {@link https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs}
 * @param readmeApiKey The API key for your ReadMe project. This ensures your requests end up in
 *    your dashboard. You can read more about the API key in
 *    [our docs](https://docs.readme.com/reference/authentication).
 * @param req This is your incoming request object from your HTTP server and/or framework.
 * @param res This is your outgoing response object for your HTTP server and/or framework.
 * @param group A function that helps translate incoming request data to our metrics grouping data.
 * @param options Additional options. See the documentation for more details.
 */
export function log(
  readmeApiKey: string,
  req: ExtendedIncomingMessage,
  res: ExtendedResponse,
  group: GroupingObject,
  options: Options = {},
) {
  if (req.method === 'OPTIONS') return undefined;
  if (!readmeApiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a group');
  if (options.logger) {
    if (typeof options.logger === 'boolean') logger.configure({ isLoggingEnabled: true });
    else logger.configure({ isLoggingEnabled: true, strategy: options.logger });
  }

  // Ensures the buffer length is between 1 and 30
  const bufferLength = clamp(options.bufferLength || config.bufferLength, 1, 30);

  const startedDateTime = new Date();
  const logId = randomUUID();

  // baseLogUrl can be provided, but if it isn't then we
  // attempt to fetch it from the ReadMe API
  if (typeof options.baseLogUrl === 'string') {
    setDocumentationHeader(res, options.baseLogUrl, logId);
  } else {
    getProjectBaseUrl(readmeApiKey).then(baseLogUrl => {
      setDocumentationHeader(res, baseLogUrl, logId);
    });
  }

  patchResponse(res);
  patchRequest(req);

  /*
   * This should in future become more sophisticated, with flush timeouts and more error checking but
   * this is fine for now
   */
  function startSend() {
    let requestBody = req.body;
    if (isRequest(req, 'text/*')) {
      if ('_text' in req) {
        requestBody = req._text;
      }
    } else if (isRequest(req, '+json')) {
      if ('_json' in req) {
        requestBody = req._json;
      }
    } else if (isRequest(req, 'application/x-www-form-urlencoded')) {
      if ('_form_encoded' in req) {
        requestBody = req._form_encoded;
      }
    }

    const payload = constructPayload(
      req,
      res,
      {
        ...group,
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
        requestBody,
      },
      options,
    );

    queue.push(payload);
    logger.debug({ message: 'Request enqueued.', args: { queue } });
    if (queue.length >= bufferLength) doSend(readmeApiKey, options);

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
  return logId;
}
