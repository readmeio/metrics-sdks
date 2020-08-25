require "rack"
require "rack/request"

class HttpRequest
  HTTP_NON_HEADERS = [
    Rack::HTTP_COOKIE,
    Rack::HTTP_VERSION,
    Rack::HTTP_HOST,
    Rack::HTTP_PORT
  ]

  def initialize(env)
    @request = Rack::Request.new(env)
  end

  def url
    @request.url
  end

  def query_params
    @request.GET
  end

  def cookies
    @request.cookies
  end

  def http_version
    @request.get_header(Rack::HTTP_VERSION)
  end

  def request_method
    @request.request_method
  end

  def content_type
    @request.content_type
  end

  def form_data?
    @request.form_data?
  end

  def content_length
    @request.content_length.to_i
  end

  def options?
    @request.request_method == "OPTIONS"
  end

  def headers
    @request
      .each_header
      .select { |key, _| http_header?(key) }
      .to_h
      .transform_keys { |header| normalize_header_name(header) }
  end

  def body
    @request.body.rewind
    content = @request.body.read
    @request.body.rewind

    content
  end

  def parsed_form_data
    @request.POST
  end

  private

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
end
