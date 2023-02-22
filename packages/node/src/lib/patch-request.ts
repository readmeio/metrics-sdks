import type { ExtendedIncomingMessage } from './log';

import { StringDecoder } from 'string_decoder';

import isRequest from './is-request';

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
export function patchRequest(req: ExtendedIncomingMessage) {
  // If we already have a body then whatever framework we're being run inside of is able to
  // handle these requests and we can rely on `req.body` instead hacky workarounds.
  if (req.body !== undefined) {
    return;
  }

  if (isRequest(req, 'text/*')) {
    req._text = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      if (chunk) req._text += chunk;
    });
  } else if (isRequest(req, '+json')) {
    req._json = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
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
