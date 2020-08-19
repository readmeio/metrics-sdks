require "readme/payload"

RSpec.describe Readme::Payload do
  it "returns JSON matching the payload schema" do
    har_json = File.read(File.expand_path("../../fixtures/har.json", __FILE__))
    har = double("har", to_json: har_json)
    result = Readme::Payload.new(
      har,
      {id: "1", label: "Anthony", email: "anthony@example.com"},
      development: true
    )

    expect(result.to_json).to match_json_schema("payload")
  end
end
