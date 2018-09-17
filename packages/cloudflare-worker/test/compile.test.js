/* eslint-env mocha */
const fs = require('fs');
const assert = require('assert');
const path = require('path');

const compileWorker = require('../../worker/compile');
const config = require('../../config');
const { version } = require('../../package.json');

const template = fs.readFileSync(path.join(__dirname, '../../worker/template.js'), 'utf8');

describe('compile-worker', () => {
  it('should replace VERSION with the package.json version', async () => {
    const output = await compileWorker(template);
    assert.equal(output.indexOf('version = VERSION') === -1, true);
    assert.equal(output.indexOf(version) > -1, true);
  });

  it('should replace HOST with the config.host', async () => {
    const output = await compileWorker(template);
    assert.equal(output.indexOf('host = HOST') === -1, true);
    assert.equal(output.indexOf(config.host) > -1, true);
  });
});
