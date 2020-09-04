# readmeio

Track your API metrics within ReadMe.

[![npm](https://img.shields.io/npm/v/readmeio.svg)](https://npm.im/readmeio)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/nodejs/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

```
npm install readmeio
```

## Usage

Just add the middleware to [Express](https://expressjs.com/), and that's it!

```javascript
const readme = require('readmeio');

app.use(readme.metrics('<<apiKey>>', req => ({
  id: req.<userId>,
  label: req.<userNameToShowInDashboard>,
  email: req.<userEmailAddress>,
})));
```

View full documentation here: [https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs)

### `res.headers['x-documentation-url']`
With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `node_modules/.cache/readmeio`, to retrieve your projects `baseUrl`. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `baseLogUrl` option into the middleware, which should evaluate to the public-facing URL of your ReadMe project.

### Configuration Options
There are a few options you can pass in to change how the logs are sent to ReadMe. These are passed in an object as the third parameter to the `readme.metrics`.

```js
const readme = require('readmeio');
const env = process.env.NODE_ENV;

app.use(readme.metrics('', req => ({
  id: req.<userId>,
  label: req.<userNameToShowInDashboard>,
  email: req.<userEmailAddress>,
}), {
  development: env !== 'production',
  bufferLength: 1,
  blacklist: [[arrayOfSensitiveKeysToOmit]],
  whitelist: [[arrayofKeysOnlyToSend]],
}));
```

| Option | Use |
| :--- | :--- |
| development | **default: false** If true, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers. Additionally with this option enabled, any errors that occur when talking to ReadMe will be surfaced to you. This is helpful for debugging invalid API keys or anything else that might go astray. |
| bufferLength | **default: 10** By default, we only send logs to ReadMe after 10 requests are made. Depending on the usage of your API it make make sense to send logs more or less frequently. |
| blacklist | **optional** An array of keys from your API requests and responses headers and bodies that you wish to blacklist from sending to ReadMe.<br /><br />If you configure a blacklist, it will override any whitelist configuration. |
| whitelist | **optional** An array of keys from your API requests and responses headers and bodies that you only wish to send to ReadMe. |
| baseLogUrl | **optional** This is the base URL for your ReadMe project. Normally this would be `https://projectName.readme.io` or `https://docs.yourdomain.com`, however if this value is not supplied, a request to the ReadMe API will be made once a day to retrieve it. This data is cached into `node_modules/.cache/readmeio`.

### Limitations
- Currently only supports JSON request bodies. Adding a whitelist/blacklist for non-JSON bodies will not work (unless they're added to `req.body`) the same way that `body-parser` does it. The properties will be passed into [`postData`](http://www.softwareishard.com/blog/har-12-spec/#postData) as a `params` array.
- Needs more support for getting URLs when behind a reverse proxy: `x-forwarded-for`, `x-forwarded-proto`, etc.
- Needs more support for getting client IP address when behind a reverse proxy.
- Logs are "fire and forget" to the metrics server, so any failed requests (even for incorrect API key!) will currently fail silently.
