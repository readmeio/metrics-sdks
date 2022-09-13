import caseless from 'caseless';
import chai from 'chai';
import validate from 'har-validator';

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
  utils.addMethod(chai.Assertion.prototype, 'header', function (header, expected) {
    const obj = utils.flag(this, 'object');
    const headers = caseless(arrayToObject(obj));

    if (expected.constructor.name === 'RegExp') {
      new chai.Assertion(headers.get(header)).to.match(expected);
    } else if (Array.isArray(expected)) {
      new chai.Assertion(headers.get(header)).to.oneOf(expected.map(e => e.toString()));
    } else {
      new chai.Assertion(headers.get(header)).to.equal(expected.toString());
    }
  });

  /**
   * Determine if a given object has the basic properties of a HAR.
   *
   * This does **not** do full HAR validation because we only /really/ actually care about the
   * contents of the `request` object in `log.entries[*]`. This method is just to give the
   * `.request`  assertion some nice syntactic prefixing sugar.
   *
   * @example await expect(har).to.have.a.har.request;
   */
  utils.addChainableMethod(chai.Assertion.prototype, 'har', null, function () {
    const har = utils.flag(this, 'object');
    new chai.Assertion(har).to.have.property('log').and.have.property('entries').and.have.lengthOf(1);
  });

  /**
   * Determine if a given HAR object has a valid `request` object.
   *
   * @example await expect(har).to.have.a.har.request;
   */
  utils.addProperty(chai.Assertion.prototype, 'request', async function () {
    const har = utils.flag(this, 'object');
    const entry = har.log.entries[0];

    new chai.Assertion(entry).of.have.property('request');

    try {
      await validate.request(entry.request);
    } catch (err) {
      let error = '`log.entries[0].request` HAR validation failed:\n\n';
      err.errors.forEach(e => {
        error += `· [${e.dataPath}] ${e.message}\n`;
      });

      chai.assert.ifError(new Error(error));
    }
  });

  /**
   * Determine if a given HAR object has a valid `response` object.
   *
   * @example await expect(har).to.have.a.har.response;
   */
  utils.addProperty(chai.Assertion.prototype, 'response', async function () {
    const har = utils.flag(this, 'object');
    const entry = har.log.entries[0];

    new chai.Assertion(entry).of.have.property('response');

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

      chai.assert.ifError(new Error(error));
    }
  });
}
