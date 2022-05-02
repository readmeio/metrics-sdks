/* eslint-disable @typescript-eslint/no-var-requires */
const defaultJson = require('./default.json');

function getConfig() {
  if (['localhost', 'testing'].includes(process.env.NODE_ENV)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const file = require(`./${process.env.NODE_ENV}.json`);
    return Object.assign(defaultJson, file);
  }
  return defaultJson;
}

module.exports = {
  ...getConfig(),
  ...(process.env.METRICS_SERVER ? { host: process.env.METRICS_SERVER } : {}),
};
