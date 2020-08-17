require "spec_helper"
require "readme/har_request"

RSpec.describe Readme::HarRequest do
  describe "#as_json" do
    it "builds valid json" do
      http_request = double(
        :http_request,
        url: "https://example.com/api/foo/bar?id=1&name=joel",
        query_params: {"id" => "1", "name" => "joel"},
        request_method: "POST",
        http_version: "HTTP/1.1",
        content_length: 6,
        content_type: "application/json",
        cookies: {"cookie1" => "value1", "cookie2" => "value2"},
        headers: {"X-Custom" => "custom", "Authorization" => "Basic abc123"},
        body: "[BODY]"
      )
      request = Readme::HarRequest.new(http_request)
      json = request.as_json

      expect(json).to match_json_schema("request")

      expect(json[:method]).to eq "POST"
      expect(json[:url]).to eq "https://example.com/api/foo/bar?id=1&name=joel"
      expect(json[:httpVersion]).to eq "HTTP/1.1"
      expect(json.dig(:postData, :text)).to eq "[BODY]"
      expect(json.dig(:postData, :mimeType)).to eq "application/json"
      expect(json[:headersSize]).to eq(-1)
      expect(json[:bodySize]).to eq 6
      expect(json[:headers]).to match_array(
        [
          {name: "Authorization", value: "Basic abc123"},
          {name: "X-Custom", value: "custom"}
        ]
      )
      expect(json[:queryString]).to match_array(
        [
          {name: "id", value: "1"},
          {name: "name", value: "joel"}
        ]
      )
      expect(json[:cookies]).to match_array(
        [
          {name: "cookie1", value: "value1"},
          {name: "cookie2", value: "value2"}
        ]
      )
    end

    it "returns filtered headers and JSON body" do
      http_request = double(
        :http_request,
        url: "https://example.com/api/foo/bar?id=1&name=joel",
        query_params: {"id" => "1", "name" => "joel"},
        request_method: "POST",
        http_version: "HTTP/1.1",
        content_length: 6,
        content_type: "application/json",
        cookies: {"cookie1" => "value1", "cookie2" => "value2"},
        headers: {
          "X-Custom" => "custom",
          "Authorization" => "Basic abc123",
          "Filtered-Header" => "filtered"
        },
        body: {key1: "key1", key2: "key2"}.to_json
      )
      filter_params = ["Filtered-Header", "key1"]
      request = Readme::HarRequest.new(http_request, filter_params)
      json = request.as_json

      request_body = json.dig(:postData, :text)
      expect(request_body.keys).to_not include "key1"
      expect(request_body.keys).to include "key2"

      request_headers = json[:headers].map { |pair| pair[:name] }
      expect(request_headers).to_not include "Filtered-Header"
    end
  end
end
