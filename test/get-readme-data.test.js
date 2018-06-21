/* eslint-env mocha */
const assert = require('assert');
const nock = require('nock');
const config = require('../config');
const getReadmeData = require('../lib/get-readme-data');

describe('#get-readme-data', () => {
  before(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });
  after(() => nock.cleanAll());

  beforeEach(() => getReadmeData.cache.reset());

  beforeEach(() => {
    nock(config.readmeUrl)
      .get('/api/v1/jwt-secret')
      .basicAuth({
        user: 'readme_api',
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'redirect' });
  });

  it('should send get jwt secret and redirect from readme', async function test() {
    this.timeout(5000);

    const data = await getReadmeData('readme_api');
    assert.deepEqual(data, { jwtSecret: 'jwt', baseUrl: 'redirect' });
  });

  it('should cache if called twice', async () => {
    await getReadmeData('readme_api');
    const data = await getReadmeData('readme_api');
    assert.deepEqual(data, { jwtSecret: 'jwt', baseUrl: 'redirect' });
    assert.deepEqual(getReadmeData.cache.get('readme_api'), {
      jwtSecret: 'jwt',
      baseUrl: 'redirect',
    });
  });
});
