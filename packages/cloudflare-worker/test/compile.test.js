/* eslint-env mocha */
const assert = require('assert');

const compileWorker = require('../compile');

describe('compile-worker', () => {
  it('should error with no apiKey', done => {
    try {
      compileWorker('');
    } catch (e) {
      assert.equal(e.message, 'Must provide an apiKey');
      done();
    }
  });

  it('should replace API_KEY with the provided apiKey', async () => {
    const apiKey = 123456;
    const output = compileWorker(apiKey);
    assert.equal(output.indexOf('API_KEY') === -1, true);
    assert.equal(output.indexOf(apiKey) > -1, true);
  });
});
