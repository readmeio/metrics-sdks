const url = require('url');
const removeProperties = require('lodash.omit');
const removeOtherProperties = require('lodash.pick');

function objectToArray(object) {
  return Object.entries(object).reduce((prev, [name, value]) => {
    prev.push({ name, value });
    return prev;
  }, []);
}

module.exports = (req, options = {}) => {
  if (options.blacklist) {
    req.body = removeProperties(req.body, options.blacklist);
  }

  if (options.whitelist) {
    req.body = removeOtherProperties(req.body, options.whitelist);
  }

  return {
    method: req.method,
    url: url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.path,
      query: req.query,
    }),
    httpVersion: req.httpVersion,
    headers: objectToArray(req.headers),
    queryString: objectToArray(req.query),
    postData: {
      mimeType: 'application/json',
      text: JSON.stringify(req.body),
    },
  };
};
