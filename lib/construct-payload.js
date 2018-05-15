const processRequest = require('./process-request.js');

module.exports = (req, group, options, { startedDateTime }) => ({
  group: group(req),
  clientIPAddress: req.ip,
  request: {
    log: {
      entries: [
        {
          startedDateTime: startedDateTime.toISOString(),
          time: new Date().getTime() - startedDateTime.getTime(),
          request: processRequest(req, options),
        },
      ],
    },
  },
});
