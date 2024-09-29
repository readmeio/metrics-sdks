import type { LogOptions } from '../shared/options';
import type { Response as HarResponse } from 'har-format';

import removeProperties from 'lodash/omit';
import removeOtherProperties from 'lodash/pick';

import { objectToArray } from '../shared/object-to-array';
import { fixHeader } from '../shared/processing-helpers';

export function headersToObject(requestHeaders: Headers): Record<string, unknown> {
  const headers: Record<string, unknown> = {};
  requestHeaders.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

export function processResponse(res: Response, responseBody?: string, options?: LogOptions): HarResponse {
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

  let headers = headersToObject(res.headers);

  if (denylist) {
    headers = removeProperties(headers, denylist);
  }

  if (allowlist && !denylist) {
    headers = removeOtherProperties(headers, allowlist);
  }

  return {
    status: res.status,
    statusText: res.statusText || '',
    headers: objectToArray(headers, { castToString: true }),
    content: {
      text: JSON.stringify(body),
      size: Number(fixHeader(res.headers.get('content-length') || 0)),
      mimeType: fixHeader(res.headers.get('content-type') || '') || 'text/plain',
    },
    // TODO: Once readme starts accepting these, send the correct values
    httpVersion: '',
    cookies: [],
    redirectURL: '',
    headersSize: 0,
    bodySize: 0,
  };
}
