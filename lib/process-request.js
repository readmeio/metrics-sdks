const url = require('url');
const get = require('lodash/get');
const set = require('lodash/set');
const pick = require('lodash/pick');
const merge = require('lodash/merge');
const contentType = require('content-type');

const objectToArray = require('./object-to-array');

/**
 * @param {Any} value the value to be redacted
 * @returns A redacted string potentially containing the length of the original value, if it was a string
 */
function redactValue(value) {
  return `[REDACTED${typeof value === 'string' ? ` ${value.length}` : ''}]`;
}

/**
 * @param {Object} obj The data object that is operated upon
 * @param {String[]} redactedPaths a list of paths that point values which should be redacted
 * @returns An object with the redacted values
 */
function redactProperties(obj, redactedPaths = []) {
  const nextObj = { ...obj };
  return redactedPaths.reduce((acc, path) => {
    const value = get(acc, path);
    if (value !== undefined) set(acc, path, redactValue(value));
    return acc;
  }, nextObj);
}

/**
 * @param {Object} obj The data object that is operated upon
 * @param {Function} cb A callback that is invoked for each value found, the return value being the next value that is set in the returned object
 * @returns An object with the replaced values
 */
function replaceEach(obj, cb) {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      acc[key] = replaceEach(value, cb);
    } else if (value !== undefined) {
      acc[key] = cb(value);
    }
    return acc;
  }, {});
}

/**
 *
 * @param {Object} obj The data object with fields to redact
 * @param {Array} nonRedactedPaths A list of all object paths that shouldn't be redacted
 * @returns A merged objects that is entirely redacted except for the values of the nonRedactedPaths
 */
function redactOtherProperties(obj, nonRedactedPaths) {
  const allowedFields = pick(obj, nonRedactedPaths);
  const redactedFields = replaceEach(obj, redactValue);
  return merge(redactedFields, allowedFields);
}

module.exports = (req, options = {}) => {
  const denylist = options.denylist || options.blacklist;
  const allowlist = options.allowlist || options.whitelist;

  if (denylist) {
    req.body = redactProperties(req.body, denylist);
    req.headers = redactProperties(req.headers, denylist);
  }

  if (allowlist && !denylist) {
    req.body = redactOtherProperties(req.body, allowlist);
    req.headers = redactOtherProperties(req.headers, allowlist);
  }

  const postData = {};
  if (req.body && Object.keys(req.body).length > 0) {
    // parse mimetype from content-type header, default to JSON
    postData.mimeType = 'application/json';
    try {
      postData.mimeType = contentType.parse(req).type;
    } catch (e) {} // eslint-disable-line no-empty

    // Per HAR, we send JSON as postData.text, not params.
    if (postData.mimeType === 'application/json') {
      postData.text = JSON.stringify(req.body);
    } else {
      postData.params = objectToArray(req.body || {});
    }
  }

  return {
    method: req.method,
    url: url.format({
      protocol: req.headers['x-forwarded-proto'] || req.protocol,
      host: req.headers['x-forwarded-host'] || req.get('host'),
      pathname: `${req.baseUrl}${req.path}`,
      query: req.query,
    }),
    httpVersion: `${req.protocol.toUpperCase()}/${req.httpVersion}`,
    headers: objectToArray(req.headers),
    queryString: objectToArray(req.query),
    postData,
  };
};
