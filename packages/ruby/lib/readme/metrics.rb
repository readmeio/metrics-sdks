require "readme/metrics/version"
require "readme/har"
require "readme/payload"
require "httparty"

module Readme
  class Metrics
    ENDPOINT = "https://metrics.readme.io/v1/request"

    def initialize(app, api_key)
      @app = app
      @api_key = api_key
    end

    def call(env)
      har = Har.new(env)
      payload = Payload.new(har)

      HTTParty.post(
        ENDPOINT,
        basic_auth: {username: @api_key, password: ""},
        headers: {"Content-Type" => "application/json"},
        body: payload.to_json
      )
      @app.call(env)
    end
  end
end
