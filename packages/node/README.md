
> 🚧 Any Issues?
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

### Build Details

Track your API metrics within ReadMe.

[![npm](https://img.shields.io/npm/v/readmeio.svg)](https://npm.im/readmeio)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/nodejs/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)
### Overview

If you're a developer, it's super easy to send your API logs to ReadMe, so your team can get deep insights into your API's usage. Here's an overview of how the integration works:

- You add ReadMe middleware to your Express server.
- The middleware sends to ReadMe the request and response objects that your Express server generates each time a user makes a request to your API. The entire objects are sent, unless you blacklist or whitelist keys.
- ReadMe extracts information to display in the API Metrics Dashboard, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

## Installation

```
npm install readmeio
```

### Steps

Note these steps assume you are working in [Node.js](https://nodejs.org) and [Express](https://expressjs.com):

1. Locate the file in your company's API codebase that contains your Express server. Often this file is named `express.js` or `app.js`. You can also search on the code snippet `express()`

2. From the directory of this codebase, run the following command in your command line to install the `readmeio` package from [npm](https://www.npmjs.com/package/readmeio):
```
npm install readmeio --save
```

3. Load the `readmeio` module into your Express server. Usually near the beginning of the file, you will see several `require` statements. Add the following statement to that group:
```
const readme = require('readmeio');
```

4. Configure the following middleware function:
```
app.use(readme.metrics('<<user>>', req => ({
  apiKey: req.<apiKey>,
  label: req.<userNameToShowInDashboard>,
  email: req.<userEmailAddress>,
})));
```

The `readme.metrics middleware` takes the following parameters:

- The ReadMe API Key
- A function that takes the `req` object and returns an object describing the user (in the case above, it just returns their apiKey to identify the caller)
- An options function that is not shown in the preceding middleware, but is discussed [below](doc:sending-logs-to-readme-with-nodejs#section-configuration-options).

**Minimal middleware configuration**

Here's the bare minimum you need to configure:

- The ReadMe API Key: The first parameter that `readme.metrics` takes is your doc project's ReadMe API Key. If you're [logged in](https://dash.readme.io/to/metrics) to these docs, this string is automatically populated in the proceeding middleware code.
You can also see it here:
<<keys:user>>
  Otherwise, copy and paste it in from dash.readme.com/project/<yourProject>/v<yourVersion>/api-key.

- API caller identification: To identify the API caller, replace `<apiKey>`, `<userNameToShowInDashboard>`, and `<userEmailAddress>` with the appropriate properties in your `req` object that contain your user data. More details follow in the next section.


5. Paste the configured middleware into the file containing your Express server. Note that this middleware is not likely to be sensitive to order, so you can put it anywhere in the file after middleware that adds user properties to the request object. If you are new to Express, see [How to Write Middleware for Express.js Apps](https://stormpath.com/blog/how-to-write-middleware-for-express-apps)

### Identifying the API Caller
There are three fields that you can use to identify the user making the API call. We recommend passing all three to `readme.metrics` to make API Metrics as useful as possible. (If your `req` object doesn't have all this information, we recommend adding it via additional middleware prior to this.)
```
app.use(readme.metrics('<<keys:user>>', req => ({
  apiKey: req.<apiKey>,
  label: req.<userNameToShowInDashboard>,
  email: req.<userEmailAddress>,
})));
```

Field  | Usage
-------|--------
apiKey | **Required** API Key used to make the request.
label  | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than a unique identifier.
email  | Email of the user that is making the call

### Configuration Options

There are a few options you can pass in to change how the logs are sent to ReadMe. These are passed in an object as the third parameter to the `readme.metrics`.

| Option       | Use                                                                                                                                                                                                                                                                                                                     |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| development  | **default: false** If true, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers.                                                                                                                                                    |
| bufferLength | **default: 1** By default, we perform a buffer flush to ReadMe after a single request is made. Depending on the usage of your API it make make sense to do this more or less frequently. The buffer will always flush after 30 logs are made, so any number that is larger will be ignored. Also keep in mind that any request over 1mb will receive a 413 response.                                                                     |
| denylist     | **optional** An array of keys from your API requests, responses headers, and request bodies that you wish to not be sent to ReadMe.<br /><br />If you configure a `denylist`, it will override any `allowlist` configuration.                                                                                           |
| allowlist    | **optional** An array of keys from your API requests and responses headers and bodies that you only wish to send to ReadMe.                                                                                                                                                                                             |
| baseLogUrl   | **optional** This is the base URL for your ReadMe project. Normally this would be `https://projectName.readme.io` or `https://docs.yourdomain.com`, however if this value is not supplied, a request to the ReadMe API will be made once a day to retrieve it. This data is cached into `node_modules/.cache/readmeio`. |

```
const readme = require('readmeio');
const env = process.env.NODE_ENV;

app.use(readme.metrics('<<keys:user>>', req => ({
    apiKey: req.<apiKey>,
    label: req.<userNameToShowInDashboard>,
    email: req.<userEmailAddress>,
}), {
  development: env !== 'production',
  bufferLength: 1,
  denyList: <arrayOfSensitiveKeysToOmit>,
  acceptList: <arrayofKeysOnlyToSend>,
}));
```

### Documentation URL

With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `node_modules/.cache/readmeio`, to retrieve your projects `baseUrl`. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `baseLogUrl` option into the middleware, which should evaluate to the public-facing URL of your ReadMe project.


### Limitations

- Currently only supports JSON request bodies. Adding a `allowlist` or `denylist` for non-JSON bodies will not work (unless they're added to `req.body`) the same way that [`body-parser`](https://npm.im/body-parser) does it. The properties will be passed into [`postData`](http://www.softwareishard.com/blog/har-12-spec/#postData) as a `params` array.
