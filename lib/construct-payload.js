const processRequest = require('./process-request');
const processResponse = require('./process-response');
const { name, version } = require('../package.json');

module.exports = (req, res, group, options, { startedDateTime }) => ({
  group: group(req),
  clientIPAddress: req.ip,
  request: {
    log: {
      creator: { name, version, comment: `${process.platform}/${process.version}` },
      entries: [
        {
          pageref: req.route.path,
          startedDateTime: startedDateTime.toISOString(),
          time: new Date().getTime() - startedDateTime.getTime(),
          request: processRequest(req, options),
          response: processResponse(res, options),
        },
      ],
    },
  },
});
