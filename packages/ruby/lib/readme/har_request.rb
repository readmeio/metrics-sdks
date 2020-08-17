module Readme
  class HarRequest
    def initialize(request, filter_params = [])
      @request = request
      @filter_params = filter_params
    end

    def as_json
      {
        method: @request.request_method,
        queryString: filtered_hash_array(@request.query_params),
        url: @request.url,
        httpVersion: @request.http_version,
        headers: filtered_hash_array(@request.headers),
        cookies: filtered_hash_array(@request.cookies),
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
      filter_hash_with_params(parsed_body)
    rescue
      @request.body
    end

    def to_hash_array(hash)
      hash.map { |name, value| {name: name, value: value} }
    end

    def filter_hash_with_params(hash)
      hash.select { |key, _value| !@filter_params.include?(key) }
    end

    def filter_hash_array_with_params(array)
      array.select { |pair| !@filter_params.include? pair[:name] }
    end

    def filtered_hash_array(hash)
      as_array = to_hash_array(hash)
      filter_hash_array_with_params(as_array)
    end
  end
end
