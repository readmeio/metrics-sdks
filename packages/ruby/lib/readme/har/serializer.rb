# frozen_string_literal: true

require 'rack'
require 'readme/metrics'
require 'readme/har/request_serializer'
require 'readme/har/response_serializer'
require 'readme/har/collection'

module Readme
  module Har
    class Serializer
      HAR_VERSION = '1.2'

      def initialize(request, response, start_time, end_time, filter)
        @http_request = request
        @response = response
        @start_time = start_time
        @end_time = end_time
        @filter = filter
      end

      def to_json(*_args)
        {
          log: {
            version: HAR_VERSION,
            creator: creator,
            entries: entries
          }
        }.to_json
      end

      private

      def creator
        {
          name: 'readme-metrics (ruby)',
          version: Readme::Metrics::VERSION,
          comment: "#{RUBY_PLATFORM}/#{RUBY_VERSION}" # arm64-darwin21/2.7.2
        }
      end

      def entries
        [
          {
            cache: {},
            timings: timings,
            request: request,
            response: response,
            startedDateTime: @start_time.utc.iso8601(3),
            time: elapsed_time
          }
        ]
      end

      def timings
        {
          send: 0,
          receive: 0,
          wait: elapsed_time
        }
      end

      def elapsed_time
        ((@end_time - @start_time) * 1000).to_i
      end

      def request
        Har::RequestSerializer.new(@http_request, @filter).as_json
      end

      def response
        Har::ResponseSerializer.new(@http_request, @response, @filter).as_json
      end
    end
  end
end
