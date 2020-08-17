require "spec_helper"
require "readme/har_request"

RSpec.describe Readme::HarRequest do
  describe "#as_json" do
    it "builds valid json" do
      env = {
        "CONTENT_TYPE" => "application/json",
        "CONTENT_LENGTH" => 0,
        "HTTP_AUTHORIZATION" => "Basic abc123",
        "HTTP_COOKIE" => "cookie1=value1; cookie2=value2",
        "HTTP_VERSION" => "HTTP/1.1",
        "HTTP_X_CUSTOM" => "custom",
        "PATH_INFO" => "/foo/bar",
        "REQUEST_METHOD" => "POST",
        "SCRIPT_NAME" => "/api",
        "QUERY_STRING" => "id=1&name=joel",
        "SERVER_NAME" => "example.com",
        "SERVER_PORT" => "443",
        "rack.input" => Rack::Lint::InputWrapper.new(StringIO.new("[BODY]")),
        "rack.url_scheme" => "https"
      }
      request = Readme::HarRequest.new(env)
      json = request.as_json

      expect(json).to match_json_schema("request")

      expect(json[:method]).to eq "POST"
      expect(json[:url]).to eq "https://example.com/api/foo/bar?id=1&name=joel"
      expect(json[:httpVersion]).to eq "HTTP/1.1"
      expect(json.dig(:postData, :text)).to eq "[BODY]"
      expect(json.dig(:postData, :mimeType)).to eq "application/json"
      expect(json[:headersSize]).to eq(-1)
      expect(json[:bodySize]).to eq 0
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
  end

  describe "#cookies" do
    it "returns the cookies as an array of name/value hashes" do
      env = {
        "HTTP_COOKIE" => "cookie1=value1; cookie2=value2"
      }

      request = Readme::HarRequest.new(env)

      expect(request.cookies).to match_array(
        [
          {name: "cookie1", value: "value1"},
          {name: "cookie2", value: "value2"}
        ]
      )
    end
  end

  describe "#http_version" do
    it "returns the version from the ENV" do
      env = {
        "HTTP_VERSION" => "HTTP/1.1"
      }

      request = Readme::HarRequest.new(env)

      expect(request.http_version).to eq "HTTP/1.1"
    end
  end
end
