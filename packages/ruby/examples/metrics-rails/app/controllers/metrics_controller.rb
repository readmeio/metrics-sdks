def verify_webhook(body, signature, secret)
  raise 'Missing Signature' unless signature

  parsed = signature.split(',').each_with_object({ time: -1, readme_signature: '' }) do |item, accum|
    k, v = item.split('=')
    accum[:time] = v if k.eql? 't'
    accum[:readme_signature] = v if k.eql? 'v0'
  end

  # Make sure timestamp is recent to prevent replay attacks
  raise 'Expired Signature' if Time.now.utc - Time.at(0, parsed[:time].to_i, :millisecond).utc > 30.minutes

  # Verify the signature is valid
  unsigned = "#{parsed[:time]}.#{body}"
  mac = OpenSSL::HMAC.hexdigest('SHA256', secret, unsigned)
  raise 'Invalid Signature' if mac != parsed[:readme_signature]
end

class MetricsController < ApplicationController
  def index
    render json: { 'message' => 'hello world' }
  end

  def post
    head :ok
  end

  def webhook
    signature = request.headers['readme-signature']

    begin
      verify_webhook(request.raw_post, signature, ENV.fetch('README_API_KEY', nil))
    rescue RuntimeError => e
      render json: { error: e.message }, status: 401
      return
    end

    render json: {
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' }
    }
  end
end
