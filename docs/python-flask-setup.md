---
title: Python (Flask) Setup
slug: python-flask-api-metrics
category: 62292aea889520008ed0113b
---

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

## Overview

If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

- You install the `ReadMe` [Flask](https://flask.palletsprojects.com/) extension and configure it in your Flask application.
- You write a grouping function, which is used to tie each API request to the user or API key that initiated the request.
- The extension will send to ReadMe the request and response objects that your server generates each time a user makes a request to your API. The entire objects are sent, unless you deny or allow specific keys from the request.
- ReadMe extracts information to display in Metrics, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using the data returned by your grouping function.

## Steps

1. From the directory of your codebase, run the following command in your command line to install the Flask variant of the `readme-metrics` package from [pypi](https://pypi.org/project/readme-metrics/). You can also add this to your `requirements.txt` file.

```bash
pip install "readme-metrics[Flask]"
```

2. In your codebase, write a grouping function to inform ReadMe of the user or API key holder that is responsible for a given request. The grouping function receives the current Flask `Request` object as input, and should return a data structure describing the current user or API key holder. A basic grouping function would look like this:

```python
def grouping_function(request):
    # You can lookup your user here, pull it off the request object, etc.
    # Your grouping function should return None if you don't want the request
    # to be logged, and otherwise return a structure like the one below.
    if user_is_authenticated:
        return {
            "api_key": "unique api_key of the user",
            "label": "label for us to show for this user (account name, user name, email, etc)",
            "email": "email address for user"
        }
    else:
        return None
```

3. Set up the extension wherever you initialize your Flask app.

```python
from flask import Flask
from readme_metrics import MetricsApiConfig
from readme_metrics.flask_readme import ReadMeMetrics

# You already have code to create a Flask app...
app = Flask("Your-App-Name")

# Just add code to create the ReadMeMetrics extension and connect it to your app.
metrics_extension = ReadMeMetrics(
    MetricsApiConfig(
        api_key="<<user>>",
        grouping_function=path.to.your.grouping_function
    )
)
metrics_extension.init_app(app)
```

The MetricsApiConfig object takes the following parameters:

- Your ReadMe API Key. If you're [logged in](https://dash.readme.com/to/metrics) to these docs, this string is automatically populated in the preceeding code.
- A function that takes the `Request` object and returns a dict describing the user, or None if the request should not be logged
- Additional options: see details [below](#section-configuration-options)

## Identifying the API Caller

There are three fields that you can use to identify the user making the API call. We recommend passing all three to make API Metrics as useful as possible.

<!-- prettier-ignore-start -->
| Field | Type | Description |
| :--- | :--- | :--- |
| `api_key` | string | **Required** API key used to make the request, or another unique identifier of the user who made the request. |
| `label` | string | Display name for the user or account holder in the API Metrics Dashboard, since it's much more useful to have names than just unique identifiers or API keys. |
| `email` | string | Email address of the user or account holder that is making the call. |
<!-- prettier-ignore-end -->

## Configuration Options

There are a few options you can pass in to change how the logs are sent to ReadMe. These are passed in an object as the first parameter to `ReadMeMetrics` extension constructor.

```python
metrics_extension = ReadMeMetrics(
    MetricsApiConfig(
        api_key="KEYS:USER",
        grouping_function=path.to.your.grouping_function,
        buffer_length=1,
        background_worker_mode=False,
        allowlist=["city", "state", "postal_code", "country"],
        timeout=15
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
