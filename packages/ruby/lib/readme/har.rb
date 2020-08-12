require "rack"
require "rack/request"

module Readme
  class Har
    HAR_VERSION = "1.2"
    HTTP_NON_HEADERS = [
      Rack::HTTP_COOKIE,
      Rack::HTTP_VERSION,
      Rack::HTTP_HOST,
      Rack::HTTP_PORT
    ]

    def initialize(env, status, headers, response, start_time, end_time)
      @env = Rack::Request.new(env)
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
      {
        method: @env.request_method,
        queryString: to_hash_array(@env.GET),
        url: @env.url,
        httpVersion: @env.get_header("HTTP_VERSION"),
        headers: http_headers,
        cookies: cookies,
        postData: {
          text: request_body,
          mimeType: @env.content_type
        },
        headersSize: -1,
        bodySize: @env.content_length.to_i
      }
    end

    def http_headers
      @env
        .each_header
        .select { |key, _| http_header?(key) }
        .map do |header, value|
          {name: normalize_header_name(header), value: value}
        end
    end

    # "headers" in Rack::Request just means any key in the env. The HTTP headers
    # are all the headers prefixed with `HTTP_` as per the spec:
    # https://github.com/rack/rack/blob/master/SPEC.rdoc#the-environment-
    # Other "headers" like version and host are prefixed with `HTTP_` by Rack but
    # don't seem to be considered legit HTTP headers.
    def http_header?(name)
      name.start_with?("HTTP") && !HTTP_NON_HEADERS.include?(name)
    end

    # Headers like `Content-Type: application/json` come into rack like
    # `"HTTP_CONTENT_TYPE" => "application/json"`.
    def normalize_header_name(header)
      header.delete_prefix("HTTP_").split("_").map(&:capitalize).join("-")
    end

    def request_body
      @env.body.rewind
      body = @env.body.read
      @env.body.rewind

      body
    end

    def cookies
      to_hash_array(@env.cookies)
    end

    def response
      {
        status: @response.status,
        statusText: Rack::Utils::HTTP_STATUS_CODES[@response.status],
        httpVersion: @env.get_header("HTTP_VERSION"),
        headers: to_hash_array(@response.headers),
        content: {
          text: @response.body.each.reduce(:+),
          size: @response.content_length,
          mimeType: @response.content_type
        },
        redirectURL: @response.location.to_s,
        headersSize: -1,
        bodySize: @response.content_length,
        cookies: cookies
      }
    end

    def to_hash_array(hash)
      hash.map { |name, value| {name: name, value: value} }
    end
  end
end
