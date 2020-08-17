module Readme
  class HarRequest
    def initialize(request)
      @request = request
    end

    def as_json
      {
        method: @request.request_method,
        queryString: to_hash_array(@request.query_params),
        url: @request.url,
        httpVersion: @request.http_version,
        headers: to_hash_array(@request.headers),
        cookies: to_hash_array(@request.cookies),
        postData: {
          text: @request.body,
          mimeType: @request.content_type
        },
        headersSize: -1,
        bodySize: @request.content_length
      }
    end

    private

    def to_hash_array(hash)
      hash.map { |name, value| {name: name, value: value} }
    end
  end
end
