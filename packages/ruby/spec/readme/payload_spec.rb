require "readme/payload"

RSpec.describe Readme::Payload do
  before :each do
    har_json = File.read(File.expand_path("../../fixtures/har.json", __FILE__))
    @har = double("har", to_json: har_json)
  end

  it "returns JSON matching the payload schema" do
    result = Readme::Payload.new(
      @har,
      {id: "1", label: "Owlbert", email: "owlbert@example.com"},
      development: true
    )

    expect(result.to_json).to match_json_schema("payload")
  end

  it "substitues api_key for id" do
    result = Readme::Payload.new(
      @har,
      {api_key: "1", label: "Owlbert", email: "owlbert@example.com"},
      development: true
    )

    expect(result.to_json).to match_json_schema("payload")
  end
end
