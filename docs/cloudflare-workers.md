---
title: Cloudflare Workers
slug: sending-logs-to-readme-with-cloudflare
category: 62292aea889520008ed0113b
---

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

If you'd rather not use one of our language-oriented SDKs for sending your API logs into [ReadMe](https://readme.com) so you can get deep insights on your API's usage with [ReadMe Metrics](https://readme.com/metrics), we have another option: Cloudflare Workers!

## Overview

Cloudflare Workers are JavaScript snippets that are deployed and run at the edge on Cloudflare's CDN. You can read more about this over on their [blog](https://blog.cloudflare.com/introducing-cloudflare-workers/).

We have released a [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) app on Cloudflare's App Store, which enables you to send your log data to us at the network layer instead of through your application. This means your API can be written in any language, and you can send logs to ReadMe as long as you are using Cloudflare with the proxy turned on! [You can view our worker here.](https://www.cloudflare.com/apps/readme-api-metrics)

## Setup

It's a few small steps if you're a developer! There are only two steps required to get our worker setup with your API.

### In Your API

First, you will need to modify your API to return two new headers with your request. These allow ReadMe to understand who is making the call.

<!-- prettier-ignore-start -->
| Header | Description  |
| :--- | :--- |
| `x-readme-id` | Unique identifier for the caller. This can be anything that is unique such as an id of a user in your database. |
| `x-readme-label` | This will be augment the log in ReadMe, since it's much easier to remember a label than a unique identifier. |
| `x-readme-email` | _(Optional)_ For further insight into API calls, you can send an email along with your request to target users more easily. |
<!-- prettier-ignore-end -->

Here's an example of setting these headers in [Express.js](https://expressjs.com/):

```js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.user) {
    res.set('x-readme-id', req.user._id);
    res.set('x-readme-label', req.user.name);
    res.set('x-readme-email', req.user.email);
  }

  next();
});
```

### In Cloudflare's Console

Once you are properly returning these headers from your API requests, all you need to do is install the worker in Cloudflare!

Navigate to your domain in Cloudflare's dashboard, then select the Apps tab in the upper right. From here you will be able to search for "ReadMe API Metrics" and preview the app.

![Cloudflare's App dashboard](https://files.readme.io/d1d36a7-cloudflare_worker.png)

To install:

1. Click the blue "Preview on your site" button.
2. In the page that opens, which allows you to sign in to ReadMe via OAuth:
   - Select your project
   - Give Cloudflare your doc project's API key (which you can find at `https://dash.readme.com/yourProject/api-key`)
   - Configure which routes the worker should be applied to, i.e., which API routes you want to get usage metrics about.

![Cloudflare App installation](https://files.readme.io/5f77c35-readme.png)

Once you log in with ReadMe and configure which routes to track on your API, you are all set! Click the install button to finish the process and logs should start appearing in your dashboard as requests come in.

> 🚧 DNS Records Setting
>
> In order for Metrics to function correctly, your DNS Records setting in Cloudflare must use Cloudflare's proxy. This means your "Orange Cloud" should be enabled for your domain!
