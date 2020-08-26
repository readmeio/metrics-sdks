require "readme/filter"

RSpec.describe Filter do
  describe ".for" do
    it "returns RejectParams when only reject argument is given" do
      result = Filter.for(reject: ["reject"])
      expect(result).to be_an_instance_of Filter::RejectParams
    end

    it "returns AllowOnly when only allow_only argument is given" do
      result = Filter.for(allow_only: ["keep"])
      expect(result).to be_an_instance_of Filter::AllowOnly
    end

    it "returns None when neither arugment is given" do
      result = Filter.for
      expect(result).to be_an_instance_of Filter::None
    end

    it "raises if both arguments are given" do
      expect {
        Filter.for(reject: ["reject"], allow_only: ["keep"])
      }.to raise_error(Filter::FilterArgsError)
    end
  end
end

RSpec.describe Filter::RejectParams do
  describe "#filter" do
    it "returns the given hash without the given filter values" do
      hash = {"reject" => "rejected", "keep" => "kept"}
      result = Filter::RejectParams.new(["reject"]).filter(hash)

      expect(result.keys).to eq ["keep"]
    end
  end

  describe "#pass_through?" do
    it "is false" do
      filter = Filter::RejectParams.new([])

      expect(filter).not_to be_pass_through
    end
  end
end

RSpec.describe Filter::AllowOnly do
  describe "#filter" do
    it "returns the given hash with only the given filter values" do
      hash = {"reject" => "rejected", "keep" => "kept"}
      result = Filter::AllowOnly.new(["keep"]).filter(hash)

      expect(result.keys).to eq ["keep"]
    end
  end

  describe "#pass_through?" do
    it "is false" do
      filter = Filter::AllowOnly.new([])

      expect(filter).not_to be_pass_through
    end
  end
end

RSpec.describe Filter::None do
  describe "#filter" do
    it "returns the original hash" do
      hash = {"reject" => "rejected", "keep" => "kept"}
      result = Filter::None.new.filter(hash)

      expect(result.keys).to match_array ["keep", "reject"]
    end
  end

  describe "#pass_through?" do
    it "is true" do
      filter = Filter::None.new

      expect(filter).to be_pass_through
    end
  end
end
