const removeProperties = require('lodash.omit');
const removeOtherProperties = require('lodash.pick');

const objectToArray = require('./object-to-array');

module.exports = (res, options = {}) => {
  // Here we have to reconstruct the body
  // from the string that we've buffered up
  // We have to do this so we can strip out
  // any whitelist/blacklist properties
  let body;
  try {
    body = JSON.parse(res._body); // eslint-disable-line no-underscore-dangle
  } catch (e) {
    // Non JSON body, don't attempt to send it off
  }

  if (options.blacklist && body) {
    body = removeProperties(body, options.blacklist);
  }

  if (options.whitelist && body) {
    body = removeOtherProperties(body, options.whitelist);
  }

  return {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers: objectToArray(res.getHeaders()),
    content: {
      text: JSON.stringify(body),
      size: res.get('content-length') || 0,
      mimeType: res.get('content-type'),
    },
  };
};
