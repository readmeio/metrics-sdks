require 'readme/http_response'

RSpec.describe Readme::HttpResponse do
  describe '#body' do
    it 'returns an empty string when the body is nil' do
      response = described_class.from_parts(200, {}, nil)

      expect(response.body).to eq ''
    end

    it 'returns an empty string when the body is an empty array' do
      response = described_class.from_parts(200, {}, [])

      expect(response.body).to eq ''
    end

    it 'concatenates the body when it is an array of strings' do
      response = described_class.from_parts(200, {}, %w[body1 body2])

      expect(response.body).to eq 'body1body2'
    end

    it 'concatenates the body when it is StringIO' do
      body = 'BODY'
      response = described_class.from_parts(200, {}, StringIO.new(body))

      expect(response.body).to eq body
    end

    it 'can be read safely multiple times' do
      body = 'BODY'
      response = described_class.from_parts(200, {}, StringIO.new(body))

      expect(response.body).to eq body
      expect(response.body).to eq body
    end
  end

  describe '#content_length' do
    it 'returns 0 for a response with an empty body status' do
      response = described_class.from_parts(
        204,
        { 'Content-Length' => 53 },
        StringIO.new('BODY')
      )

      expect(response.content_length).to eq 0
    end

    it "returns the body's bytesize when Content-Length header is missing" do
      body = 'BODY'
      response = described_class.from_parts(200, {}, StringIO.new(body))

      expect(response.content_length).to eq body.bytesize
    end

    it 'returns the the value of the Content-Length header when present' do
      response = described_class.from_parts(
        200,
        { 'Content-Length' => 53 },
        StringIO.new('BODY')
      )

      expect(response.content_length).to eq 53
    end
  end
end
