require "rack/response"
require "content_type_helper"

class HttpResponse < SimpleDelegator
  include ContentTypeHelper

  def self.from_parts(status, headers, body)
    new(Rack::Response.new(body, status, headers))
  end
end
