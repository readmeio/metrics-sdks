---
title: Node.js Setup
slug: sending-logs-to-readme-with-nodejs
category: 62292aea889520008ed0113b
---

> 🚀 Upgrading to v6.0?
>
> Please see our [upgrade path documentation](#how-can-i-upgrade-to-v60).

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

## Overview

If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

- You add the Node.js SDK to your server manually or via the included [Express.js](https://expressjs.com/) middleware.
- The Node.js SDK sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
- ReadMe uses these request and response details to populate Metrics charts which can be used to analyze specific API calls or monitor aggregate usage data.

## Express.js Integration

> ℹ️
>
> **Note:** If you're not using [Express.js](https://expressjs.com/), check out our example integrations for [hapi](https://hapi.dev/) or [Fastify](https://www.fastify.io/) [here](https://github.com/readmeio/metrics-sdks/tree/main/packages/node/examples).

1. Locate the file in your organization's API codebase that contains your Express server; often this file is named `express.js`, `app.js`, or `server.js`. You can also search your codebase for `express()` as that's where Express will be usually instantiated from.
2. From the directory of this codebase, run the following command in your command line to install the [`readmeio` package from `npm`](https://www.npmjs.com/package/readmeio):

```bash
npm install readmeio --save
```

3. Load the `readmeio` module into your Express server. Usually near the beginning of the file, you will see several `import` or `require` statements. Add the following statement to that group:

#### Typescript

```ts
import * as readme from 'readmeio';
```

#### Node.js

```js
const readme = require('readmeio');
```

4. Configure the following middleware function:

```js
app.use((req, res, next) => {
  readme.log(readmeAPIKey, req, res, {
    // You might extract this from a header or parameter.
    apiKey: req.<apiKey>,

    // You might extract these from user data associated with the API key.
    label: req.<userNameToShowInDashboard>,
    email: req.<userEmailAddress>,
  });

  return next();
});
```

For more details about the parameters you can provide to the `express` function, refer to the [Express.js documentation](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs#express-middleware-reference).

5. Test a request:

```bash
curl -i {my api url}
```

You should see a response header `x-documentation-url`. This header contains a URL to a detailed log of the API request/response. For info on configuring this header, check out the [Documentation URL](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs#documentation-url) docs.

### `log` Reference

The `log` function accepts the following parameters:

> Note that this middleware is not likely to be sensitive to order. If you are new to Express, see [How to Write Middleware for Express.js Apps](https://stormpath.com/blog/how-to-write-middleware-for-express-apps).

<!-- prettier-ignore-start -->
| Parameter | Required? | Description |
| :--- | :--- | :--- |
| `readmeAPIKey` | yes | The API key for your ReadMe project. This ensures your requests end up in your dashboard. You can read more about the API key in [our docs](https://docs.readme.com/reference/authentication). |
| `req` | yes | The incoming `Request` object from Express. |
| `res` | yes | The outgoing `Response` object from Express. |
| `groupFn` | yes | A function that helps translate incoming request data to our metrics grouping data. You can read more under [Grouping Function](#grouping-function).
| `options` | no | Additional options. You can read more under [Additional Express Options](#additional-express-options)
<!-- prettier-ignore-end -->

#### Example

```js
readme.log(readmeAPIKey, req, res, groupFn, options);
```

### Grouping Function

The grouping function is a function your script should include that extracts identifying information out of the [`req`](https://expressjs.com/en/4x/api.html#req) object. While only `apiKey` is required, we recommend providing all three values to get the most out of the metrics dashboard.

Return data:

<!-- prettier-ignore-start -->
| Field | Required? | Type | Usage |
| :--- | :--- | :--- | :--- |
| `apiKey` | yes | string | API Key used to make the request. Note that this is different from the `readmeAPIKey` described above and should be a value from your API that is unique to each of your users. |
| `label` | no | string | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than an API key. |
| `email` | no | string | Email of the user that is making the call. |
<!-- prettier-ignore-end -->

#### Example

```js
app.use((req, res, next) => {
  readme.log(readmeAPIKey, req, res, {
    // You might extract this from a header or parameter.
    apiKey: req.<apiKey>,

    // You might extract these from user data associated with the API key.
    label: req.<userNameToShowInDashboard>,
    email: req.<userEmailAddress>,
  });

  return next();
});
```

### Additional Express Options

<!-- prettier-ignore-start -->
| Option | Type | Description |
| :--- | :--- | :--- |
| `allowlist` | Array of strings | If included, `denylist` will be ignored and all parameters but those in this list will be redacted. |
| `baseLogUrl` | string | This value is used when building the x-documentation-url header (see docs [below](#documentation-url)). It is your ReadMe documentation's base URL (e.g. `https://example.readme.com`). If not provided, we will make one API call a day to determine your base URL (more info in [Documentation URL](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs#documentation-url). If provided, we will use that value and never look it up automatically. |
| `bufferLength` | number | Defaults to `1`. This value should be a number representing the amount of requests to group up before sending them over the network. Increasing this value will increase performance but delay the time until logs show up in the dashboard. The default value is 1. |
| `denylist` | Array of strings | An array of parameter names that will be redacted from the query parameters, request body (when JSON or form-encoded), response body (when JSON) and headers. For nested request parameters use dot notation (e.g. `a.b.c` to redact the field `c` within `{ a: { b: { c: 'foo' }}}`). |
| `development` | bool | Defaults to false. When `true`, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers. |
| `fireAndForget` | bool | Defaults to `true`. When `false`, the server will wait for the response from the metrics call. This will be slower, but the response is useful in debugging problems. |
<!-- prettier-ignore-end -->

#### Example

```js
{
  denyList: ['password', 'secret'],
  development: true,
  fireAndForget: true,
  bufferLength: 1,
  baseLogUrl: "https://example.readme.com"
}
```

### Documentation URL

With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `node_modules/.cache/readmeio`, to retrieve your projects baseUrl. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `baseLogUrl` option into the middleware, which should evaluate to the public-facing URL of your ReadMe project.

## Security

By default API keys sent the grouping function and `Authorization` headers are encrypted into an integrity hash using the [ssri](https://npm.im/ssri) library. In order for us to safely utilize this data later in your ReadMe dashboards, and allow you to do user tracing, we pluck the last 4 characters off of the end of the encrypted string and save that with the integrity hash.

For example if the API key is `1999e4893f732ba38b948dbe8d34ed48cd54f058` we will include `f058` on the end of the hash, resulting in ReadMe Metrics recording the following in our database:

> sha512-/0bFzsk3a5wrmdTxA6qstL9TExGVTr9BUgZvhIjVrTa2M/KsNkW+AF8wJtgYd1OIvHc5qGgB9WfUbCA8PPbE8w==?f058

## Sample Applications

- [Express](https://github.com/readmeio/metrics-sdks/tree/main/packages/node/examples/express)
- [Fastify](https://github.com/readmeio/metrics-sdks/tree/main/packages/node/examples/fastify)
- [Hapi](https://github.com/readmeio/metrics-sdks/tree/main/packages/node/examples/hapi)

## FAQ

### Are there any limitations?

- Though we offer `allowlist` and `denylist` options for suppressing data you send to API Metrics, they are only supported on JSON and form-encoded request bodies. If you need to suppression support for other request body types you can parse the request body yourself and supply that modified payload into the [`log` function](#log-reference) where you'd send us `req`.

### How can I upgrade to v6.0?

> ℹ️
>
> If you are already using `readme.log()` as your entry point for recording API Metrics you don't need to do change anything.

With the v6 release of our Node SDK we've heavily simplified how the library can be implemented across every available JS web framework out there.

Given a `readme.express()` code snippet that looks like the following:

```js
app.use(
  readme.express(readmeAPIKey, req => ({
    apiKey: req.<apiKey>,
    label: req.<userNameToShowInDashboard>,
    email: req.<userEmailAddress>,
  }))
);
```

You should change your implementation to use our new `readme.log()` method, resulting in something that looks like this:

```js
app.use((req, res, next) => {
  readme.log(readmeAPIKey, req, res, {
    apiKey: req.<apiKey>,
    label: req.<userNameToShowInDashboard>,
    email: req.<userEmailAddress>,
  });

  return next();
});
```
