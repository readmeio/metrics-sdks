require "readme/payload"
require "uuid"

RSpec.describe Readme::Payload do
  before :each do
    har_json = File.read(File.expand_path("../../fixtures/har.json", __FILE__))
    @har = double("har", to_json: har_json)
    @uuid = UUID.new
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

  it "accepts a custom log uuid" do
    uuid = @uuid.generate
    result = Readme::Payload.new(
      @har,
      {api_key: "1", label: "Owlbert", email: "owlbert@example.com", log_id: uuid},
      development: true
    )

    expect(JSON.parse(result.to_json)).to include("logId" => uuid)
    expect(result.to_json).to match_json_schema("payload")
  end

  it "rejects an invalid log uuid" do
    result = Readme::Payload.new(
      @har,
      {api_key: "1", label: "Owlbert", email: "owlbert@example.com", log_id: "invalid"},
      development: true
    )

    expect(JSON.parse(result.to_json)).to_not include("logId" => "invalid")
    expect(result.to_json).to match_json_schema("payload")
  end
end
