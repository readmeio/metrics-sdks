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

    it 'returns None when neither argument is given' do
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

      it 'handles nested paths correctly' do
        hash = {
          'user' => {
            'name' => 'John',
            'password' => 'secret',
            'details' => {
              'age' => 30,
              'ssn' => '123-45-6789'
            }
          }
        }
        filter = described_class.new(['user.password', 'user.details.ssn'])
        result = filter.filter(hash)

        expect(result).to match(
          'user' => {
            'name' => 'John',
            'password' => '[REDACTED 6]',
            'details' => {
              'age' => 30,
              'ssn' => '[REDACTED 11]'
            }
          }
        )
      end

      it 'handles arrays in paths' do
        hash = {
          'users' => [
            { 'name' => 'John', 'password' => 'secret1' },
            { 'name' => 'Jane', 'password' => 'secret2' }
          ]
        }
        filter = described_class.new(['users[].password'])
        result = filter.filter(hash)

        expect(result).to match(
          'users' => [
            { 'name' => 'John', 'password' => '[REDACTED 7]' },
            { 'name' => 'Jane', 'password' => '[REDACTED 7]' }
          ]
        )
      end

      it 'is case insensitive for paths' do
        hash = {
          'User' => {
            'Password' => 'secret'
          }
        }
        filter = described_class.new(['user.password'])
        result = filter.filter(hash)

        expect(result).to match(
          'User' => {
            'Password' => '[REDACTED 6]'
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

      it 'handles nested paths correctly' do
        hash = {
          'user' => {
            'name' => 'John',
            'email' => 'john@example.com',
            'details' => {
              'age' => 30,
              'ssn' => '123-45-6789'
            }
          }
        }
        filter = described_class.new(['user.name', 'user.details.age'])
        result = filter.filter(hash)

        expect(result).to match(
          'user' => {
            'name' => 'John',
            'email' => '[REDACTED 16]',
            'details' => {
              'age' => 30,
              'ssn' => '[REDACTED 11]'
            }
          }
        )
      end

      it 'handles arrays in paths' do
        hash = {
          'users' => [
            { 'name' => 'John', 'email' => 'john@example.com' },
            { 'name' => 'Jane', 'email' => 'jane@example.com' }
          ]
        }
        filter = described_class.new(['users[].name'])
        result = filter.filter(hash)

        expect(result).to match(
          'users' => [
            { 'name' => 'John', 'email' => '[REDACTED 16]' },
            { 'name' => 'Jane', 'email' => '[REDACTED 16]' }
          ]
        )
      end

      it 'is case insensitive for paths' do
        hash = {
          'User' => {
            'Name' => 'John',
            'Email' => 'john@example.com'
          }
        }
        filter = described_class.new(['user.name'])
        result = filter.filter(hash)

        expect(result).to match(
          'User' => {
            'Name' => 'John',
            'Email' => '[REDACTED 16]'
          }
        )
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
