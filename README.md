# readme-metrics

Track your API metrics within ReadMe.

[![PyPi](https://img.shields.io/pypi/v/readme-metrics)](https://pypi.org/project/readme-metrics/)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/python/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

```
pip install readme-metrics
```

## Usage

Just include the `MetricsMiddleware` in any WSGI app!

```python
from readme_metrics import MetricsApiConfig, MetricsMiddleware

app = Flask(__name__)

app.wsgi_app = MetricsMiddleware(
    app.wsgi_app,
    MetricsApiConfig(
        api_key='<<your-readme-api-key>>',
        grouping_function=lambda req: {
            'api_key': 'unique api_key of the user',
            'label': 'label for us to show for this user (ie email, project name, user name, etc)',
            'email': 'email address for user'
        },
    )
)
```

### Configuration Options

There are a few options you can pass in to change how the logs are sent to ReadMe. These can be passed in `MetricsApiConfig`.

```python
MetricsApiConfig(
    api_key='<<your-readme-api-key>>',
    grouping_function=lambda req: {
        'api_key': 'unique api_key of the user',
        'label': 'label for us to show for this user (ie email, project name, user name, etc)',
        'email': 'email address for user'
    },
    buffer_length=1,
    denylist=['password'] # Prevents a request or response's "password" field from being sent to ReadMe
)
```

| Option                 | Use                                                |
| :--------------------- | :------------------------------------------------- |
| development_mode       | **default: false** If true, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers. |
| background_worker_mode | **default: true** If true, requests to the ReadMe API will be made in a background thread. If false, the ReadMe API request will be made synchronously in the main thread, potentially slowing down your HTTP service. |
| denylist               | **optional** An array of keys from your API requests and responses headers and bodies that are blocked from being sent to ReadMe. Both the request and response will be checked for these keys, in their HTTP headers, form fields, URL parameters, and JSON request/response bodies. JSON is only checked at the top level, so a nested field will still be sent even if its key matches one of the keys in `denylist`.<br /><br />If you configure a denylist, it will override any allowlist configuration. |
| allowlist              | **optional** An array of keys from your API requests and responses headers and bodies that you only wish to send to ReadMe. All other semantics match `denylist`. Like `denylist`, only the top level of JSON request/response bodies are filtered. If this option is configured, **only** the whitelisted properties will be sent. |
| buffer_length          | **default: 10** Sets the number of API calls that should be recieved before the requests are sent to ReadMe. |
| allowed_http_hosts     | A list of HTTP hosts which should be logged to ReadMe. If this is present, a request will only be sent to ReadMe if its Host header matches one of the allowed hosts. |
| timeout                | Timeout (in seconds) for calls back to the ReadMe Metrics API. Default 3 seconds. |
