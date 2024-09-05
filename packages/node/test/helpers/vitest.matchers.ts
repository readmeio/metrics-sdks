import { isValidUUIDV4 } from 'is-valid-uuid-v4';
import { expect } from 'vitest';

interface CustomMatchers<R = unknown> {
  /**
   * Assert that a given URL is a valid URL.
   */
  toBeAURL(): R;

  /**
   * Assert that a request has our `x-documentation-url` header and that contains a valid v4 UUID.
   */
  toHaveADocumentationHeader(baseLogUrl: string): R;

  /**
   * Assert that a given HAR `headers` array has a given header matching a specific value.
   */
  toHaveHeader(header: string, expected: RegExp | string): R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Converts an array of headers like this:
 *
 *  [
 *    { name: 'host', value: 'localhost:49914' },
 *    { name: 'connection', value: 'close' },
 *  ];
 *
 * To a flattened object:
 *
 *  {
 *    host: 'localhost:49914',
 *    connection: 'close'
 *  }
 */
function arrayToObject(array: { name: string; value: string }[]): Record<string, string> {
  return array.reduce((prev, next) => {
    return Object.assign(prev, { [next.name]: next.value });
  }, {});
}

/**
 * Assert that a given URL is a valid URL.
 *
 * @example
 * expect(body.url).toBeAURL()
 */
export function toBeAURL(url: string) {
  let valid = true;
  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch (err) {
    valid = false;
  }

  if (!valid) {
    return {
      message: () => `Expected ${url} to be a URL.`,
      pass: false,
    };
  }

  return {
    message: () => `Expected ${url} to not be a URL.`,
    pass: true,
  };
}

/**
 * Assert that a request has our `x-documentation-url` header and that contains a valid v4 UUID.
 *
 * @example
 * expect(response.headers).toHaveADocumentationHeader('https://docs.example.com');
 *
 * @param {string} baseLogUrl
 */
export function toHaveADocumentationHeader(headers: Record<string, string>, baseLogUrl: string) {
  const valid = isValidUUIDV4(headers['x-documentation-url'].replace(`${baseLogUrl}/logs/`, ''));

  if (!valid) {
    return {
      message: () => 'Expected a valid `x-documentation-url` header to be present.',
      pass: false,
    };
  }

  return {
    message: () => 'Expected an ivalid `x-documentation-url` header to be present.',
    pass: true,
  };
}

/**
 * Determine if a given HAR `headers` array has a given header matching a specific value.
 *
 * @example <caption>should match a value</caption>
 * expect(request.headers).toHaveHeader('connection', 'close');
 *
 * @example <caption>should match a regex</caption>
 * expect(response.headers).toHaveHeader('content-type', /application\/json(;\s?charset=utf-8)?/);
 *
 * @example <caption>should match one of many values</caption>
 * expect(request.headers).toHaveHeader('connection', ['close', 'keep-alive']);
 *
 * @param {array} headers
 * @param {string} header
 * @param {string|RegExp} expected
 */
export function toHaveHeader(headers: { name: string; value: string }[], header: string, expected: RegExp | string) {
  const actual = arrayToObject(headers)?.[header];

  let message: string;
  let valid: boolean;
  if (expected instanceof RegExp) {
    valid = expected.test(actual);
    message = !valid
      ? `Expected \`${actual}\` to match \`${expected}\``
      : `Expected \`${actual}\` not to match \`${expected}\``;
  } else if (Array.isArray(expected)) {
    valid = expected.some(e => e.toString() === actual);
    message = !valid
      ? `Expected \`${actual}\` to contain \`${expected}\``
      : `Expected \`${actual}\` not to contain \`${expected}\``;
  } else {
    valid = actual === expected.toString();
    message = !valid
      ? `Expected \`${header}\` to be \`${expected}\``
      : `Expected \`${header}\` not to be \`${expected}\``;
  }

  if (!valid) {
    return {
      message: () => message,
      pass: false,
    };
  }

  return {
    message: () => message,
    pass: true,
  };
}

expect.extend({
  toBeAURL,
  toHaveADocumentationHeader,
  toHaveHeader,
});
