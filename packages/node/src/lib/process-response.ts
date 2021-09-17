import removeProperties from 'lodash/omit';
import removeOtherProperties from 'lodash/pick';

import { objectToArray } from './object-to-array';

// Ignoring the following issue because we're just pulling in the type. We might not want to error at all on no-unresolved when using typescript
// eslint-disable-next-line import/no-unresolved
import { Entry } from 'har-format';
import { LogOptions } from './construct-payload';
import { ServerResponse } from 'http';
import { fixHeader } from './process-request';

export default function processResponse(
  res: ServerResponse,
  responseBody?: string,
  options?: LogOptions
  // We don't need to include all of the har response fields, because the metrics server only cares about a subset
): Entry['response'] {
  // Here we have to reconstruct the body
  // from the string that we've buffered up
  // We have to do this so we can strip out
  // any whitelist/blacklist properties
  const denylist = options.denylist || options.blacklist;
  const allowlist = options.allowlist || options.whitelist;
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
    // TODO: Get these correct
    httpVersion: '',
    cookies: [],
    redirectURL: '',
    headersSize: 0,
    bodySize: 0,
  };
}
