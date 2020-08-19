require "readme/har/collection"
require "readme/filter"

module Readme
  module Har
    class RequestSerializer
      def initialize(request, filter = Filter::None.new)
        @request = request
        @filter = filter
      end

      def as_json
        {
          method: @request.request_method,
          queryString: Har::Collection.new(@filter, @request.query_params).to_a,
          url: @request.url,
          httpVersion: @request.http_version,
          headers: Har::Collection.new(@filter, @request.headers).to_a,
          cookies: Har::Collection.new(@filter, @request.cookies).to_a,
          postData: postData,
          headersSize: -1,
          bodySize: @request.content_length
        }.compact
      end

      private

      def postData
        if @request.content_type.nil?
          nil
        else
          {
            text: request_body,
            mimeType: @request.content_type
          }
        end
      end

      def request_body
        parsed_body = JSON.parse(@request.body)
        Har::Collection.new(@filter, parsed_body).to_h.to_json
      rescue
        @request.body
      end
    end
  end
end
