import caseless from 'caseless';
import chai from 'chai';
import { isValidUUIDV4 } from 'is-valid-uuid-v4';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      /**
       * Assert that a request has our `x-documentation-url` header and that contains a valid v4
       * UUID.
       */
      documentationHeader: (baseLogUrl: string) => void;

      /**
       * Assert that a given HAR `headers` array has a given header matching a specific value.
       */
      header: (header: string, expected: string | RegExp) => void;

      /**
       * Assert that a given URL is a valid URL.
       */
      url: void;
    }
  }
}

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
function arrayToObject(array: { name: string; value: string }[]) {
  return array.reduce((prev, next) => {
    return Object.assign(prev, { [next.name]: next.value });
  }, {});
}

export default function chaiPlugins(_chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
  /**
   * Assert that a request has our `x-documentation-url` header and that contains a valid v4 UUID.
   *
   * @example
   * expect(response.headers).to.have.a.documentationHeader('https://docs.example.com');
   *
   * @param {string} baseLogUrl
   */
  utils.addMethod(chai.Assertion.prototype, 'documentationHeader', function (baseLogUrl: string) {
    const headers = utils.flag(this, 'object');

    // eslint-disable-next-line chai-friendly/no-unused-expressions
    new chai.Assertion(headers['x-documentation-url']).not.to.be.undefined;

    // eslint-disable-next-line chai-friendly/no-unused-expressions
    new chai.Assertion(isValidUUIDV4(headers['x-documentation-url'].replace(`${baseLogUrl}/logs/`, ''))).to.be.true;
  });

  /**
   *
   * Determine if a given HAR `headers` array has a given header matching a specific value.
   *
   * @example <caption>should match a value</caption>
   * expect(request.headers).to.have.header('connection', 'close');
   *
   * @example <caption>should match a regex</caption>
   * expect(response.headers).to.have.header('content-type', /application\/json(;\s?charset=utf-8)?/);
   *
   * @example <caption>should match one of many values</caption>
   * expect(request.headers).to.have.header('connection', ['close', 'keep-alive']);
   *
   * @param {array} headers
   * @param {string} header
   * @param {string|RegExp} expected
   */
  utils.addMethod(chai.Assertion.prototype, 'header', function (header: string, expected: RegExp | string[] | string) {
    const obj = utils.flag(this, 'object');
    const headers = caseless(arrayToObject(obj));

    if (expected instanceof RegExp) {
      new chai.Assertion(headers.get(header)).to.match(expected);
    } else if (Array.isArray(expected)) {
      new chai.Assertion(headers.get(header)).to.oneOf(expected.map(e => e.toString()));
    } else {
      new chai.Assertion(headers.get(header)).to.equal(expected.toString());
    }
  });

  /**
   * Assert that a given URL is a valid URL.
   *
   * @example
   * expect(body.url).to.be.a.url;
   */
  utils.addProperty(chai.Assertion.prototype, 'url', function () {
    const url = utils.flag(this, 'object');

    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch (err) {
      new chai.Assertion(err.code).not.to.equal('ERR_INVALID_URL', `${url} is not a valid url`);
    }
  });
}
