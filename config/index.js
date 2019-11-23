// Have to disable this rule because we're using a fake
// `config` module as documented here:
// https://github.com/alexindigo/configly#migration-from-config
module.exports = require('configly')(__dirname);
