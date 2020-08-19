require "readme/metrics/version"
require "readme/har"
require "readme/filter"
require "readme/payload"
require "readme/request_queue"
require "httparty"

module Readme
  class Metrics
    SDK_NAME = "Readme.io Ruby SDK"
    DEFAULT_BUFFER_LENGTH = 10
    ENDPOINT = "https://metrics.readme.io/v1/request"

    def initialize(app, options, &get_user_info)
      raise("Missing API key") if options[:api_key].nil?

      @app = app
      @development = options[:development] || false
      @filter = Filter.for(
        reject: options[:reject_params],
        allow_only: options[:allow_only]
      )
      @get_user_info = get_user_info

      buffer_length = options[:buffer_length] || DEFAULT_BUFFER_LENGTH
      @@request_queue = Readme::RequestQueue.new(options[:api_key], buffer_length)
    end

    def call(env)
      start_time = Time.now
      status, headers, body = @app.call(env)
      end_time = Time.now

      response = Rack::Response.new(body, status, headers)

      har = Har.new(env, response, start_time, end_time, @filter)
      user_info = @get_user_info.call(env)
      payload = Payload.new(har, user_info, development: @development)

      @@request_queue.push(payload.to_json)

      [status, headers, body]
    end
  end
end
