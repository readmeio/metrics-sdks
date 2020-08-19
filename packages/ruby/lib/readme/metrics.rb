require "readme/metrics/version"
require "readme/har/serializer"
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
      validate_options(options)

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

      har = Har::Serializer.new(env, response, start_time, end_time, @filter)
      user_info = @get_user_info.call(env)
      payload = Payload.new(har, user_info, development: @development)

      @@request_queue.push(payload.to_json)

      [status, headers, body]
    end

    private

    def validate_options(options)
      raise ConfigurationError, "Missing API Key" if options[:api_key].nil?

      if options[:reject_params]&.any? { |param| !param.is_a? String }
        raise ConfigurationError, "reject_params option must be an array of strings"
      end

      if options[:allow_only]&.any? { |param| !param.is_a? String }
        raise ConfigurationError, "allow_only option must be an array of strings"
      end

      if options[:buffer_length] && !options[:buffer_length].is_a?(Integer)
        raise ConfigurationError, "buffer_length must be an Integer"
      end

      if options[:development] && !is_a_boolean?(options[:development])
        raise ConfigurationError, "development option must be a boolean"
      end
    end

    def is_a_boolean?(arg)
      arg == true || arg == false
    end
  end

  class ConfigurationError < StandardError; end
end
