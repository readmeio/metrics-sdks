require "readme/metrics/version"
require "readme/har/serializer"
require "readme/filter"
require "readme/payload"
require "readme/request_queue"
require "readme/errors"
require "httparty"
require "logger"

module Readme
  class Metrics
    SDK_NAME = "Readme.io Ruby SDK"
    DEFAULT_BUFFER_LENGTH = 10
    ENDPOINT = "https://metrics.readme.io/v1/request"
    USER_INFO_KEYS = [:id, :label, :email]

    def self.logger
      @@logger
    end

    def initialize(app, options, &get_user_info)
      validate_options(options)
      raise Errors::ConfigurationError, Errors::MISSING_BLOCK_ERROR if get_user_info.nil?

      @app = app
      @development = options[:development] || false
      @filter = Filter.for(
        reject: options[:reject_params],
        allow_only: options[:allow_only]
      )
      @get_user_info = get_user_info

      buffer_length = options[:buffer_length] || DEFAULT_BUFFER_LENGTH
      @@request_queue = Readme::RequestQueue.new(options[:api_key], buffer_length)
      @@logger = options[:logger] || Logger.new($stdout)
    end

    def call(env)
      start_time = Time.now
      status, headers, body = @app.call(env)
      end_time = Time.now

      response = Rack::Response.new(body, status, headers)

      har = Har::Serializer.new(env, response, start_time, end_time, @filter)

      user_info = @get_user_info.call(env)

      if user_info_invalid?(user_info)
        Readme::Metrics.logger.error Errors.bad_block_message(user_info)
      else
        payload = Payload.new(har, user_info, development: @development)
        @@request_queue.push(payload.to_json)
      end

      [status, headers, body]
    end

    private

    def validate_options(options)
      raise Errors::ConfigurationError, Errors::API_KEY_ERROR if options[:api_key].nil?

      if options[:reject_params]&.any? { |param| !param.is_a? String }
        raise Errors::ConfigurationError, Errors::REJECT_PARAMS_ERROR
      end

      if options[:allow_only]&.any? { |param| !param.is_a? String }
        raise Errors::ConfigurationError, Errors::ALLOW_ONLY_ERROR
      end

      if options[:buffer_length] && !options[:buffer_length].is_a?(Integer)
        raise Errors::ConfigurationError, Errors::BUFFER_LENGTH_ERROR
      end

      if options[:development] && !is_a_boolean?(options[:development])
        raise Errors::ConfigurationError, Errors::DEVELOPMENT_ERROR
      end

      if options[:logger] && has_logger_inferface?(options[:logger])
        raise Errors::ConfigurationError, Errors::LOGGER_ERROR
      end
    end

    def has_logger_inferface?(logger)
      [
        :unknown,
        :fatal,
        :error,
        :warn,
        :info,
        :debug
      ].any? { |message| !logger.respond_to? message }
    end

    def is_a_boolean?(arg)
      arg == true || arg == false
    end

    def user_info_invalid?(user_info)
      user_info.nil? ||
        user_info.values.any?(&:nil?) ||
        USER_INFO_KEYS.sort != user_info.keys.sort
    end
  end
end
