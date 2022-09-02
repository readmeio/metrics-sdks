require 'rack'
require 'rack/response'
require_relative 'content_type_helper'

module Readme
  class HttpResponse < SimpleDelegator
    include ContentTypeHelper

    def self.from_parts(status, headers, body)
      new(Rack::Response.new(body, status, headers))
    end

    def body
      if raw_body.respond_to?(:rewind)
        raw_body.rewind
        content = raw_body.each.sum('')
        raw_body.rewind

        content
      else
        raw_body.each.sum('')
      end
    end

    def content_length
      if empty_body_status?
        0
      elsif !headers['Content-Length']
        body.bytesize
      else
        headers['Content-Length'].to_i
      end
    end

    private

    def raw_body
      __getobj__.body
    end

    def empty_body_status?
      Rack::Utils::STATUS_WITH_NO_ENTITY_BODY.include?(status.to_i)
    end
  end
end
