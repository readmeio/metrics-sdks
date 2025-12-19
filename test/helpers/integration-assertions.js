import caseless from 'caseless';
import validate from 'har-validator';
import { assert } from 'vitest';

/**
 * Converts an array of headers like this:
 *
 *  [
 *    { name: 'host', value: 'localhost:49914' },
 *    { name: 'connection', value: 'close' },
 *  ];
 *
 * To an object that can be passed in to caseless:
 *
 *  {
 *    host: 'localhost:49914',
 *    connection: 'close'
 *  }
 */
function arrayToObject(array) {
  return array.reduce((prev, next) => {
    return Object.assign(prev, { [next.name]: next.value });
  }, {});
}

/**
 * @param {string} header
 * @param {RegExp|string|string[]} expected
 */
export function assertToHaveHeader(headers, header, expected) {
  const caselessHeaders = caseless(arrayToObject(headers));

  if (expected.constructor.name === 'RegExp') {
    assert(caselessHeaders.get(header).match(expected), `Expected ${header} to match ${expected}`);
  } else if (Array.isArray(expected)) {
    assert(
      expected.some(e => caselessHeaders.get(header).toString() === e.toString()),
      `Expected ${header} to be one of ${expected}`,
    );
  } else {
    assert(caselessHeaders.get(header).toString() === expected.toString(), `Expected ${header} to be ${expected}`);
  }
}

/**
 * Determine if a given HAR object has a valid `request` object.
 *
 * @example await assertToHaveHARRequest(har);
 */
export async function assertToHaveHARRequest(har) {
  const entry = har.log.entries[0];

  assert(entry.request, 'Expected `log.entries[0].request` to be present');

  try {
    await validate.request(entry.request);
  } catch (err) {
    let error = '`log.entries[0].request` HAR validation failed:\n\n';
    err.errors.forEach(e => {
      error += `· [${e.dataPath}] ${e.message}\n`;
    });

    throw new Error(error);
  }
}

/**
 * Determine if a given HAR object has a valid `response` object.
 *
 * @example await assertToHaveHARResponse(har);
 */
export async function assertToHaveHARResponse(har) {
  const entry = har.log.entries[0];

  assert(entry.response, 'Expected `log.entries[0].response` to be present');

  // We don't add or care about these three items in the HAR `response` spec.
  entry.response.httpVersion = '';
  entry.response.cookies = [];
  entry.response.redirectURL = '';

  try {
    await validate.response(entry.response);
  } catch (err) {
    let error = '`log.entries[0].response` HAR validation failed:\n\n';
    err.errors.forEach(e => {
      error += `· [${e.dataPath}] ${e.message}\n`;
    });

    throw new Error(error);
  }
}
