---
title: Ruby (Rails/Rack) Setup
slug: ruby-api-metrics-set-up
category: 62292aea889520008ed0113b
---

> 🚧 Any issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.

## Overview

If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com/) so your team can get deep insights into your API's usage with [ReadMe Metrics](https://readme.com/metrics). Here's an overview of how the integration works:

<!-- TODO: we should rename these options! -->
<!--alex ignore blacklist whitelist-->

- You add the ReadMe middleware to your Rails application.
- The middleware sends to ReadMe the request and response objects that your server generates each time a user makes a request to your API. The entire objects are sent, unless you blacklist or whitelist keys.
- ReadMe extracts information to display in Metrics, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

## Getting Started

1. Add the gem to your projects `Gemfile`:

```ruby
gem "readme-metrics"
```

2. In the root of your project install the new gem:

```bash
bundle install
```

3. Configure the middleware in your development.rb and production.rb files:

The `Readme::Metrics` class takes an options hash argument that should at least contain `api_key`:

```ruby
{
  api_key: "<<user>>"
}
```

It also requires a block which should return a hash describing the user generating the request/response. These values maybe be fetched from the environment or hard-coded:

```ruby
{
  api_key: "api_key",
  label: "User Name",
  email: "user@example.com"
}
```

In the examples below, the Rails application is using a warden-based authentication gem (e.g., Devise), so the user can be fetched via the WardenProxy stored in the environment.

```ruby config/environments/development.rb
require "readme/metrics"

options = {
  api_key: "<<user>>",
  development: true
}

config.middleware.use Readme::Metrics, options do |env|
  current_user = env['warden'].authenticate

  if current_user.present?
    {
      api_key: current_user.id,
      label: current_user.name,
      email: current_user.email
    }
  else
    {
      api_key: "guest",
      label: "Guest User",
      email: "guest@example.com"
    }
  end
end
```

```ruby config/environments/production.rb
require "readme/metrics"

options = { api_key: "<<user>>" }

config.middleware.use Readme::Metrics, options do |env|
  current_user = env['warden'].authenticate

  if current_user.present?
    {
      api_key: current_user.id,
      label: current_user.name,
      email: current_user.email
    }
  else
    {
      api_key: "guest",
      label: "Guest User",
      email: "guest@example.com"
    }
  end
end
```

Additional you can also send the following two optional pieces of data within this payload:

<!-- prettier-ignore-start -->
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `log_id` | string | A UUIDv4 identifier. If not provided this will be automatically generated for you. Providing your own `log_id` is useful if you want to know the URL of the log in advance, i.e. `{your_base_url}/logs/{your_log_id}`. |
| `ignore` | bool | A flag that when set to `true` will suppress sending the log. |
<!-- prettier-ignore-end -->

## Configuration options

There are a few options in addition to `api_key` you can pass in to change how the logs are sent to ReadMe. These are all optional:

<!-- prettier-ignore-start -->
| Option | Type | Description |
| :--- | :--- | :--- |
| `development` | bool | Defaults to `false`. If `true`, the log will be separate from normal production logs. This is great for separating staging or test data from data coming from customers. |
| `buffer_length` | int | By default, we only send logs to ReadMe after 10 requests are made. Depending on the usage of your API it might make sense to send logs more or less frequently. |
| `reject_params` | Array of strings | An array of strings representing keys from your API requests' and responses' bodies and headers that you wish to omit from sending to ReadMe.<br /><br />You may only configure either `reject_params` or `allow_only` at one time.<br /><br />`reject_params: ["Authorization", "password"]` |
| `allow_only` | Array of strings | An array of strings representing keys from your API requests' and responses' bodies and headers that you only wish to send to ReadMe. All other keys will be omitted.<br /><br />You may only configure either `reject_params` or `allow_only` at one time. |
| `logger` | Logger | A logger class that conforms to the same interface as `Logger` or `RailsLogger`. Pass this option in if you have some custom logging solution and you want to send logs from the middleware to the same location. By default we have a `Logger` in place that logs to `stdout`. |
<!-- prettier-ignore-end -->

## Sample Applications

- [Rails](https://github.com/readmeio/metrics-sdks/tree/main/packages/ruby/examples/metrics-rails)
