def verify_webhook(body, signature, secret)
  raise 'Missing Signature' unless signature

  parsed = signature.split(',').reduce({ time: -1, readme_signature: '' }){|accum,item|
    k, v = item.split('=')
    if k.eql? 't'
      accum[:time] = v
    end
    if k.eql? 'v0'
      accum[:readme_signature] = v
    end;
    accum
  }

  # Make sure timestamp is recent to prevent replay attacks
  if Time.now.utc - Time.at(0, parsed[:time].to_i, :millisecond).utc > 30.minutes
    raise 'Expired Signature'
  end

  # Verify the signature is valid
  unsigned = parsed[:time] + '.' + body
  mac = OpenSSL::HMAC.hexdigest("SHA256", secret, unsigned)
  if mac != parsed[:readme_signature]
    raise 'Invalid Signature'
  end
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
      puts e.message
      render :json => { error: e.message }, status: 401
      return
    end

    render json: {
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' }
    }
  end
end
