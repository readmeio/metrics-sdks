require "rack"
require "readme/har_request"
require "readme/har_collection"
require "http_request"

module Readme
  class Har
    HAR_VERSION = "1.2"

    def initialize(env, response, start_time, end_time, filter)
      @http_request = HttpRequest.new(env)
      @request = HarRequest.new(@http_request, filter)
      @response = response
      @start_time = start_time
      @end_time = end_time
      @filter = filter
    end

    def to_json
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
        name: Readme::Metrics::SDK_NAME,
        version: Readme::Metrics::VERSION
      }
    end

    def entries
      [
        {
          cache: {},
          timings: timings,
          request: request,
          response: response,
          startedDateTime: @start_time.iso8601,
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
      @request.as_json
    end

    def response_body
      if @response.content_type == "application/json"
        begin
          parsed_body = JSON.parse(@response.body.first)
          HarCollection.new(@filter, parsed_body).to_h.to_json
        rescue
          @response.body.each.reduce(:+)
        end
      else
        @response.body.each.reduce(:+)
      end
    end

    def response
      {
        status: @response.status,
        statusText: Rack::Utils::HTTP_STATUS_CODES[@response.status],
        httpVersion: @http_request.http_version,
        headers: HarCollection.new(@filter, @response.headers).to_a,
        content: {
          text: response_body,
          size: @response.content_length,
          mimeType: @response.content_type
        },
        redirectURL: @response.location.to_s,
        headersSize: -1,
        bodySize: @response.content_length,
        cookies: HarCollection.new(@filter, @http_request.cookies).to_a
      }
    end
  end
end
