# readme-metrics

Track your API metrics within ReadMe. For your convenience there are 3 different implementations in this package: middleware for Django, an extension for Flask, or WSGI middleware that can work with any other framework built on WSGI.

[![PyPi](https://img.shields.io/pypi/v/readme-metrics)](https://pypi.org/project/readme-metrics/)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/python/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)


## Django middleware installation and usage

### Installation

Install the Django variant of the package:
```
pip install readme-metrics[Django]
```

### Usage

First you'll need to write a "grouping function" to inform ReadMe of the user or API key holder that is responsible for the current request. The grouping function receives the Django `request` object as input, and should return a data structure describing the current user or API key. A basic grouping function would look like this:

```python
def grouping_function(request):
    # You can lookup your user here, pull it off the request object, etc.
    # Your grouping function should return None if you don't want the request
    # to be logged, and otherwise return a structure like the one below.
    if user_is_authenticated:
        return {
            "api_key": "unique api_key of the user",
            "label": "label for us to show for this user (ie email, project name, user name, etc)",
            "email": "email address for user"
        }
    else:
        return None
```

Second, once you have written a grouping function, add a `README_METRICS_CONFIG` setting using the `MetricsApiConfig` helper object:

```python
from readme_metrics import MetricsApiConfig
README_METRICS_CONFIG = MetricsApiConfig(
    api_key="Your-ReadMe-API-Key-Goes-Here",
    grouping_function="module.path.to.your.grouping_function"
)
```

Finally, also in your `settings.py` configuration file, add our `MetricsMiddleware` to your list of middleware:

```python
MIDDLEWARE = [
    ...,
    "readme_metrics.django.MetricsMiddleware",
    ...
]
```



## Flask extension installation and usage

### Installation

Install the Flask variant of the package:
```
pip install readme-metrics[Flask]
```

### Usage

First you'll need to write a "grouping function" to inform ReadMe of the user or API key holder that is responsible for the current request. The grouping function receives the current Flask `Request` object as input, and should return a data structure describing the current user or API key. A basic grouping function would look like this:

```python
def grouping_function(request):
    # You can lookup your user here, pull it off the request object, etc.
    # Your grouping function should return None if you don't want the request
    # to be logged, and otherwise return a structure like the one below.
    if user_is_authenticated:
        return {
            "api_key": "unique api_key of the user",
            "label": "label for us to show for this user (ie email, project name, user name, etc)",
            "email": "email address for user"
        }
    else:
        return None
```

Second, once you have written a grouping function, set up the extension wherever you create your Flask app.

```python
from flask import Flask
from readme_metrics import MetricsApiConfig
from readme_metrics.flask_readme import ReadMeMetrics

# You already have code to create a Flask app...
app = Flask("Your-App-Name")

# Just add code to create the ReadMeMetrics extension and connect it to your app.
metrics_extension = ReadMeMetrics(
    MetricsApiConfig(
        api_key="Your-ReadMe-API-Key-Goes-Here",
        grouping_function=module.path.to.grouping_function
    )
)
metrics_extension.init_app(app)

```


## WSGI middleware installation and usage

### Installation

Install the basic package:
```
pip install readme-metrics
```

### Usage

First you'll need to write a "grouping function" to inform ReadMe of the user or API key holder that is responsible for the current request. The grouping function receives the WSGI `Request` object as input, and should return a data structure describing the current user or API key. A basic grouping function would look like this:

```python
def grouping_function(request):
    # You can lookup your user here, pull it off the request object, etc.
    # Your grouping function should return None if you don't want the request
    # to be logged, and otherwise return a structure like the one below.
    if user_is_authenticated:
        return {
            "api_key": "unique api_key of the user",
            "label": "label for us to show for this user (ie email, project name, user name, etc)",
            "email": "email address for user"
        }
    else:
        return None
```

Then, wherever you initialize your WSGI app, you can wrap it with our middleware wrapper:

```python
from readme_metrics import MetricsApiConfig, MetricsMiddleware

wsgi_app_with_metrics = MetricsMiddleware(
    original_wsgi_app,
    MetricsApiConfig(
        api_key='<<your-readme-api-key>>',
        grouping_function=module.path.to.grouping_function
    )
)
```

Finally, configure your WSGI app server to execute `wsgi_app_with_metrics` instead of `original_wsgi_app`. (Instructions for this vary depending on the WSGI app server you're using and how it's configured.)


## Configuration Options

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

## Development

### Install dependencies:

```sh
# https://pypi.org/project/pipx/
brew install pipx

# https://virtualenv.pypa.io/en/latest/installation.html#via-pipx
pipx install virtualenv
# Create a virtual environment for dependencies to be installed into
virtualenv venv

# Go inside of the virtual environment
# https://www.freecodecamp.org/news/how-to-manage-python-dependencies-using-virtual-environments/
source ./venv/bin/activate

# Then finally install dependencies
pip install -r requirements.txt
```
