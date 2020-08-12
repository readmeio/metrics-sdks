require "readme/payload"
require "readme/har"

RSpec.describe Readme::Payload do
  it "returns JSON matching the readmeMetrics schema" do
    har = Readme::Har.new(double)
    result = Readme::Payload.new(har)

    expect(result.to_json).to match_json_schema("readmeMetrics")
  end
end
