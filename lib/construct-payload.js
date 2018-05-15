const processRequest = require('./process-request.js');

module.exports = (req, group, options) => ({
  group: group(req),
  clientIPAddress: req.ip,
  request: {
    log: {
      entries: [
        {
          request: processRequest(req, options)
        }
      ],
    },
  },
})
