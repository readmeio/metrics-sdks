require "rack/request"

module Readme
  class HarRequest
    HTTP_NON_HEADERS = [
      Rack::HTTP_COOKIE,
      Rack::HTTP_VERSION,
      Rack::HTTP_HOST,
      Rack::HTTP_PORT
    ]

    def initialize(env)
      @env = Rack::Request.new(env)
    end

    def as_json
      {
        method: @env.request_method,
        queryString: to_hash_array(@env.GET),
        url: @env.url,
        httpVersion: http_version,
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

    def cookies
      to_hash_array(@env.cookies)
    end

    def http_version
      @env.get_header("HTTP_VERSION")
    end

    private

    def to_hash_array(hash)
      hash.map { |name, value| {name: name, value: value} }
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
  end
end
