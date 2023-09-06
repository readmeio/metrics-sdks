import type { LogOptions } from './construct-payload';
import type { Response } from 'har-format';
import type { ServerResponse } from 'http';

import { STATUS_CODES } from 'http';

import removeProperties from 'lodash/omit';
import removeOtherProperties from 'lodash/pick';

import { objectToArray } from './object-to-array';
import { fixHeader } from './process-request';

/**
 * Transforms the provided ServerResponse and additional information into the appropriate HAR structure
 *
 * @param res The node ServerResponse object
 * @param responseBody A string representation of the response body
 * @param options A collection of additional options. See the documentation for more details.
 *
 * @returns The HAR formatted response details
 */
export default function processResponse(res: ServerResponse, responseBody?: string, options?: LogOptions): Response {
  const denylist = options?.denylist || options?.blacklist;
  const allowlist = options?.allowlist || options?.whitelist;
  let body;
  try {
    body = JSON.parse(responseBody || '');

    // Only apply blacklist/whitelist if it's an object
    if (denylist) {
      body = removeProperties(body, denylist);
    }

    if (allowlist && !denylist) {
      body = removeOtherProperties(body, allowlist);
    }
  } catch (e) {
    // Non JSON body
    body = responseBody;
  }

  let headers = res.getHeaders();

  if (denylist) {
    headers = removeProperties(headers, denylist);
  }

  if (allowlist && !denylist) {
    headers = removeOtherProperties(headers, allowlist);
  }

  return {
    status: res.statusCode,
    // In fastify, at the point where we have to fetch the statusMessage
    // from the response, it is not set because the headers haven't been
    // flushed yet, so we need to fetch the default value from Node.
    // https://nodejs.org/dist/latest-v14.x/docs/api/http.html#http_response_statusmessage
    //
    // This is the same thing that Node.js does internally:
    // https://github.com/nodejs/node/blob/9b8ba2536044ae08a1cd747a3aa52df7d1815e7e/lib/_http_server.js#L318
    statusText: res.statusMessage || STATUS_CODES[res.statusCode] || '',
    headers: objectToArray(headers, { castToString: true }),
    content: {
      text: JSON.stringify(body),
      size: Number(fixHeader(res.getHeader('content-length') || 0)),
      mimeType: fixHeader(res.getHeader('content-type') || '') || 'text/plain',
    },
    // TODO: Once readme starts accepting these, send the correct values
    httpVersion: '',
    cookies: [],
    redirectURL: '',
    headersSize: 0,
    bodySize: 0,
  };
}
