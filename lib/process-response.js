const { STATUS_CODES } = require('http');
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
    status: res.status,
    // Wanted to use http://nodejs.org/dist/latest/docs/api/http.html#http_response_statusmessage
    // but couldnt find a way to get it from express
    statusText: STATUS_CODES[res.status],
    headers: objectToArray(res.headers || {}),
    content: {
      text: JSON.stringify(res.body),
      size: res.get('content-length'),
      mimeType: res.get('content-type'),
    },
  };
};
