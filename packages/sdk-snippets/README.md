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

const { convert } = new MetricsSDKSnippet([
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
]);

console.log(convert('node', 'express'));
```

Outputs:

```js
// Save this code as `server.js`
// Run the server with `node server.js`
const readme = require('readmeio');
const express = require('express');

const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // Verify the request is legitimate and came from ReadMe
  const signature = req.headers['readme-signature'];

  // Your ReadMe secret
  const secret = 'rdme_xxxx';

  try {
    readme.verify(req.body, signature, secret);
  } catch (e) {
    // Handle invalid requests
    return res.sendStatus(401);
  }

  // Fetch the user from the db
  db.find({ email: req.body.email }).then(user => {
    return res.json({
      // OAS Security variables
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' },
    });
  });
});
```
