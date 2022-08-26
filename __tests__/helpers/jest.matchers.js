import caseless from 'caseless';

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
 * Determine if a given HAR `headers` array has a given header matching a specific value.
 *
 * @param {array} headers
 * @param {string} header
 * @param {string|RegExp} expected
 */
export function toHaveHeader(headers, header, expected) {
  const { printReceived, printExpected, matcherHint } = this.utils;

  const passMessage = `${matcherHint('.not.toHaveHeader')}

Expected headers to not include ${printExpected(header)} equal to ${printExpected(expected)}:
Received:
  ${printReceived(headers)}`;

  const failMessage = `${matcherHint('.toHaveHeader')}

Expected headers to include ${printExpected(header)} equal to ${printExpected(expected)}:
Received:
  ${printReceived(headers)}`;

  let pass;
  if (expected.constructor.name === 'RegExp') {
    pass = expected.test(caseless(arrayToObject(headers)).get(header));
  } else {
    // Using `toString()` here because it's nice to assert a number in this matcher as
    // `.toHaveHeader('header', 1234)` instead of `.toHaveHeader('header', '1234')`.
    pass = caseless(arrayToObject(headers)).get(header) === expected.toString();
  }

  return { pass, message: () => (pass ? passMessage : failMessage) };
}
