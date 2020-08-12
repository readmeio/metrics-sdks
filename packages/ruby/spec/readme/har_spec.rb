require "readme/har"
require "rack/lint"

RSpec.describe Readme::Har do
  describe "#to_json" do
    it "builds the correct values out of the env" do
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
      status_code = 200
      response_body = ["OK"]
      headers = {
        "Content-Type" => "application/json",
        "Content-Length" => "2",
        "Location" => "https://example.com"
      }
      start_time = Time.now
      end_time = start_time + 1
      har = Readme::Har.new(
        env,
        status_code,
        headers,
        response_body,
        start_time,
        end_time
      )
      json = JSON.parse(har.to_json)

      expect(json).to match_json_schema("har")

      expect(json.dig("log", "version")).to eq Readme::Har::HAR_VERSION
      expect(json.dig("log", "creator", "name")).to eq Readme::Metrics::SDK_NAME
      expect(json.dig("log", "creator", "version")).to eq Readme::Metrics::VERSION
      expect(json.dig("log", "entries").length).to eq 1
      expect(json.dig("log", "entries", 0, "cache")).to be_empty
      expect(json.dig("log", "entries", 0, "timings", "send")).to eq 0
      expect(json.dig("log", "entries", 0, "timings", "receive")).to eq 0
      expect(json.dig("log", "entries", 0, "timings", "wait")).to eq 1000
      expect(json.dig("log", "entries", 0, "startedDateTime")).to eq start_time.iso8601
      expect(json.dig("log", "entries", 0, "time")).to eq 1000

      request = json.dig("log", "entries", 0, "request")

      expect(request["method"]).to eq "POST"
      expect(request["url"]).to eq "https://example.com/api/foo/bar?id=1&name=joel"
      expect(request["httpVersion"]).to eq "HTTP/1.1"
      expect(request.dig("postData", "text")).to eq "[BODY]"
      expect(request.dig("postData", "mimeType")).to eq "application/json"
      expect(request["headersSize"]).to eq(-1)
      expect(request["bodySize"]).to eq 0
      expect(request["headers"]).to match_array(
        [
          {"name" => "Authorization", "value" => "Basic abc123"},
          {"name" => "X-Custom", "value" => "custom"}
        ]
      )
      expect(request["queryString"]).to match_array(
        [
          {"name" => "id", "value" => "1"},
          {"name" => "name", "value" => "joel"}
        ]
      )
      expect(request["cookies"]).to match_array(
        [
          {"name" => "cookie1", "value" => "value1"},
          {"name" => "cookie2", "value" => "value2"}
        ]
      )

      response = json.dig("log", "entries", 0, "response")

      expect(response["status"]).to eq status_code
      expect(response["statusText"]).to eq "OK"
      expect(response["headers"]).to match_array(
        [
          {"name" => "Content-Type", "value" => "application/json"},
          {"name" => "Content-Length", "value" => "2"},
          {"name" => "Location", "value" => "https://example.com"}
        ]
      )
      expect(response["headersSize"]).to eq(-1)
      expect(response["bodySize"]).to eq 2
      expect(response["redirectURL"]).to eq headers["Location"]
      expect(response["cookies"]).to match_array(
        [
          {"name" => "cookie1", "value" => "value1"},
          {"name" => "cookie2", "value" => "value2"}
        ]
      )
      expect(response["content"]["text"]).to eq "OK"
      expect(response["content"]["size"]).to eq 2
      expect(response["content"]["mimeType"]).to eq "application/json"
    end
  end
end
