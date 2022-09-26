# @readme/metrics-sdk-snippets

Generate code snippets for ReadMe Metrics SDKs in multiple languages.

[![Build](https://img.shields.io/github/workflow/status/readmeio/metrics-sdks/snippets.svg)](https://github.com/readmeio/metricds-sdks) [![](https://img.shields.io/npm/v/@readme/metrics-sdk-snippets)](https://npm.im/@readme/metrics-sdk-snippets)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

This library was built for [ReadMe's Metrics](https://readme.com/metrics) onboarding flow.

## Installation

```sh
npm install --save @readme/metrics-sdk-snippets
```

## Usage

```js
import { MetricsSDKSnippet } from '@readme/metrics-sdk-snippets';

const { convert } = new MetricsSDKSnippet(
  [
    {
      name: 'petstore_auth',
      default: 'default-key',
      source: 'security',
      type: 'oauth2',
    },
    {
      name: 'basic_auth',
      default: 'default',
      source: 'security',
      type: 'http',
    },
  ],
  { secret: 'my-readme-secret' }
);

console.log(convert('webhooks', 'node', 'express'));
```

This generates the following object:

```js
{
  ranges: {
    "security": {
      "petstore_auth": { "line": 26 }, // The line where this data is at.
      "basic_auth": { "line": 27 }
    }
  },
  snippet: '// see below',
}
```

<!-- TODO: add a link to the ReadMe documentation for personalized docs once that's published -->

The generated snippet for this results in a Personalized Docs Webhook example, which uses the [ReadMe Node Metrics SDK](https://npm.im/readmeio):

```js
import express from 'express';
import readme from 'readmeio';

const app = express();

// Your ReadMe secret
const secret = 'my-readme-secret';

app.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];

  try {
    readme.verifyWebhook(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.status(401).json({ error: e.message });
  }

  // Fetch the user from the database and return their data for use with OpenAPI variables.
  // const user = await db.find({ email: req.body.email })
  return res.json({
    // OAS Security variables
    petstore_auth: 'default-key',
    basic_auth: { user: 'user', pass: 'pass' },
  });
});

const server = app.listen(8000, '0.0.0.0', function () {
  console.log('Example app listening at http://%s:%s', server.address().address, server.address().port);
});
```
