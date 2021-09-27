import url, { URL } from 'url';
import get from 'lodash/get';
import set from 'lodash/set';
import pick from 'lodash/pick';
import merge from 'lodash/merge';
import * as contentType from 'content-type';
// We're just importing types, so we don't need this unresolved.
// eslint-disable-next-line import/no-unresolved
import { Entry } from 'har-format';
import * as qs from 'querystring';

import { objectToArray, searchToArray } from './object-to-array';
import { getProto, LogOptions } from './construct-payload';
import { IncomingMessage } from 'http';

/**
 * Ensure we have a string or undefined response for any header.
 *
 * @param header
 * @returns
 */
export function fixHeader(header: string | number | Array<string>): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  if (Array.isArray(header)) {
    return header.join(',');
  }

  return String(header);
}

/**
 * Redacts a value by replacing it with a string like [REDACTED 6]
 *
 * @param {Any} value the value to be redacted
 * @returns A redacted string potentially containing the length of the original value, if it was a string
 */
function redactValue(value) {
  // eslint-disable-next-line sonarjs/no-nested-template-literals
  return `[REDACTED${typeof value === 'string' ? ` ${value.length}` : ''}]`;
}

/**
 * Redacts all the properties in an object
 *
 * @param {Object} obj The data object that is operated upon
 * @param {String[]} redactedPaths a list of paths that point values which should be redacted
 * @returns An object with the redacted values
 */
function redactProperties(obj, redactedPaths = []) {
  const nextObj = { ...obj };
  return redactedPaths.reduce((acc, path) => {
    const value = get(acc, path);
    if (value !== undefined) set(acc, path, redactValue(value));
    return acc;
  }, nextObj);
}

/**
 * @param {Object} obj The data object that is operated upon
 * @param {Function} cb A callback that is invoked for each value found, the return value being the next value that is set in the returned object
 * @returns An object with the replaced values
 */
function replaceEach(obj, cb) {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      acc[key] = replaceEach(value, cb);
    } else if (value !== undefined) {
      acc[key] = cb(value);
    }
    return acc;
  }, {});
}

/**
 * Redacts everything but the provided fields
 *
 * @param {Object} obj The data object with fields to redact
 * @param {Array} nonRedactedPaths A list of all object paths that shouldn't be redacted
 * @returns A merged objects that is entirely redacted except for the values of the nonRedactedPaths
 */
function redactOtherProperties(obj, nonRedactedPaths) {
  const allowedFields = pick(obj, nonRedactedPaths);
  const redactedFields = obj ? replaceEach(obj, redactValue) : obj;
  return merge(redactedFields, allowedFields);
}

export default function processRequest(
  req: IncomingMessage,
  requestBody?: Record<string, unknown>,
  options?: LogOptions
): Entry['request'] {
  const denylist = options?.denylist || options?.blacklist;
  const allowlist = options?.allowlist || options?.whitelist;
  let reqBody = requestBody;
  // We extrtract this here just in case it's redacted
  const contentTypeHeader = req.headers['content-type'];

  if (denylist) {
    reqBody = redactProperties(reqBody, denylist);
    req.headers = redactProperties(req.headers, denylist);
  }

  if (allowlist && !denylist) {
    reqBody = redactOtherProperties(reqBody, allowlist);
    req.headers = redactOtherProperties(req.headers, allowlist);
  }

  let postData: Entry['request']['postData'] = null;

  if (reqBody && Object.keys(reqBody).length > 0) {
    let mimeType: string = null;
    try {
      mimeType = contentType.parse(contentTypeHeader).type;
    } catch (e) {} // eslint-disable-line no-empty

    // Per HAR, we send JSON as postData.text, not params.
    if (mimeType === 'application/json') {
      postData = {
        mimeType,
        text: JSON.stringify(reqBody),
      };
    } else {
      postData = {
        mimeType,
        params: objectToArray(reqBody),
      };
    }
  }

  const protocol = fixHeader(req.headers['x-forwarded-proto'])?.toLowerCase() || getProto(req);
  const host = fixHeader(req.headers['x-forwarded-host']) || req.headers.host;
  // We use a fake host here because we rely on the host header which could be redacted.
  // We only ever use this reqUrl with the fake hostname for the pathname and querystring.
  const reqUrl = new URL(req.url, `${protocol}://readme.io`);

  return {
    method: req.method,
    url: url.format({
      protocol,
      host,
      pathname: reqUrl.pathname,
      // Search includes the leading questionmark, format assumes there isn't one, so we trim that off.
      query: qs.parse(reqUrl.search.substring(1)),
    }),
    httpVersion: `${getProto(req).toUpperCase()}/${req.httpVersion}`,
    headers: objectToArray(req.headers),
    queryString: searchToArray(reqUrl.searchParams),
    postData,
    // TODO: Get these correct
    cookies: [],
    headersSize: 0,
    bodySize: 0,
  };
}
