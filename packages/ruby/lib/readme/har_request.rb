require "readme/har_collection"

module Readme
  class HarRequest
    def initialize(request, filter = Filter::None.new)
      @request = request
      @filter = filter
    end

    def as_json
      {
        method: @request.request_method,
        queryString: HarCollection.new(@filter, @request.query_params).to_a,
        url: @request.url,
        httpVersion: @request.http_version,
        headers: HarCollection.new(@filter, @request.headers).to_a,
        cookies: HarCollection.new(@filter, @request.cookies).to_a,
        postData: {
          text: request_body,
          mimeType: @request.content_type
        },
        headersSize: -1,
        bodySize: @request.content_length
      }
    end

    private

    def request_body
      parsed_body = JSON.parse(@request.body)
      HarCollection.new(@filter, parsed_body).to_h.to_json
    rescue
      @request.body
    end
  end
end
