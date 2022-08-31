import caseless from 'caseless';
import chai from 'chai';

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

export default function chaiPlugins(_chai, utils) {
  /**
   * Determine if a given HAR `headers` array has a given header matching a specific value.
   *
   * @param {array} headers
   * @param {string} header
   * @param {string|RegExp} expected
   */
  utils.addMethod(chai.Assertion.prototype, 'header', function (header, expected) {
    const obj = utils.flag(this, 'object');
    const headers = caseless(arrayToObject(obj));

    if (expected.constructor.name === 'RegExp') {
      new chai.Assertion(headers.get(header)).to.match(expected);
    } else {
      // We're using `toString()` here because it's nice to assert a number in this matcher as
      // `.to.have.header('header', 1234)` instead of `.to.have.header('header', '1234')`.
      new chai.Assertion(headers.get(header)).to.equal(expected.toString());
    }
  });
}
