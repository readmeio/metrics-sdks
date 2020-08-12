# readmeio

Track your API metrics within ReadMe.

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

## Usage

`Readme::Metrics` is a Rack middleware and is compatible with all Rack-based
apps, including Rails.

### Rails

```ruby
# application.rb
require "readme/metrics"

config.middleware.use Readme::Metrics, "YOUR_API_KEY"
```

### Rack::Builder

```ruby
Rack::Builder.new do |builder|
  builder.use Readme::Metrics, "YOUR_API_KEY"
  builder.run your_app
end
```
