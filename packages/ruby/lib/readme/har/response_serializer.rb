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
          content: content,
          redirectURL: @response.location.to_s,
          headersSize: -1,
          bodySize: @response.content_length,
          cookies: Har::Collection.new(@filter, @request.cookies).to_a
        }
      end

      private

      def content
        if response_body.nil?
          empty_content
        elsif @response.json?
          json_content
        else
          pass_through_content
        end
      end

      def empty_content
        {mimeType: "", size: 0}
      end

      def json_content
        parsed_body = JSON.parse(response_body)

        {mimeType: @response.content_type,
         size: @response.content_length,
         text: Har::Collection.new(@filter, parsed_body).to_h.to_json}
      rescue
        pass_through_content
      end

      def pass_through_content
        {mimeType: @response.content_type,
         size: @response.content_length,
         text: response_body}
      end

      def response_body
        if @response.body.nil?
          nil
        elsif @response.body.respond_to?(:rewind)
          @response.body.rewind
          body = @response.body.each.reduce(:+)
          @response.body.rewind

          body
        else
          @response.body.each.reduce(:+)
        end
      end
    end
  end
end
