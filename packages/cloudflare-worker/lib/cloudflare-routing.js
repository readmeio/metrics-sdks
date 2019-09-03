const minimatch = require('minimatch');

module.exports = url =>
  INSTALL_OPTIONS.routes
    .filter(r => r)
    .map(r => minimatch(url, r))
    .some(e => e);
