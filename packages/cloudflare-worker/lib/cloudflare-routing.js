const minimatch = require('minimatch');

module.exports = url => INSTALL_OPTIONS.ROUTES.map(r => minimatch(url, r)).some(e => e);
