
> 🚧 Any Issues?
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

### Build Details

Track your API metrics within ReadMe.

[![npm](https://img.shields.io/npm/v/readmeio.svg)](https://npm.im/readmeio)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/nodejs/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)
### Overview

With ReadMe's Metrics API your team can get deep insights into your API's usage. If you're a developer, it's super easy to send your API logs to ReadMe, so your team can get deep insights into your API's usage. Here's an overview of how the integration works:

- You add the Node SDK to your server manually or via the included Express middleware.
- The Node SDK sends ReadMe the details of your API's incoming requests and outgoing responses, with the option for you to redact any private parameters or headers.
- ReadMe uses these request and response details to create an API Metrics Dashboard which can be used to analyze specific API calls or monitor aggregate usage data.

### Express.JS Integration

Note: If you're not using [Express.js](https://expressjs.com) check out our [Generic Node](#generic-node) documentation.

1. Locate the file in your company's API codebase that contains your Express server. Often this file is named `express.js` or `app.js`. You can also search on the code snippet `express()`

2. From the directory of this codebase, run the following command in your command line to install the `readmeio` package from [npm](https://www.npmjs.com/package/readmeio):
```
npm install readmeio --save
```

3. Load the `readmeio` module into your Express server. Usually near the beginning of the file, you will see several `require` statements. Add the following statement to that group:
**Typescript**
```typescript
import * as readme from 'readmeio';
```

**Node**
```javascript
const readme = require('readmeio');
```

4. Configure the following middleware function:
```javascript
app.use(readme.express('<<readme api key>>', req => ({
  apiKey: req.<apiKey>,
  label: req.<userNameToShowInDashboard>,
  email: req.<userEmailAddress>,
})));
```

For more details about the parameters you can provide to the `express` function, refer to the [express](#express-middleware-reference) documentation.

5. Test a request

```
curl -i {my api url}
```

You should see a response header `x-documentation-url` which you can load in your browser to see what details were logged about that request.

#### Express Middleware Reference
The express middleware accepts the following parameters

Note that this middleware is not likely to be sensitive to order. If you are new to Express, see [How to Write Middleware for Express.js Apps](https://stormpath.com/blog/how-to-write-middleware-for-express-apps)

parameter       | required? | description
------------------------------------
readmeAPIKey    | yes       | The API key for your readme project. This ensures your requests end up in your dashboard.
groupFn         | yes       | A function that helps translate incoming request data to our metrics grouping data. You can read more under [Grouping Function](#grouping-function).
options         | no        | Additional options. You can read more under [Additional Express Options](#additional-express-options)

e.g.
```javascript
readme.express(readmeAPIKey, groupFn, options);
```
#### Grouping Function
The grouping function is a function your script should include that extracts identifying information out of the `Request` object. While only `apiKey` is required, we recommend providing all three values to get the most out of the metrics dashboard.


```javascript
app.use(readme.metrics(readmeAPIKey, req => ({
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

#### Additional Express Options
option           |  description
---------------------------------
denyList         | An array of parameter names that will be redacted from the query parameters, request body, response body and headers
allowList        | If included, denyList will be ignored and all parameters but those in this list will be redacted
development      | When enabled, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers.
fireAndForget    | When enabled, the server will wait for the response from the metrics call. This will be slower, but the response is useful in debugging problems.
bufferLength     | This value should be a number representing the amount of requests to group up before sending them over the network. Increasing this value will increase performance but delay the time until logs show up in the dashboard
baseLogUrl       | This value is used when building the `x-documentation-url` header. If not provided we will make one API call a day to determine your url. If provided we will include that value and never look it up automatically.

### Generic Node Integration
Note: If you're using [Express.js](https://expressjs.com) check out our [Express.JS Integration](#express-js-integration) documentation.

1. *where to add it*

2. *how to install it*
```
npm install readmeio --save
```

3. *how to import it*
**Typescript**
```typescript
import * as readme from 'readmeio';
```

**Node**
```javascript
const readme = require('readmeio');
```

4. *how to call it*
```javascript
readme.log('<<readme api key>>', req, res, payloadData, logOptions)
  .then((result) => {
    console.log(result);
  });
```

For more details about the parameters you can provide to the `log` function, refer to the [log](#log-reference) documentation.

5. Test a request

```
curl -i {my api url}
```

Your server should log out an object that looks like this:
```javascript
```

Take one of your IDs and go to the following url to see what details were logged about that request
```
{your metrics url}/logs/{logId}
```

#### Log Reference

parameter    | required? | description
-------------------------------------
readmeAPIKey | yes       | The API key for your readme project. This ensures your requests end up in your dashboard.
req          | yes       |
res          | yes       |
payloadData  | yes       | Information that will be logged alongside this request. See (Payload Data)[#payload-data] for more details.
logOptions   | no        | Additional options. You can read more under [Additional Node Options](#additional-node-options)

e.g.
```javascript
log(readmeAPIKey, req, res, payloadData, logOptions)
```

#### Payload Data
When logging your request with node's native request and response data we can't get all the information we need. This parameter to the `log` function includes all the information we can't easily retrieve for you.

option              | required? | description
------------------------
apiKey              | yes       | API Key used to make the request.
label               | no        | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than a unique identifier.
email               | no        | Email of the user that is making the call
startedDateTime     | yes       | A Javascript date object representing the time the server received the incoming request. This should be logged before retrieving and parsing the incoming request body.
responseEndDateTime | yes       | A Javascript date object representing the time the server finished sending the outgoing response.
logId               | no        | A UUIDv4 identifier. If not provided this will be automatically generated for you. You can use this ID in conjunction with your `base_url` to create the URL that points to this log. i.e. `{base_url}/logs/{logId}`.
routePath           | no        | If provided this path will be used instead of the request path. This is useful for grouping common routes together as `/users/{user_id}` instead of each page being unique as `/users/1`, `/users/2`, etc.
requestBody         | no        | The parsed incoming request body, as a Javascript object
responseBody        | no        | The outgoing request body as a string

#### Additional Node Options
option           |  description
---------------------------------
denyList         | An array of parameter names that will be redacted from the query parameters, request body, response body and headers
allowList        | If included, denyList will be ignored and all parameters but those in this list will be redacted
development      | When enabled, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers.
fireAndForget    | When enabled, the server will wait for the response from the metrics call. This will be slower, but the response is useful in debugging problems.

### Documentation URL

With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `node_modules/.cache/readmeio`, to retrieve your projects `baseUrl`. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `baseLogUrl` option into the middleware, which should evaluate to the public-facing URL of your ReadMe project.


### Limitations

- Currently only supports JSON request bodies. Adding a `allowlist` or `denylist` for non-JSON bodies will not work (unless they're added to `req.body`) the same way that [`body-parser`](https://npm.im/body-parser) does it. The properties will be passed into [`postData`](http://www.softwareishard.com/blog/har-12-spec/#postData) as a `params` array.
