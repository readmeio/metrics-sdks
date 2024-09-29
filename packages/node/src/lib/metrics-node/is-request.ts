import type { ExtendedIncomingMessage } from './log';

import typeis from 'type-is';

/**
 * Check if a request matches a given `Content-Type` or a content type family.
 *
 * Examples:
 *
 *      // With Content-Type: text/html; charset=utf-8
 *      req.is('html');
 *      req.is('text/html');
 *      req.is('text/*');
 *      // => true
 *
 *      // When Content-Type is application/json
 *      req.is('json');
 *      req.is('application/json');
 *      req.is('application/*');
 *      // => true
 *
 *      req.is('html');
 *      // => false
 *
 * @see {@link https://github.com/expressjs/express/blob/master/lib/request.js#L252-L290}
 */
export default function isRequest(req: ExtendedIncomingMessage, type: string) {
  return !!typeis(req, type);
}
