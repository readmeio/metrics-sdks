require 'readme/mask'
require 'rack'
require 'rack/request'
require_relative 'content_type_helper'

module Readme
  class HttpRequest
    include ContentTypeHelper

    IS_RACK_V3 = Gem.loaded_specs['rack'].version > Gem::Version.create('3.0')

    # rubocop:disable Style/MutableConstant
    HTTP_NON_HEADERS = [
      Rack::HTTP_COOKIE,
      Rack::HTTP_HOST,
      Rack::HTTP_PORT
    ]
    # rubocop:enable Style/MutableConstant

    if IS_RACK_V3
      HTTP_NON_HEADERS.push(Rack::SERVER_PROTOCOL)
    else
      HTTP_NON_HEADERS.push(Rack::HTTP_VERSION)
    end

    HTTP_NON_HEADERS.freeze

    def initialize(env)
      # Sanitize the auth header, if it exists
      env['HTTP_AUTHORIZATION'] = Readme::Mask.mask(env['HTTP_AUTHORIZATION']) if env.key?('HTTP_AUTHORIZATION')
      @request = Rack::Request.new(env)

      return unless IS_RACK_V3

      @input = Rack::RewindableInput.new(@request.body)
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
      if IS_RACK_V3
        @request.get_header(Rack::SERVER_PROTOCOL)
      else
        @request.get_header(Rack::HTTP_VERSION)
      end
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
      @request.request_method == 'OPTIONS'
    end

    def headers
      @request
        .each_header
        .select { |key, _| http_header?(key) }
        .to_h
        .transform_keys { |header| normalize_header_name(header) }
        .merge unprefixed_headers
        .merge host_header
    end

    def body
      if IS_RACK_V3
        read_body(@input)
      else
        read_body(@request.body)
      end
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
      name.start_with?('HTTP') && !HTTP_NON_HEADERS.include?(name)
    end

    # Headers like `Content-Type: application/json` come into rack like
    # `"HTTP_CONTENT_TYPE" => "application/json"`.
    def normalize_header_name(header)
      header.delete_prefix('HTTP_').split('_').map(&:capitalize).join('-')
    end

    # These special headers are explicitly _not_ prefixed with HTTP_ in the Rack
    # env so we need to add them in manually
    def unprefixed_headers
      {
        'Content-Type' => @request.content_type,
        'Content-Length' => @request.content_length
      }.compact
    end

    def host_header
      {
        'Host' => @request.host
      }.compact
    end

    def read_body(io)
      return '' if io.nil?

      io.rewind if io.respond_to?(:rewind)
      content = io.read || ''
      io.rewind if io.respond_to?(:rewind)
      content
    rescue => e
      Readme::Metrics.logger.warn "Error reading request body: #{e.message}"
      ''
    end
  end
end
