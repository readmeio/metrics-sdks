require 'readme/webhook'
require 'webmock/rspec'

random_api_key = 'rdme_abcdefghijklmnopqrstuvwxyz'

RSpec.describe Readme::Webhook do
  describe '#verify' do
    it 'raises an exception if the signature is empty/missing' do
      expect {
        described_class.verify({ email: 'dom@readme.io' }.to_json, nil, random_api_key)
      }.to raise_error(Readme::MissingSignatureError, 'Missing Signature')
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

      expect {
        described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
      }.to raise_error(Readme::ExpiredSignatureError, 'Expired Signature')
    end

    it 'raises an exception if the signature is not correct' do
      signature = "t=#{(Time.now.utc.to_f * 1000).to_i},v0=abcdefghjkl"

      expect {
        described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
      }.to raise_error(Readme::InvalidSignatureError, 'Invalid Signature')
    end

    it 'does not raise an exception if it validates successfully' do
      time = (Time.now.utc.to_f * 1000).to_i
      body = { email: 'dom@readme.io' }
      unsigned = "#{time}.#{body.to_json}"
      hmac = OpenSSL::HMAC.hexdigest('SHA256', random_api_key, unsigned)
      signature = "t=#{time},v0=#{hmac}"

      expect {
        described_class.verify({ email: 'dom@readme.io' }.to_json, signature, random_api_key)
      }.not_to raise_error
    end
  end
end
