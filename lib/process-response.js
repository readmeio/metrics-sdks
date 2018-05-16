const removeProperties = require('lodash.omit');
const removeOtherProperties = require('lodash.pick');

const objectToArray = require('./object-to-array');

module.exports = (res, options = {}) => {
  if (options.blacklist) {
    res.body = removeProperties(res.body, options.blacklist);
  }

  if (options.whitelist) {
    res.body = removeOtherProperties(res.body, options.whitelist);
  }

  return {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers: objectToArray(res.getHeaders()),
    content: {
      text: JSON.stringify(res.body),
      size: res.get('content-length'),
      mimeType: res.get('content-type'),
    },
  };
};
