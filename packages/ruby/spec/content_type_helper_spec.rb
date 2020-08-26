require "content_type_helper"

RSpec.describe ContentTypeHelper do
  describe "#json?" do
    it "is true for all various JSON types" do
      ContentTypeHelper::JSON_MIME_TYPES.each do |mime|
        request = FakeRequest.new(mime)
        expect(request).to be_json
      end
    end

    it "is false for non-json types" do
      request = FakeRequest.new("text/plain")

      expect(request).not_to be_json
    end
  end

  class FakeRequest
    include ContentTypeHelper

    attr_reader :content_type

    def initialize(content_type)
      @content_type = content_type
    end
  end
end
