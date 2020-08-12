require "readme/har"

RSpec.describe Readme::Har do
  it "returns a valid har object" do
    har = Readme::Har.new(double)

    expect(har.to_json).to match_json_schema("har")
  end
end
