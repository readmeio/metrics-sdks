const nock = require('nock');
const config = require('../config');
const getReadmeData = require('../lib/get-readme-data');

describe('#get-readme-data', () => {
  beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');

    nock(config.readmeUrl)
      .get('/api/v1/')
      .basicAuth({
        user: 'readme_api',
        pass: '',
      })
      .reply(200, { jwtSecret: 'jwt', baseUrl: 'redirect' });
  });

  afterEach(() => nock.cleanAll());

  it('should send get jwt secret and redirect from readme', async () => {
    const data = await getReadmeData('readme_api');
    expect(data).toStrictEqual({ jwtSecret: 'jwt', baseUrl: 'redirect' });
  }, 5000);

  it('should cache if called twice', async () => {
    await getReadmeData('readme_api');
    const data = await getReadmeData('readme_api');
    expect(data).toStrictEqual({ jwtSecret: 'jwt', baseUrl: 'redirect' });
    expect(getReadmeData.cachedReadmeData.readme_api).toStrictEqual({
      jwtSecret: 'jwt',
      baseUrl: 'redirect',
    });
  });

  it('should error if invalid api key', async () => {
    await expect(getReadmeData('invalid')).rejects.toThrow('Invalid ReadMe API Key');
  });
});
