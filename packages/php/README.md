# readme/metrics

Track your API metrics within ReadMe.

[![Packagist](https://img.shields.io/packagist/v/readme/metrics.svg)](https://packagist.org/packages/readme/metrics)
[![Build](https://github.com/readmeio/metrics-sdks/workflows/php/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

```
composer require readme/metrics
```

## Usage

`readme/metrics` is currently targeted towards codebases utilizing the [Laravel](https://laravel.com/) framework. To get up and running, you'll need to do the following things:

1. Publish our config file into your `config/` directory:

```
php artisan vendor:publish --provider="ReadMe\ServiceProvider"
```

2. In `config/readme.php`, change `api_key` to the API key we provide to you in your ReadMe project on https://dash.readme.io.
3. In that config file, you will also see a `group_handler` that will be set to `App\Handler\ReadMe::class`. This file will exist within `app\Handler` in your application and you should change the contents of its `constructGroup` function to return data that's relevant to your codebase and users. We've provided some simple defaults but you'll likely need to change them.

Once you've done all that, add `\ReadMe\Middleware::class` into your API middleware in `app/Http/Kernel.php` and API Metrics will start streaming to your ReadMe project!

### `res.headers['x-documentation-url']`
With the middleware loaded, all requests that funneled through it will receive a `x-documentation-url` header applied to the response. The value of this header will be the URL on ReadMe Metrics with which you can view the log for that request.

Note that in order to generate this URL, an API request is made to ReadMe once a day, and cached to a local file in `$COMPOSER_HOME/cache`, to retrieve your projects `base_url`. If this request to ReadMe fails, the `x-documentation-url` header will not be added to responses.

If you wish to not rely on this cache, you can opt to supply a `base_log_url` option within `config/readme.php`. This value should evaluate to the public-facing URL of your ReadMe project.

### Configuration Options
There are a few options you can pass in to change how the logs are sent to ReadMe. These are configured within `config/readme.php`.

| Option | Use |
| :--- | :--- |
| development_mode | **default: false** If true, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers |
| blacklist | **optional** An array of keys from your API requests and responses headers and bodies that you wish to blacklist from sending to ReadMe.<br /><br />If you configure a blacklist, it will override any whitelist configuration. |
| whitelist | **optional** An array of keys from your API requests and responses headers and bodies that you only wish to send to ReadMe. |
| base_log_url | **optional** This is the base URL for your ReadMe project. Normally this would be `https://projectName.readme.io` or `https://docs.yourdomain.com`, however if this value is not supplied, a request to the ReadMe API will be made once a day to retrieve it. This data is cached into `$COMPOSER_HOME/cache`.
