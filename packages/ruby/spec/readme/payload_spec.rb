require 'readme/payload'
require 'uuid'

har_json = File.read(File.expand_path('../../fixtures/har.json', __FILE__))

RSpec.describe Readme::Payload do
  let(:har) { double('har', to_json: har_json) }

  let(:uuid) { UUID.new }

  it 'returns JSON matching the payload schema' do
    result = described_class.new(
      har,
      { id: '1', label: 'Owlbert', email: 'owlbert@example.com' },
      development: true
    )

    expect(result.to_json).to match_json_schema('payload')
  end

  it 'substitutes api_key for id' do
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com' },
      development: true
    )

    expect(result.to_json).to match_json_schema('payload')
  end

  it 'accepts a custom log uuid' do
    custom_uuid = uuid.generate
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com', log_id: custom_uuid },
      development: true
    )

    expect(JSON.parse(result.to_json)).to include('logId' => custom_uuid)
    expect(result.to_json).to match_json_schema('payload')
  end

  it 'rejects an invalid log uuid' do
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com', log_id: 'invalid' },
      development: true
    )

    expect(JSON.parse(result.to_json)).not_to include('logId' => 'invalid')
    expect(result.to_json).to match_json_schema('payload')
  end
end
