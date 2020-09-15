const defaultJson = require('./default.json');

function getConfig() {
  if (['localhost', 'test'].includes(process.env.NODE_ENV)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const file = require(`./${process.env.NODE_ENV}.json`);
    return Object.assign(defaultJson, file);
  }

  return defaultJson;
}

module.exports = getConfig();
