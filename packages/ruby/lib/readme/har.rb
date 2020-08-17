require "rack"
require "readme/har_request"
require "http_request"

module Readme
  class Har
    HAR_VERSION = "1.2"

    def initialize(env, status, headers, response, start_time, end_time)
      @http_request = HttpRequest.new(env)
      @request = HarRequest.new(@http_request)
      @response = Rack::Response.new(response, status, headers)
      @start_time = start_time
      @end_time = end_time
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

    def response
      {
        status: @response.status,
        statusText: Rack::Utils::HTTP_STATUS_CODES[@response.status],
        httpVersion: @http_request.http_version,
        headers: to_hash_array(@response.headers),
        content: {
          text: @response.body.each.reduce(:+),
          size: @response.content_length,
          mimeType: @response.content_type
        },
        redirectURL: @response.location.to_s,
        headersSize: -1,
        bodySize: @response.content_length,
        cookies: to_hash_array(@http_request.cookies)
      }
    end

    def to_hash_array(hash)
      hash.map { |name, value| {name: name, value: value} }
    end
  end
end
