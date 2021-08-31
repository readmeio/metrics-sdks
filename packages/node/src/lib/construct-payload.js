const url = require('url');
const processRequest = require('./process-request');
const processResponse = require('./process-response');
const { name, version } = require('../../package.json');

module.exports = (req, res, groupingFn, options = {}, { logId, startedDateTime }) => {
  const group = groupingFn(req, res);

  // if apiKey is specified use it as if it were passed in as the id
  if (group && group.apiKey) {
    group.id = group.apiKey;
    delete group.apiKey;
  }

  return {
    _id: logId,
    group,
    clientIPAddress: req.ip,
    development: options.development,
    request: {
      log: {
        creator: { name, version, comment: `${process.platform}/${process.version}` },
        entries: [
          {
            pageref: req.route
              ? url.format({
                  protocol: req.protocol,
                  host: req.get('host'),
                  pathname: `${req.baseUrl}${req.route.path}`,
                })
              : '',
            startedDateTime: startedDateTime.toISOString(),
            time: new Date().getTime() - startedDateTime.getTime(),
            request: processRequest(req, options),
            response: processResponse(res, options),
          },
        ],
      },
    },
  };
};
