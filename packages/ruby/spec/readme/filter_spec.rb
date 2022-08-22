require 'readme/filter'

RSpec.describe Readme::Filter do
  describe '.for' do
    it 'returns RejectParams when only reject argument is given' do
      result = described_class.for(reject: ['reject'])
      expect(result).to be_an_instance_of described_class::RejectParams
    end

    it 'returns AllowOnly when only allow_only argument is given' do
      result = described_class.for(allow_only: ['keep'])
      expect(result).to be_an_instance_of described_class::AllowOnly
    end

    it 'returns None when neither arugment is given' do
      result = described_class.for
      expect(result).to be_an_instance_of described_class::None
    end

    it 'raises if both arguments are given' do
      expect {
        described_class.for(reject: ['reject'], allow_only: ['keep'])
      }.to raise_error(described_class::FilterArgsError)
    end
  end

  describe Readme::Filter::RejectParams do
    describe '#filter' do
      it 'redacts the given hash given filter values' do
        hash = { 'keep' => 'kept', 'reject' => 'aaa', 'number' => 1, 'hash' => { ok: 'yes' } }
        result = described_class.new(%w[reject number hash]).filter(hash)

        expect(result).to match(
          {
            'reject' => '[REDACTED 3]',
            'keep' => 'kept',
            'hash' => '[REDACTED]',
            'number' => '[REDACTED]'
          }
        )
      end
    end

    describe '#pass_through?' do
      it 'is false' do
        filter = described_class.new([])

        expect(filter).not_to be_pass_through
      end
    end
  end

  describe Readme::Filter::AllowOnly do
    describe '#filter' do
      it 'returns the given hash with only the given filter values' do
        hash = { 'reject' => 'rejected', 'keep' => 'kept', 'KEEP' => 'kept' }
        result = described_class.new(['keep']).filter(hash)

        expect(result).to match({ 'reject' => '[REDACTED 8]', 'keep' => 'kept', 'KEEP' => 'kept' })
      end
    end

    describe '#pass_through?' do
      it 'is false' do
        filter = described_class.new([])

        expect(filter).not_to be_pass_through
      end
    end
  end

  describe Readme::Filter::None do
    describe '#filter' do
      it 'returns the original hash' do
        hash = { 'reject' => 'rejected', 'keep' => 'kept' }
        result = described_class.new.filter(hash)

        expect(result.keys).to match_array %w[keep reject]
      end
    end

    describe '#pass_through?' do
      it 'is true' do
        filter = described_class.new

        expect(filter).to be_pass_through
      end
    end
  end
end
