# readme-metrics

Track your API metrics within ReadMe.

[![RubyGems](https://img.shields.io/gem/v/readme-metrics)](https://rubygems.org/gems/readme-metrics)
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

### SDK Options

Option           | Type             | Description
-----------------|------------------|---------
`reject_params`         | Array of strings | If you have sensitive data you'd like to prevent from being sent to the Metrics API via headers, query params or payload bodies, you can specify a list of keys
to filter via the `reject_params` option. NOTE: cannot be used in conjunction with `allow_only`. You may only specify either `reject_params` or `allow_only` keys, not both.
`allow_only`        | Array of strings | The inverse of `reject_params`. If included all parameters but those in this list will be redacted. NOTE: cannot be used in conjunction with `reject_params`. You may only specify either `reject_params` or `allow_only` keys, not both.
`development`      | bool             | Defaults to `false`. When `true`, the log will be marked as a development log. This is great for separating staging or test data from data coming from customers.
`buffer_length`     | number           | Defaults to `1`. This value should be a number representing the amount of requests to group up before sending them over the network. Increasing this value may increase performance by batching, but will also delay the time until logs show up in the dashboard given the buffer size needs to be reached in order for the logs to be sent.

### Payload Data

Option              | Required? | Type             | Description
--------------------|-----------|------------------|----------
`api_key`           | yes       | string           | API Key used to make the request. Note that this is different from the `readmeAPIKey` described above in the options data. This should be a value from your API that is unique to each of your users.
`label`             | no        | string           | This will be the user's display name in the API Metrics Dashboard, since it's much easier to remember a name than an API key.
`email`             | no        | string           | Email of the user that is making the call.
`log_id`            | no        | string           | A UUIDv4 identifier. If not provided this will be automatically generated for you. Providing your own `log_id` is useful if you want to know the URL of the log in advance, i.e. `{your_base_url}/logs/{your_log_id}`.
`ignore`            | no        | bool           | A flag that when set to `true` will suppress sending the log.

### Rails

```ruby
# config/environments/development.rb or config/environments/production.rb
require "readme/metrics"

sdk_options = {
  api_key: "<<apiKey>>",
  development: false,
  reject_params: ["not_included", "dont_send"],
  buffer_length: 5,
}

config.middleware.use Readme::Metrics, sdk_options do |env|
  current_user = env['warden'].authenticate

  payload_data = current_user.present? ? {
    api_key: current_user.api_key, # Not the same as the ReadMe API Key
    label: current_user.name,
    email: current_user.email
  } : {
    api_key: "guest",
    label: "Guest User",
    email: "guest@example.com"
  }

  payload_data
end
```

### Rack

```ruby
# config.ru
sdk_options = {
  api_key: "<<apiKey>>",
  development: false,
  reject_params: ["not_included", "dont_send"]
}

use Readme::Metrics, sdk_options do |env|
    {
      api_key: "owlbert_api_key"
      label: "Owlbert",
      email: "owlbert@example.com",
      log_id: SecureRandom.uuid
    }
end

run YourApp.new
```

### Sample Applications

- [Rails](https://github.com/readmeio/metrics-sdk-rails-sample)
- [Rack](https://github.com/readmeio/metrics-sdk-racks-sample)
- [Sinatra](https://github.com/readmeio/metrics-sdk-sinatra-example)

### Contributing

Ensure you are running the version of ruby specified in the `Gemfile.lock`; use `rvm` to easy manage ruby versions. Run `bundle` to install dependencies, `rake` or `rspec` to ensure tests pass, and `bundle exec standardrb` to lint the code.

## License

[View our license here](https://github.com/readmeio/metrics-sdks/tree/main/packages/ruby/LICENSE)
