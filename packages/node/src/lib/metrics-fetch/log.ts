import type { GroupingObject, OutgoingLogBody } from '../shared/metrics-log';
import type { Options } from '../shared/options';

import { randomUUID } from 'node:crypto';

import clamp from 'lodash/clamp';

import config from '../../config';
import { getProjectBaseUrl } from '../shared/get-project-base-url';
import { logger } from '../shared/logger';
import { metricsAPICall } from '../shared/metrics-log';

import { constructPayload } from './construct-payload';
import extractBody from './extract-body';

let queue: OutgoingLogBody[] = [];

export function doSend(readmeApiKey: string, options: Options) {
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

function setDocumentationHeader(res: Response, baseLogUrl: string, logId: string) {
  // This is to catch the potential race condition where `getProjectBaseUrl()`
  // takes longer to respond than the original req/res to finish. Without this
  // we would get an error that would be very difficult to trace. This could
  // do with a test, but it's a little difficult to test. Maybe with a nock()
  // delay timeout.
  const documentationUrl = `${baseLogUrl}/logs/${logId}`;
  logger.verbose({
    message: 'Created URL to your API request log.',
    args: { 'x-documentation-url': documentationUrl },
  });
  res.headers.set('x-documentation-url', documentationUrl);
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
export function log(readmeApiKey: string, req: Request, res: Response, group: GroupingObject, options: Options = {}) {
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

  const requestBody = extractBody(req);
  const responseBody = extractBody(res);

  const payload = constructPayload(
    req,
    res,
    {
      ...group,
      logId,
      startedDateTime,
      responseEndDateTime: new Date(),
      routePath: '',
      responseBody,
      requestBody,
    },
    options,
  );

  queue.push(payload);
  logger.debug({ message: 'Request enqueued.', args: { queue } });
  if (queue.length >= bufferLength) doSend(readmeApiKey, options);

  return logId;
}
