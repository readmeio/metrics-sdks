require 'readme/metrics'

module Readme
  class MissingSignatureError < ArgumentError
    def message
      'Missing Signature'
    end
  end

  class ExpiredSignatureError < RuntimeError
    def message
      'Expired Signature'
    end
  end

  class InvalidSignatureError < RuntimeError
    def message
      'Invalid Signature'
    end
  end

  class Webhook
    def self.verify(body, signature, secret)
      raise MissingSignatureError unless signature

      parsed = signature.split(',').each_with_object({ time: -1, readme_signature: '' }) do |item, accum|
        k, v = item.split('=')
        accum[:time] = v if k.eql? 't'
        accum[:readme_signature] = v if k.eql? 'v0'
      end

      # Make sure timestamp is recent to prevent replay attacks
      thirty_minutes = 30 * 60
      raise ExpiredSignatureError if Time.now.utc - Time.at(0, parsed[:time].to_i, :millisecond).utc > thirty_minutes

      # Verify the signature is valid
      unsigned = "#{parsed[:time]}.#{body}"
      mac = OpenSSL::HMAC.hexdigest('SHA256', secret, unsigned)
      raise InvalidSignatureError if mac != parsed[:readme_signature]
    end
  end
end
