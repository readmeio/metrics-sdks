const removeProperties = require('lodash/omit');
const removeOtherProperties = require('lodash/pick');

const objectToArray = require('./object-to-array');

module.exports = (res, options = {}) => {
  // Here we have to reconstruct the body
  // from the string that we've buffered up
  // We have to do this so we can strip out
  // any whitelist/blacklist properties
  let body;
  try {
    body = JSON.parse(res._body);

    // Only apply blacklist/whitelist if it's an object
    if (options.blacklist) {
      body = removeProperties(body, options.blacklist);
    }

    if (options.whitelist && !options.blacklist) {
      body = removeOtherProperties(body, options.whitelist);
    }
  } catch (e) {
    // Non JSON body
    body = res._body;
  }

  let headers = res.getHeaders();

  if (options.blacklist) {
    headers = removeProperties(headers, options.blacklist);
  }

  if (options.whitelist && !options.blacklist) {
    headers = removeOtherProperties(headers, options.whitelist);
  }

  return {
    status: res.statusCode,
    statusText: res.statusMessage,
    headers: objectToArray(headers),
    content: {
      text: JSON.stringify(body),
      size: res.get('content-length') || 0,
      mimeType: res.get('content-type'),
    },
  };
};
