require "readme/metrics/version"
require "readme/har"
require "readme/payload"
require "httparty"

module Readme
  class Metrics
    SDK_NAME = "Readme.io Ruby SDK"
    ENDPOINT = "https://metrics.readme.io/v1/request"

    def initialize(app, options, &get_user_info)
      raise("Missing API key") if options[:api_key].nil?

      @app = app
      @api_key = options[:api_key]
      @development = options[:development] || false
      @get_user_info = get_user_info
    end

    def call(env)
      start_time = Time.now
      status, headers, body = @app.call(env)
      end_time = Time.now

      har = Har.new(env, status, headers, body, start_time, end_time)
      user_info = @get_user_info.call(env)
      payload = Payload.new(har, user_info, development: @development)

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
