# frozen_string_literal: true

require 'readme/metrics/version'
require 'readme/har/serializer'
require 'readme/filter'
require 'readme/payload'
require 'readme/request_queue'
require 'readme/errors'
require 'readme/http_request'
require 'readme/http_response'
require 'httparty'
require 'logger'

module Readme
  class Metrics
    SDK_NAME = 'readme-metrics'
    DEFAULT_BUFFER_LENGTH = 1
    ENDPOINT = URI.join(ENV['README_METRICS_SERVER'] || 'https://metrics.readme.io', '/v1/request')

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
      @@request_queue = options[:request_queue] || Readme::RequestQueue.new(options[:api_key], buffer_length)
      @@logger = options[:logger] || Logger.new($stdout)
    end

    def call(env)
      start_time = Time.now
      status, headers, body = @app.call(env)
      end_time = Time.now

      begin
        response = HttpResponse.from_parts(status, headers, body)
        process_response(
          response: response,
          env: env,
          start_time: start_time,
          end_time: end_time
        )
      rescue => e
        Readme::Metrics.logger.warn "The following error occured when trying to log to the ReadMe metrics API: #{e.message}. Request not logged."
        [status, headers, body]
      end

      [status, headers, body]
    end

    private

    def process_response(response:, env:, start_time:, end_time:)
      request = HttpRequest.new(env)
      har = Har::Serializer.new(request, response, start_time, end_time, @filter)
      user_info = @get_user_info.call(env)
      ip = env['REMOTE_ADDR']

      if !user_info_valid?(user_info)
        Readme::Metrics.logger.warn Errors.bad_block_message(user_info)
      elsif request.options?
        Readme::Metrics.logger.info 'OPTIONS request omitted from ReadMe API logging'
      elsif !can_filter? request, response
        Readme::Metrics.logger.warn "Request or response body MIME type isn't supported for filtering. Omitting request from ReadMe API logging"
      else
        payload = Payload.new(har, user_info, ip, development: @development)
        @@request_queue.push(payload.to_json) unless payload.ignore
      end
    end

    def can_filter?(request, response)
      @filter.pass_through? || can_parse_bodies?(request, response)
    end

    def can_parse_bodies?(request, response)
      parseable_request?(request) && parseable_response?(response)
    end

    def parseable_response?(response)
      response.body.empty? || response.json?
    end

    def parseable_request?(request)
      request.body.empty? || request.json? || request.form_data?
    end

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

      if options[:development] && !a_boolean?(options[:development])
        raise Errors::ConfigurationError, Errors::DEVELOPMENT_ERROR
      end

      if options[:logger] && logger_inferface?(options[:logger])
        raise Errors::ConfigurationError, Errors::LOGGER_ERROR
      end
    end

    def logger_inferface?(logger)
      %i[
        unknown
        fatal
        error
        warn
        info
        debug
      ].any? { |message| !logger.respond_to? message }
    end

    def a_boolean?(arg)
      [true, false].include?(arg)
    end

    # rubocop:disable Style/InverseMethods
    def user_info_valid?(user_info)
      (!user_info.nil? &&
        !user_info.values.any?(&:nil?) &&
        user_info.key?(:api_key)) || user_info.key?(:id)
    end
    # rubocop:enable Style/InverseMethods
  end
end
