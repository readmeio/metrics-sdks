require 'readme/har/serializer'
require 'rack/lint'

RSpec.describe Readme::Har::Serializer do
  describe '#to_json' do
    it 'builds the correct values out of the env' do
      request_json = File.read(File.expand_path('../../../fixtures/har_request.json', __FILE__))
      har_request = double(:har_request, as_json: JSON.parse(request_json))
      allow(Readme::Har::RequestSerializer).to receive(:new).and_return(har_request)

      response_json = File.read(File.expand_path('../../../fixtures/har_response.json', __FILE__))
      har_response = double(:har_response, as_json: JSON.parse(response_json))
      allow(Readme::Har::ResponseSerializer).to receive(:new).and_return(har_response)

      http_request = double(
        :http_request,
        cookies: { 'cookie1' => 'value1' },
        http_version: 'HTTP/1.1'
      )
      start_time = Time.now
      end_time = start_time + 1
      har = described_class.new(
        http_request,
        double(:rack_response),
        start_time,
        end_time,
        Readme::Filter::None.new
      )
      json = JSON.parse(har.to_json)

      expect(json).to match_json_schema('har')

      expect(json.dig('log', 'version')).to eq Readme::Har::Serializer::HAR_VERSION
      expect(json.dig('log', 'creator', 'name')).to eq 'readme-metrics (ruby)'
      expect(json.dig('log', 'creator', 'version')).to eq Readme::Metrics::VERSION
      expect(json.dig('log', 'creator', 'comment')).to eq "#{RUBY_PLATFORM}/#{RUBY_VERSION}"
      expect(json.dig('log', 'entries').length).to eq 1
      expect(json.dig('log', 'entries', 0, 'cache')).to be_empty
      expect(json.dig('log', 'entries', 0, 'timings', 'send')).to eq 0
      expect(json.dig('log', 'entries', 0, 'timings', 'receive')).to eq 0
      expect(json.dig('log', 'entries', 0, 'timings', 'wait')).to eq 1000
      expect(json.dig('log', 'entries', 0, 'startedDateTime')).to eq start_time.utc.iso8601(3)
      expect(json.dig('log', 'entries', 0, 'time')).to eq 1000
    end
  end
end
