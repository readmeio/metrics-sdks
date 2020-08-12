require "readme/metrics/version"
require "readme/har"
require "readme/payload"
require "httparty"

module Readme
  class Metrics
    SDK_NAME = "Readme.io Ruby SDK"
    ENDPOINT = "https://metrics.readme.io/v1/request"

    def initialize(app, api_key)
      @app = app
      @api_key = api_key
    end

    def call(env)
      start_time = Time.now
      status, headers, body = @app.call(env)
      end_time = Time.now

      har = Har.new(env, status, headers, body, start_time, end_time)
      payload = Payload.new(har)

      HTTParty.post(
        ENDPOINT,
        basic_auth: {username: @api_key, password: ""},
        headers: {"Content-Type" => "application/json"},
        body: payload.to_json
      )

      [status, headers, body]
    end
  end
end
