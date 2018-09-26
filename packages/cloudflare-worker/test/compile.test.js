/* eslint-env mocha */
const assert = require('assert');

const compileWorker = require('../compile');
const { version } = require('../package.json');

describe('compile-worker', () => {
  it('should replace VERSION with the package.json version', async () => {
    const output = await compileWorker('http://localhost');
    assert.equal(output.indexOf('version = VERSION') === -1, true);
    assert.equal(output.indexOf(version) > -1, true);
  });

  it('should error with no host', done => {
    compileWorker('').catch(e => {
      assert.equal(e.message, 'Must provide a host');
      return done();
    });
  });

  it('should error with no apiKey', done => {
    compileWorker('https://metrics.readme.io', '').catch(e => {
      assert.equal(e.message, 'Must provide an apiKey');
      return done();
    });
  });

  it('should replace HOST with the provided host', async () => {
    const host = 'https://hostexample.com';
    const output = await compileWorker(host, '123');
    assert.equal(output.indexOf('host = HOST') === -1, true);
    assert.equal(output.indexOf(host) > -1, true);
  });

  it('should replace API_KEY with the provided apiKey', async () => {
    const apiKey = 123456;
    const output = await compileWorker('https://hostexample.com', apiKey);
    assert.equal(output.indexOf('API_KEY') === -1, true);
    assert.equal(output.indexOf(apiKey) > -1, true);
  });
});
