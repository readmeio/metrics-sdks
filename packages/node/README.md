# readmeio

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

> 🚧 Any Issues?
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

[![npm](https://img.shields.io/npm/v/readmeio.svg)](https://npm.im/readmeio) [![Build](https://github.com/readmeio/metrics-sdks/workflows/nodejs/badge.svg)](https://github.com/readmeio/metrics-sdks)

## Contents

- [Overview](#overview)
- [Express.js Integration](#expressjs-integration)
- [Generic Node.js Integration](#generic-nodejs-integration)

# Overview

With ReadMe's Metrics API your team can get deep insights into your API's usage. If you're a developer, it's super easy to send your API logs to ReadMe, so your team can get deep insights into your API's usage. Here's an overview of how the integration works:

- You add the Node.js SDK to your server manually or via the included Express middleware.
- The Node.js SDK sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
- ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data.

# Express.js Integration

Note: If you're not using [Express.js](https://expressjs.com), check out our [Generic Node.js](#generic-node-integration) documentation.

1. Locate the file in your organization's API codebase that contains your Express server. Often this file is named `express.js` or `app.js`. You can also search on the code snippet `express()`.

2. From the directory of this codebase, run the following command in your command line to install the [`readmeio` package from `npm`](https://www.npmjs.com/package/readmeio):
```
npm install readmeio --save
```

3. Load the `readmeio` module into your Express server. Usually near the beginning of the file, you will see several `import` or `require` statements. Add the following statement to that group:

**Typescript**
```typescript
import * as readme from 'readmeio';
```

**Node.js**
```javascript
const readme = require('readmeio');
```

4. Configure the following middleware function:
```javascript
app.use(readme.metrics(readmeAPIKey, req => ({
  apiKey: req.<apiKey>, // You might extract this from a header or parameter
  label: req.<userNameToShowInDashboard>, // You might extract this from user data associated with the API key
  email: req.<userEmailAddress>, // You might extract this from user data associated with the API key
})));
```

For more details about the parameters you can provide to the `express` function, refer to the [Express.js](#express-middleware-reference) documentation.

5. Test a request:

```
curl -i {my api url}
```

You should see a response header `x-documentation-url`. This header contains a URL to a detailed log of the API request/response. For info on configuring this header, check out the [Documentation URL](#documentation-url) docs.

### Express Middleware Reference
The Express middleware accepts the following parameters:

> Note that this middleware is not likely to be sensitive to order. If you are new to Express, see [How to Write Middleware for Express.js Apps](https://stormpath.com/blog/how-to-write-middleware-for-express-apps).

Parameter       | Required? | Description
----------------|-----------|-------
`readmeAPIKey`    | yes       | The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication).
`groupFn`         | yes       | A function that helps translate incoming request data to our metrics grouping data. You can read more under [Grouping Function](#grouping-function).
`options`         | no        | Additional options. You can read more under [Additional Express Options](#additional-express-options)

Example:
```javascript
readme.metrics(readmeAPIKey, groupFn, options);
```
### Grouping Function
The grouping function is a function your script should include that extracts identifying information out of the [`req`](https://expressjs.com/en/4x/api.html#req) object. While only `apiKey` is required, we recommend providing all three values to get the most out of the metrics dashboard.

Return data:
Field  | Required? | Type   | Usage
-------|-----------|--------|------
`apiKey` | yes       | string | API Key used to make the request. Note that this is different from the `readmeAPIKey` described above and should be a value from your API that is unique to each of your users.
`label`  | no        | string | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than an API key.
`email`  | no        | string | Email of the user that is making the call.

Example:
```javascript
app.use(readme.metrics(readmeAPIKey, req => ({
  apiKey: req.<apiKey>, // You might extract this from a header or parameter
  label: req.<userNameToShowInDashboard>, // You might extract this from user data associated with the API key
  email: req.<userEmailAddress>, // You might extract this from user data associated with the API key
})));
```
### Additional Express Options
Option           | Type             | Description
-----------------|------------------|---------
`denyList`         | Array of strings | An array of parameter names that will be redacted from the query parameters, request body (when JSON or form-encoded), response body (when JSON) and headers. For nested request parameters use dot notation (e.g. `a.b.c` to redact the field `c` within `{ a: { b: { c: 'foo' }}}`).
`allowList`        | Array of strings | If included, `denyList` will be ignored and all parameters but those in this list will be redacted.
`development`      | bool             | Defaults to `false`. When `true`, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers.
`fireAndForget`    | bool             | Defaults to `true`. When `false`, the server will wait for the response from the metrics call. This will be slower, but the response is useful in debugging problems.
`bufferLength`     | number           | Defaults to `1`. This value should be a number representing the amount of requests to group up before sending them over the network. Increasing this value will increase performance but delay the time until logs show up in the dashboard. The default value is `1`.
`baseLogUrl`       | string           | This value is used when building the `x-documentation-url` header (see docs [below](#documentation-url)). It is your ReadMe documentation's base URL (e.g. `https://example.readme.io`). If not provided, we will make one API call a day to determine your base URL (more info in [Documentation URL](#documentation-url).  If provided, we will use that value and never look it up automatically. **Note:** <subdomain>.readme.com will not work. Make sure to use <subdomain>.readme.io, or your custom hostname.

Example:
```javascript
{
  denyList: ['password', 'secret'],
  development: true,
  fireAndForget: true,
  bufferLength: 1,
  baseLogUrl: "https://example.readme.io"
}
```

### Documentation URL

With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `node_modules/.cache/readmeio`, to retrieve your projects `baseUrl`. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `baseLogUrl` option into the middleware, which should evaluate to the public-facing URL of your ReadMe project.


# Generic Node.js Integration
Note: If you're using [Express.js](https://expressjs.com) check out our [Express.js Integration](#expressjs-integration) documentation.

1. Install `readmeio` via your package manager:
```
npm install readmeio --save
```

2. Import the `readmeio` library:

**Typescript**
```typescript
import * as readme from 'readmeio';
```

**Node.js**
```javascript
const readme = require('readmeio');
```

3. Add the log call to your Node.js server. The generic Node.js integration uses the standard Node.js `IncomingMessage` and `ServerResponse` variables. These are accessible through the request handler provided to your Node.js server.

```javascript
const http = require('http');
const readme = require('readmeio');

const server = http.createServer((req, res) => {
  const timeOfRequest = new Date();

  res.on('finish', () => {
    const timeOfResponse = new Date();
    const response = 'Hello World';

    readme.log(readmeAPIKey, req, res, {
      apiKey: "abcdef1234",
      label: "User One",
      email: "userone@example.com",
      startedDateTime: timeOfRequest,
      responseEndDateTime: timeOfResponse,
      responseBody: response
    }, {
      development: true,
      fireAndForget: true
    })
      .then((result) => {
        console.log(result);
      });
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(response);
});

```


For more details about the parameters you can provide to the `log` function, refer to the [`log`](#log-reference) documentation.

5. Test a request:

```
curl -i {my api url}
```

Your server should log out an object that looks like this:
```javascript
{
  ids: ['cedb5593-d840-46a9-8ac3-98248ac124bc']
}
```

Take one of your IDs and go to the following URL to see what details were logged about that request:
```
{your ReadMe documentation's base URL}/logs/{logId}
```

### `log` Reference

Parameter    | Required? | Type            | Description
-------------|-----------|-----------------|-----
`readmeAPIKey` | yes       | string          | The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication).
`req`          | yes       | IncomingMessage | A Node.js `IncomingMessage` object, usually found in your server's request handler.
`res`          | yes       | ServerResponse  | A Node.js `ServerResponse` object, usually found in your server's request handler.
`payloadData`  | yes       | Object          | A collection of information that will be logged alongside this request. See [Payload Data](#payload-data) for more details.
`logOptions`   | no        | Object          | Additional options. You can read more under [Additional Node.js Options](#additional-nodejs-options)

Example:
```javascript
readme.log(readmeAPIKey, req, res, payloadData, logOptions)
```

### Payload Data
When logging your request with Node.js's native request and response data we can't get all the information we need. This parameter to the `log` function includes all the information we can't easily retrieve for you.

Option              | Required? | Type             | Description
--------------------|-----------|------------------|----------
`apiKey`              | yes       | string           | API Key used to make the request. Note that this is different from the `readmeAPIKey` described above and should be a value from your API that is unique to each of your users.
`label`               | no        | string           | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than an API key.
`email`               | no        | string           | Email of the user that is making the call.
`startedDateTime`     | yes       | Date             | A JavaScript `Date` object representing the time the server received the incoming request. This should be logged before retrieving and parsing the incoming request body.
`responseEndDateTime` | yes       | Date             | A JavaScript `Date` object representing the time the server finished sending the outgoing response.
`logId`               | no        | string           | A UUIDv4 identifier. If not provided this will be automatically generated for you. You can use this ID in conjunction with your `base_url` to create the URL that points to this log. i.e. `{base_url}/logs/{logId}`.
`routePath`           | no        | string           | If provided this path will be used instead of the request path. This is useful for grouping common routes together as `/users/{user_id}` instead of each page being unique as `/users/1`, `/users/2`, etc.
`requestBody`         | no        | Object or string | The incoming request body. You should provide this function a parsed object, but a string is acceptable if necessary.
`responseBody`        | no        | string           | The outgoing request body as a string.

Example:
```javascript
{
  apiKey: "abcdef1234",
  label: "User One",
  email: "userone@example.com",
  startedDateTime: timeOfRequest,
  responseEndDateTime: timeOfResponse,
  logId: "cedb5593-d840-46a9-8ac3-98248ac124bc",
  routePath: "/users/{user_id}",
  requestBody: {
    example: "data"
  },
  responseBody: "{\"example\": \"response\"}"
}
```

### Additional Node.js Options
Option           | Type             | Description
-----------------|------------------|--------
`denyList`         | Array of strings | An array of parameter names that will be redacted from the query parameters, request body (when provided as an object, or as a JSON or form encoded string), response body (when JSON) and headers.
`allowList`        | Array of strings | If included, `denyList` will be ignored and all parameters but those in this list will be redacted.
`development`      | bool             | Defaults to `false`. When `true`, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers.
`fireAndForget`    | bool             | Defaults to `true`. When `false`, the server will wait for the response from the metrics call. This will be slower, but the response is useful in debugging problems.

Example:
```javascript
{
  denyList: ['password', 'secret'],
  development: true,
  fireAndForget: true
}
```


## Limitations

- The Express.js plugin only supports `allowlist` and `denylist` for JSON and form-encoded request bodies. If you need `allowlist` or `denylist` support for other request bodies, you can parse the request body yourself, and provide it to the [`log` function](#log-reference).
