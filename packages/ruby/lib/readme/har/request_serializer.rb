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
        elsif @request.form_data?
          {
            params: form_encoded_body,
            mimeType: @request.content_type
          }
        else
          {
            text: request_body,
            mimeType: @request.content_type
          }
        end
      end

      def form_encoded_body
        Har::Collection.new(@filter, @request.parsed_form_data).to_a
      end

      def request_body
        if @filter.pass_through?
          pass_through_body
        else
          # Only JSON allowed for non-pass-through situations. It will raise
          # if the body can't be parsed as JSON, aborting the request.
          json_body
        end
      end

      def json_body
        parsed_body = JSON.parse(@request.body)
        Har::Collection.new(@filter, parsed_body).to_h.to_json
      end

      def pass_through_body
        @request.body
      end
    end
  end
end
