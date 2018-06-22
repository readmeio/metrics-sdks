const request = require('r2');
const config = require('../config');

module.exports = async apiKey => {
  if (!module.exports.cachedReadmeData[apiKey]) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64');
    try {
      module.exports.cachedReadmeData[apiKey] = await request.get(`${config.readmeUrl}/api/v1/`, {
        headers: { authorization: `Basic ${encoded}` },
      }).json;
    } catch (e) {
      throw new Error('Invalid API Key');
    }
  }

  return module.exports.cachedReadmeData[apiKey];
};

module.exports.cachedReadmeData = {};
