require 'readme/webhook'
require 'webmock/rspec'

random_api_key = 'rdme_abcdefghijklmnopqrstuvwxyz'

RSpec.describe Readme::Webhook do
  describe '#verify' do
    it 'raises an exception if the signature is empty/missing' do
      described_class.verify({ email: 'dom@readme.io' }.to_json, nil, random_api_key)
    rescue Readme::MissingSignatureError => e
      expect(e.message).to eq 'Missing Signature'
    end

    it 'raises an exception with an expired signature' do
      # The expiry time for the HMAC is 30 mins, so here we're
      # creating an expired one which is 40 mins old
      forty_mins = 40 * 60
      time = Time.now.utc - forty_mins
      body = { email: 'dom@readme.io' }
      unsigned = "#{(time.to_f * 1000).to_i}.#{body.to_json}"
      hmac = OpenSSL::HMAC.hexdigest('SHA256', random_api_key, unsigned)
      signature = "t=#{(time.to_f * 1000).to_i},v0=#{hmac}"

      begin
        described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
      rescue Readme::ExpiredSignatureError => e
        expect(e.message).to eq 'Expired Signature'
      end
    end

    it 'raises an exception if the signature is not correct' do
      signature = "t=#{(Time.now.utc.to_f * 1000).to_i},v0=abcdefghjkl"

      begin
        described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
      rescue Readme::InvalidSignatureError => e
        expect(e.message).to eq 'Invalid Signature'
      end
    end

    it 'does not raise an exception if it validates successfully' do
      time = (Time.now.utc.to_f * 1000).to_i
      body = { email: 'dom@readme.io' }
      unsigned = "#{time}.#{body.to_json}"
      hmac = OpenSSL::HMAC.hexdigest('SHA256', random_api_key, unsigned)
      signature = "t=#{time},v0=#{hmac}"

      described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
    end
  end
end
