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

Just include the `MetricsMiddleware` into your API!

```python
from readme_metrics import MetricsApiConfig, MetricsMiddleware

app = Flask(__name__)

app.wsgi_app = MetricsMiddleware(
    app.wsgi_app,
    MetricsApiConfig(
        README_API_KEY,
        lambda req: {
            'id': 'unique id of user making call',
            'label': 'label for us to show for this user (ie email, project name, user name, etc)',
            'email': 'email address for user'
        },
    )
)
```

### Configuration Options
There are a few options you can pass in to change how the logs are sent to ReadMe. These can be passed in `MetricsApiConfig`.

Ex)

```python
MetricsApiConfig(
    README_API_KEY,
    lambda req: {
        'id': 'unique id of user making call',
        'label': 'label for us to show for this user (ie email, project name, user name, etc)',
        'email': 'email address for user'
    },
    buffer_length=1,
    blacklist=['credit_card'] # Prevents credit_card in the request from being sent to readme
)
```

| Option | Use |
| :--- | :--- |
| development_mode | **default: false** If true, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers |
| blacklist | **optional** An array of keys from your API requests and responses headers and bodies that you wish to blacklist from sending to ReadMe.<br /><br />If you configure a blacklist, it will override any whitelist configuration. |
| whitelist | **optional** An array of keys from your API requests and responses headers and bodies that you only wish to send to ReadMe. |
| buffer_length | **default: 10** Sets the number of API calls that should be recieved before the requests are sent to ReadMe |
| allowed_http_hosts | A list of allowed http hosts for sending data to the ReadMe API.|
