require "readme/har"
require "rack/lint"

RSpec.describe Readme::Har do
  describe "#to_json" do
    it "builds the correct values out of the env" do
      request_json = File.read(File.expand_path("../../fixtures/har_request.json", __FILE__))
      har_request = double( :har_request, as_json: JSON.parse(request_json))
      allow(Readme::HarRequest).to receive(:new).and_return(har_request)

      http_request = double(
        :http_request,
        cookies: { "cookie1" => "value1"},
        http_version: "HTTP/1.1"
      )
      allow(HttpRequest).to receive(:new).and_return(http_request)
      env = double(:env)

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

      response = json.dig("log", "entries", 0, "response")

      expect(response["status"]).to eq status_code
      expect(response["statusText"]).to eq "OK"
      expect(response["httpVersion"]).to eq http_request.http_version
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
          {"name" => "cookie1", "value" => "value1"}
        ]
      )
      expect(response["content"]["text"]).to eq "OK"
      expect(response["content"]["size"]).to eq 2
      expect(response["content"]["mimeType"]).to eq "application/json"
    end
  end
end
