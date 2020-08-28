# readmeio

Track your API metrics within ReadMe.

[![Build](https://github.com/readmeio/metrics-sdks/workflows/ruby/badge.svg)](https://github.com/readmeio/metrics-sdks)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

Add it to your Gemfile

`gem "readme-metrics"`

## Usage

`Readme::Metrics` is a Rack middleware and is compatible with all Rack-based
apps, including Rails.

When configuring the middleware, you must provide a block to tell the
middleware how to get values for the current user. These may be values taken
from the environment, or you may hardcode them.

If you're using Warden-based authentication like Devise, you may fetch the
current_user for a given request from the environment.

### Batching requests

By default, the middleware will batch requests to the ReadMe API in groups of
10. For every 10 requests made to your application, the middleware will make a
single request to ReadMe. If you wish to override this, provide a
`buffer_length` option when configuring the middleware.

### Sensitive Data

If you have sensitive data you'd like to prevent from being sent to the Metrics
API via headers, query params or payload bodies, you can specify a list of keys
to filter via the `reject_params` option. Key-value pairs matching these keys
will not be included in the request to the Metrics API.

You are also able to specify a set of `allow_only` which should only be sent through.
Any header or body values not matching these keys will be filtered out and not
send to the API.

You may only specify either `reject_params` or `allow_only` keys, not both.

### Rails

```ruby
# config/environments/development.rb or config/environments/production.rb
require "readme/metrics"

options = {
  api_key: "YOUR_API_KEY",
  development: false,
  reject_params: ["not_included", "dont_send"],
  buffer_length: 5,
}

config.middleware.use Readme::Metrics, options do |env|
  current_user = env['warden'].authenticate

  if current_user.present?
    {
      id: current_user.id,
      label: current_user.name,
      email: current_user.email
    }
  else
    {
      id: "guest",
      label: "Guest User",
      email: "guest@example.com"
    }
  end
end
```

### Rack::Builder

```ruby
Rack::Builder.new do |builder|
  options = {
    api_key: "YOUR_API_KEY",
    development: false,
    reject_params: ["not_included", "dont_send"]
  }

  builder.use Readme::Metrics, options do |env|
    {
      id: "my_application_id"
      label: "My Application",
      email: "my.application@example.com"
    }
  end
  builder.run your_app
end
```

### Sample Applications

- [Rails](https://github.com/readmeio/metrics-sdk-rails-sample)
- [Rack](https://github.com/readmeio/metrics-sdk-racks-sample)
- [Sinatra](https://github.com/readmeio/metrics-sdk-sinatra-example)

## License

[View our license here](https://github.com/readmeio/metrics-sdks/tree/master/packages/ruby/LICENSE)
