import removeProperties from 'lodash/omit';
import removeOtherProperties from 'lodash/pick';

import { objectToArray } from './object-to-array';

import { Entry } from 'har-format';
import { LogOptions } from './construct-payload';
import { ServerResponse } from 'http';
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
export default function processResponse(
  res: ServerResponse,
  responseBody?: string,
  options?: LogOptions
): Entry['response'] {
  const denylist = options?.denylist || options?.blacklist;
  const allowlist = options?.allowlist || options?.whitelist;
  let body;
  try {
    body = JSON.parse(responseBody);

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
    statusText: res.statusMessage,
    headers: objectToArray(headers),
    content: {
      text: JSON.stringify(body),
      size: Number(fixHeader(res.getHeader('content-length') || 0)),
      mimeType: fixHeader(res.getHeader('content-type')),
    },
    // TODO: Once readme starts accepting these, send the correct values
    httpVersion: '',
    cookies: [],
    redirectURL: '',
    headersSize: 0,
    bodySize: 0,
  };
}
