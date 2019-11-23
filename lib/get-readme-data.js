const request = require('r2');
const config = require('../config');

module.exports = async apiKey => {
  if (!module.exports.cachedReadmeData[apiKey]) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64');
    try {
      const response = await request.get(`${config.readmeUrl}/api/v1/`, {
        headers: { authorization: `Basic ${encoded}` },
      }).json;
      if (response.error) {
        throw new Error(response.error);
      }
      // eslint-disable-next-line require-atomic-updates
      module.exports.cachedReadmeData[apiKey] = response;
    } catch (e) {
      throw new Error('Invalid ReadMe API Key');
    }
  }

  return module.exports.cachedReadmeData[apiKey];
};

module.exports.cachedReadmeData = {};
