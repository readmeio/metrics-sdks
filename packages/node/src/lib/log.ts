import type { LogOptions } from './construct-payload';
import type { GroupingObject, OutgoingLogBody } from './metrics-log';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { StringDecoder } from 'string_decoder';
import * as url from 'url';

import clamp from 'lodash/clamp';
import { v4 as uuidv4 } from 'uuid';

import config from '../config';

import { constructPayload } from './construct-payload';
import isRequest from './is-request';
import { metricsAPICall } from './metrics-log';

let queue: OutgoingLogBody[] = [];
function doSend(readmeApiKey, options) {
  // Copy the queue so we can send all the requests in one batch
  const json = [...queue];
  // Clear out the queue so we don't resend any data in the future
  queue = [];

  // Make the log call
  metricsAPICall(readmeApiKey, json).catch(e => {
    // Silently discard errors and timeouts.
    if (options.development) throw e;
  });
}
// Make sure we flush the queue if the process is exited
process.on('exit', doSend);

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

interface ExtendedResponse extends ServerResponse {
  _body?: string;
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

/**
 * For `text/*` requests Express doesn't give us a native way to retrieve data out of the payload
 * without using the `body-parser` middleware so we need to workaround it and access that obtain
 * that data ourselves.
 *
 * For `application/vnd.api+json` types of requests, Express doesn't recognize them as being JSON,
 * resulting in `req.body` being empty. Frustratingly enough `req.is('json')` also doesn't work so
 * we need to do our own check to look if it's got `+json` and then surface that potential JSON
 * payload accordingly.
 *
 * And if you can believe it or not, Express also doesn't process `x-www-form-urlencoded` payloads
 * into `req.body` for us without the `body-parser` middleware.
 *
 * @see {@link https://stackoverflow.com/a/12497793}
 * @see {@link https://stackoverflow.com/a/58568473}
 * @param {IncomingMessage} req
 */
function patchRequest(req: ExtendedIncomingMessage) {
  // If we already have a body then whatever framework we're being run inside of is able to
  // handle these requests and we can rely on `req.body` instead hacky workarounds.
  if (req.body !== undefined) {
    return;
  }

  if (isRequest(req, 'text/*')) {
    req._text = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
      if (chunk) req._text += chunk;
    });
  } else if (isRequest(req, '+json')) {
    req._json = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
      if (chunk) req._json += chunk;
    });
  } else if (isRequest(req, 'application/x-www-form-urlencoded')) {
    const decoder = new StringDecoder('utf-8');
    req._form_encoded = '';

    req.on('data', chunk => {
      req._form_encoded += decoder.write(chunk);
    });

    req.on('end', () => {
      req._form_encoded += decoder.end();
    });
  }
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
export function log(
  readmeApiKey: string,
  req: ExtendedIncomingMessage,
  res: ExtendedResponse,
  group: GroupingObject,
  options: Options = {}
) {
  if (!readmeApiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a group');

  // Ensures the buffer length is between 1 and 30
  const bufferLength = clamp(options.bufferLength || config.bufferLength, 1, 30);

  const baseLogUrl = options.baseLogUrl || undefined;

  const startedDateTime = new Date();
  const logId = uuidv4();

  patchResponse(res);
  patchRequest(req);

  // @todo we should remove this and put this in the code samples
  if (baseLogUrl !== undefined && typeof baseLogUrl === 'string') {
    res.setHeader('x-documentation-url', `${baseLogUrl}/logs/${logId}`);
  }

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
      options
    );

    queue.push(payload);
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
