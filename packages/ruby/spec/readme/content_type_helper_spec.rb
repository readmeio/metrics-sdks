require 'readme/content_type_helper'

class FakeRequest
  include Readme::ContentTypeHelper

  attr_reader :content_type

  def initialize(content_type)
    @content_type = content_type
  end
end

RSpec.describe Readme::ContentTypeHelper do
  describe '#json?' do
    it 'is true for all various JSON types' do
      described_class::JSON_MIME_TYPES.each do |mime|
        request = FakeRequest.new(mime)
        expect(request).to be_json
      end
    end

    it 'is true when the content_type has the charset appended' do
      request = FakeRequest.new('application/json; charset=utf-8')
      expect(request).to be_json
    end

    it 'is false for non-json types' do
      request = FakeRequest.new('text/plain')

      expect(request).not_to be_json
    end
  end
end
