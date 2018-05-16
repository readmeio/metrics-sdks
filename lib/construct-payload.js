const processRequest = require('./process-request');
const processResponse = require('./process-response');

module.exports = (req, res, group, options, { startedDateTime }) => ({
  group: group(req),
  clientIPAddress: req.ip,
  request: {
    log: {
      entries: [
        {
          startedDateTime: startedDateTime.toISOString(),
          time: new Date().getTime() - startedDateTime.getTime(),
          request: processRequest(req, options),
          response: processResponse(res, options),
        },
      ],
    },
  },
});
