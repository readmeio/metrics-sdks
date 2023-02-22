---
title: Python (Flask) Setup
slug: python-wsgi-api-metrics
category: 62292aea889520008ed0113b
---

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

> ❗ Working in Django or Flask? Don’t Use This!
>
> This SDK is no longer recommended for Django or Flask applications and should only be used for servers using other WSGI-based frameworks. We have since released SDKs that are specific to Django ([docs](https://docs.readme.com/docs/python-django-api-metrics)) and Flask ([docs](https://docs.readme.com/docs/python-flask-api-metrics)) servers — we strongly recommend using those instead!

## Overview

If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

<!-- TODO: we should rename these options! -->
<!--alex ignore blacklist whitelist-->

- You add the ReadMe middleware to your [WSGI](https://wsgi.readthedocs.io/) server.
- The middleware sends to ReadMe the request and response objects that your server generates each time a user makes a request to your API. The entire objects are sent, unless you blacklist or whitelist keys.
- ReadMe extracts information to display in Metrics, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

## Steps

1. From the directory of your codebase, run the following command in your command line to install the `readme-metrics` package from pypi:

```bash
pip install readme-metrics
```

2. Load the module into your server.

```python
from readme_metrics import MetricsApiConfig, MetricsMiddleware
```

3. Configure the following middleware function:

```python
app.wsgi_app = MetricsMiddleware(
    app.wsgi_app,
    MetricsApiConfig(
        "<<user>>",
        lambda req: {
            'api_key': req.<userId>,
            'label': req.<userNameToShowInDashboard>,
            'email': req.<userEmailAddress>
        },
    )
)
```

The `MetricsAPIConfig` takes the following parameters:

- Your ReadMe API Key. If you're [logged in](https://dash.readme.com/to/metrics) to these docs, this string is automatically populated in the preceeding code.
- A function that takes the `Request` object and returns a dict describing the user, or None if the request should not be logged
- Additional options: see details [below](#section-configuration-options)

### Minimal middleware configuration

Here's the bare minimum you need to configure:

- The ReadMe API Key: The first parameter is your project's ReadMe API Key. If you're logged in to these docs, this string is automatically populated in the proceeding middleware code. You can also see it here: <<user>>. Otherwise, copy and paste it in from `https://dash.readme.com/project/YOUR PROJECT/v/api-key`.
- API caller identification: To identify the API caller, replace `<userId>`, `<userNameToShowInDashboard>`, and `<userEmailAddress>` with the appropriate properties in your req object that contain your user data. More details follow in the next section.

## Identifying the API Caller

There are three fields that you can use to identify the user making the API call. We recommend passing all three to make API Metrics as useful as possible. (If your req object doesn't have all this information, we recommend adding it via additional middleware prior to this.)

```python
app.wsgi_app = MetricsMiddleware(
    app.wsgi_app,
    MetricsApiConfig(
        "<<user>>",
        lambda req: {
            'api_key': req.<api_key>,
            'label': req.<userNameToShowInDashboard>,
            'email': req.<userEmailAddress>
        },
    )
)
```

<!-- prettier-ignore-start -->
| Field | Type | Description |
| :--- | :--- | :--- |
| `api_key` | string | **Required** API key used to make the request, or another unique identifier of the user who made the request. |
| `label` | string | Display name for the user or account holder in the API Metrics Dashboard, since it's much more useful to have names than just unique identifiers or API keys. |
| `email` | string | Email address of the user or account holder that is making the call. |
<!-- prettier-ignore-end -->

## Configuration Options

There are a few options you can pass in to change how the logs are sent to ReadMe. These are passed in an object as the third parameter to the `readme.metrics` middleware.

```python
app.wsgi_app = MetricsMiddleware(
    app.wsgi_app,
    MetricsApiConfig(
        README_API_KEY,
        lambda req: {
            'id': 'unique id of user making call',
            'label': 'label for us to show for this user (account name, user name, email, etc.)',
            'email': 'email address for user'
        },
        development=false # set to true if in a development environment
        buffer_length=1,
        denylist=<arrayOfSensitiveKeysToOmit>,
        allowlist=<arrayofKeysOnlyToSend>,
    )
)
```

<!-- prettier-ignore-start -->
| Option | Type | Description |
| :--- | :--- | :--- |
| `buffer_length` | int | By default, we only send logs to ReadMe after 10 requests are made. Depending on the usage of your API it make make sense to send logs more or less frequently. |
| `development_mode` | bool | Defaults to `False`. If `True`, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers. |
| `background_worker_mode` | bool | Defaults to `True`. Determines whether to issue the call to the ReadMe API in a background thread (`True`), or in the main thread (`False`). If the ReadMe API call is issued in the main thread, your application server will block until the API call finishes. |
| `denylist` | dict | Defaults to `None`. An array of keys from your API requests and responses headers and bodies that you wish to block from being sent to ReadMe.<br /><br />Both the request and response will be checked for these keys, in their HTTP headers, form fields, URL parameters, and JSON request/response bodies. JSON is only checked at the top level, so a nested field will still be sent even if its key matches one of the keys in denylist.<br /><br />If you configure a denylist, it will override any `allowlist` configuration. |
| `allowlist`	| dict | Defaults to `None`. An array of headers and JSON body properties to send to ReadMe. If you configure an allowlist then all other properties will be dropped. Otherwise the semantics are similar to `denylist`. |
| `allowed_http_hosts` | dict | Defaults to `None`. A list of HTTP hosts which should be logged to ReadMe. If this is present, requests will only be sent to ReadMe whose Host header matches one of the allowed hosts. |
| `timeout` | int | Defaults to `3`. Timeout (in seconds) for calls back to the ReadMe Metrics API. |
<!-- prettier-ignore-end -->
