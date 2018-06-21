const LRU = require('lru-cache');
const request = require('r2');
const config = require('../config');

const cacheOptions = {
  length: 500,
  maxAge: 24 * 60 * 60 * 1000, // 24 Hours
};

module.exports = async apiKey => {
  let readmeData = module.exports.cache.get(apiKey);

  if (!readmeData) {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64');
    readmeData = await request.get(`${config.readmeUrl}/api/v1/jwt-secret`, {
      headers: { authorization: `Basic ${encoded}` },
    }).json;
    module.exports.cache.set(apiKey, readmeData);
  }

  return readmeData;
};

module.exports.cache = LRU(cacheOptions);
