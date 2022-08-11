require 'cgi'
require 'readme/har/collection'
require 'readme/filter'

module Readme
  module Har
    class RequestSerializer
      def initialize(request, filter = Readme::Filter::None.new)
        @request = request
        @filter = filter
      end

      def as_json
        {
          method: @request.request_method,
          queryString: Har::Collection.new(@filter, @request.query_params).to_a,
          url: url,
          httpVersion: @request.http_version,
          headers: Har::Collection.new(@filter, @request.headers).to_a,
          cookies: Har::Collection.new(@filter, @request.cookies).to_a,
          postData: post_data,
          headersSize: -1,
          bodySize: @request.content_length
        }.compact
      end

      private

      def url
        url = URI(@request.url)
        headers = @request.headers
        forward_proto = headers['X-Forwarded-Proto']
        forward_host = headers['X-Forwarded-Host']
        url.host = forward_host if forward_host.is_a?(String)
        url.scheme = forward_proto if forward_proto.is_a?(String)
        url.to_s
      end

      def post_data
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
        elsif form_urlencoded?
          form_urlencoded_body
        elsif json?
          json_body
        else
          @request.body
        end
      end

      def json?
        ['application/json', 'application/x-json', 'text/json', 'text/x-json']
          .include?(@request.content_type) || @request.content_type.include?('+json')
      end

      def form_urlencoded?
        @request.content_type == 'application/x-www-form-urlencoded'
      end

      def json_body
        parsed_body = JSON.parse(@request.body)
        Har::Collection.new(@filter, parsed_body).to_h.to_json
      end

      def form_urlencoded_body
        parsed_body = CGI.parse(@request.body).transform_values(&:first)
        Har::Collection.new(@filter, parsed_body).to_h.to_json
      end

      def pass_through_body
        @request.body
      end
    end
  end
end
