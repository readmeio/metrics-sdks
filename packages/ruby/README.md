# readmeio

Track your API metrics within ReadMe.

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

## Usage

`Readme::Metrics` is a Rack middleware and is compatible with all Rack-based
apps, including Rails.

When configuring the middleware, you must provide a block to tell the
middleware how to get values for the current user. These may be values taken
from the environment, or you may hardcode them.

If you're using Warden-based authentication like Devise, you may fetch the
current_user for a given request from the environment.

### Rails

```ruby
# application.rb
require "readme/metrics"

config.middleware.use Readme::Metrics, "YOUR_API_KEY"do |env|
  current_user = env['warden'].authenticate(scope: :current_user)

  {
    id: current_user.id
    label: current_user.full_name,
    email: current_user.email
  }
end

```

### Rack::Builder

```ruby
Rack::Builder.new do |builder|
  builder.use Readme::Metrics, "YOUR_API_KEY" do |env|
    {
      id: "my_application_id"
      label: "My Application",
      email: "my.application@example.com"
    }
  end
  builder.run your_app
end
```
