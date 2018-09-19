/* eslint-env mocha */
const fs = require('fs');
const assert = require('assert');
const path = require('path');

const compileWorker = require('../compile');
const { version } = require('../package.json');

const template = fs.readFileSync(path.join(__dirname, '../template.js'), 'utf8');

describe('compile-worker', () => {
  it('should replace VERSION with the package.json version', async () => {
    const output = await compileWorker('http://localhost', template);
    assert.equal(output.indexOf('version = VERSION') === -1, true);
    assert.equal(output.indexOf(version) > -1, true);
  });

  it('should error with no host', async () => {
    try {
      await compileWorker('', template);
    } catch (e) {
      assert.equal(e.message, 'Must provide a host');
    }
  });

  it('should error with invalid javascript being passed in', async () => {
    try {
      await compileWorker('https://hostexample.com', 'const a =');
    } catch (e) {
      assert.equal(
        e.message,
        'There was a problem compiling your worker. Please only provide valid JavaScript.',
      );
    }
  });

  it('should replace HOST with the provided host', async () => {
    const host = 'https://hostexample.com';
    const output = await compileWorker(host, template);
    assert.equal(output.indexOf('host = HOST') === -1, true);
    assert.equal(output.indexOf(host) > -1, true);
  });

  it('should use passed in template', async () => {
    const apiKey = '123456789';
    const output = await compileWorker(
      'https://hostexample.com',
      template.replace('API_KEY', apiKey),
    );
    assert.equal(output.indexOf(apiKey) > -1, true);
  });
});
