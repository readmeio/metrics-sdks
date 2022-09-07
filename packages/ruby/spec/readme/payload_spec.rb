require 'readme/payload'
require 'socket'
require 'securerandom'

har_json = File.read(File.expand_path('../../fixtures/har.json', __FILE__))

RSpec.describe Readme::Payload do
  let(:har) { double('har', to_json: har_json) }
  let(:ip_address) { Socket.ip_address_list.detect(&:ipv4_private?).ip_address }

  it 'returns JSON matching the payload schema' do
    result = described_class.new(
      har,
      { id: '1', label: 'Owlbert', email: 'owlbert@example.com' },
      ip_address,
      development: true
    )

    expect(result.to_json).to match_json_schema('payload')
  end

  it 'substitutes api_key for id' do
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com' },
      ip_address,
      development: true
    )

    expect(result.to_json).to match_json_schema('payload')
  end

  it 'accepts a custom log uuid' do
    custom_uuid = SecureRandom.uuid
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com', log_id: custom_uuid },
      ip_address,
      development: true
    )

    expect(JSON.parse(result.to_json)).to include('_id' => custom_uuid)
    expect(result.to_json).to match_json_schema('payload')
  end

  it 'rejects an invalid log uuid' do
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com', log_id: 'invalid' },
      ip_address,
      development: true
    )

    expect(JSON.parse(result.to_json)).not_to include('_id' => 'invalid')
    expect(result.to_json).to match_json_schema('payload')
  end

  it 'record a clientIPAddress' do
    result = described_class.new(
      har,
      { api_key: '1', label: 'Owlbert', email: 'owlbert@example.com' },
      ip_address,
      development: true
    )

    expect(JSON.parse(result.to_json)).to include('clientIPAddress' => ip_address)
    expect(result.to_json).to match_json_schema('payload')
  end
end
