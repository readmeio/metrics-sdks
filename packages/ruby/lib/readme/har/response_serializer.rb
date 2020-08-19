require "rack/utils"
require "readme/har/collection"

module Readme
  module Har
    class ResponseSerializer
      def initialize(request, response, filter)
        @request = request
        @response = response
        @filter = filter
      end

      def as_json
        {
          status: @response.status,
          statusText: Rack::Utils::HTTP_STATUS_CODES[@response.status],
          httpVersion: @request.http_version,
          headers: Har::Collection.new(@filter, @response.headers).to_a,
          content: {
            text: response_body,
            size: @response.content_length,
            mimeType: @response.content_type
          },
          redirectURL: @response.location.to_s,
          headersSize: -1,
          bodySize: @response.content_length,
          cookies: Har::Collection.new(@filter, @request.cookies).to_a
        }
      end

      private

      def response_body
        if @response.content_type == "application/json"
          begin
            parsed_body = JSON.parse(@response.body.first)
            Har::Collection.new(@filter, parsed_body).to_h.to_json
          rescue
            @response.body.each.reduce(:+)
          end
        else
          @response.body.each.reduce(:+)
        end
      end
    end
  end
end
