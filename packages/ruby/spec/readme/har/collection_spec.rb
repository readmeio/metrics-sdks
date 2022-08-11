require 'readme/har/collection'

RSpec.describe Readme::Har::Collection do
  describe '#to_h' do
    it 'returns a hash with filtering applied' do
      hash = { keep: 'keep', reject: 'reject' }
      filter = double(filter: { keep: 'kept' })
      collection = described_class.new(filter, hash)

      expect(collection.to_h).to eq({ keep: 'kept' })
    end
  end

  describe '#to_a' do
    it 'returns an array with filtering applied' do
      hash = { keep: 'keep', reject: 'reject' }
      filter = double(filter: { keep: 'kept' })
      collection = described_class.new(filter, hash)

      expect(collection.to_a).to eq([{ name: :keep, value: 'kept' }])
    end
  end
end
